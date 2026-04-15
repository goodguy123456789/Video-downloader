import path from 'path'
import { BrowserWindow } from 'electron'
import type { DownloadTask } from './downloadTask'
import { createDownloadTask } from './downloadTask'
import { runYtdlp } from '../ytdlp/ytdlpRunner'
import { parseProgressLine } from '../ytdlp/progressParser'
import { addHistory } from '../history/historyStore'
import { getFileSize } from '../../utils/fileUtils'
import { IPC_CHANNELS } from '../../../preload/types'
import { getCookieArgs, getProxyArgs } from '../settings/settingsStore'

const MAX_CONCURRENT = 3
const tasks = new Map<string, DownloadTask>()

/** 获取当前正在进行的下载数量 */
function getActiveCount(): number {
  let count = 0
  tasks.forEach((t) => { if (t.status === 'downloading') count++ })
  return count
}

/** 向所有渲染窗口广播事件 */
function broadcast(channel: string, data: unknown): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data)
    }
  })
}

/** 开始下载任务 */
export async function startDownload(params: {
  url: string
  formatId: string
  outputDir: string
  title: string
  thumbnail: string
  formatLabel: string
}): Promise<string> {
  // 并发限制
  if (getActiveCount() >= MAX_CONCURRENT) {
    throw new Error(`最多同时下载 ${MAX_CONCURRENT} 个任务`)
  }

  const task = createDownloadTask(params)
  tasks.set(task.taskId, task)

  // 异步执行下载，不阻塞返回
  executeDownload(task).catch((err) => {
    console.error(`[downloadManager] 下载任务 ${task.taskId} 异常:`, err)
  })

  return task.taskId
}

/** 执行具体下载 */
async function executeDownload(task: DownloadTask): Promise<void> {
  task.status = 'downloading'

  const outputTemplate = path.join(task.outputDir, '%(title)s.%(ext)s')
  const args = [
    '-f', task.formatId,
    '--merge-output-format', 'mp4',
    '-o', outputTemplate,
    '--newline',
    '--no-part',
    '--no-playlist',
    ...getCookieArgs(),
    ...getProxyArgs(),
    task.url
  ]

  return new Promise((resolve) => {
    const runner = runYtdlp({
      args,
      timeout: 0, // 下载不设超时
      onOutput: (line) => {
        const parsed = parseProgressLine(line)
        if (!parsed) return

        if (parsed.percent !== undefined) task.percent = parsed.percent
        if (parsed.speed !== undefined) task.speed = parsed.speed
        if (parsed.eta !== undefined) task.eta = parsed.eta
        if (parsed.filename !== undefined) task.filename = parsed.filename

        broadcast(IPC_CHANNELS.DOWNLOAD_PROGRESS, {
          taskId: task.taskId,
          percent: task.percent,
          speed: task.speed,
          eta: task.eta,
          filename: task.filename
        })
      },
      onError: (line) => {
        console.error(`[yt-dlp stderr] ${line}`)
        if (line.includes('ERROR:')) {
          task.error = (task.error ?? '') + line + '\n'
        }
      },
      onExit: async (code) => {
        if (code === 0 || task.percent >= 99) {
          task.status = 'completed'
          task.percent = 100

          // 计算文件大小
          let filePath = task.filename
          if (!path.isAbsolute(filePath)) {
            filePath = path.join(task.outputDir, filePath)
          }
          task.filePath = filePath
          task.fileSize = await getFileSize(filePath)

          // 写入历史
          await addHistory({
            title: task.title,
            thumbnail: task.thumbnail,
            url: task.url,
            filePath: task.filePath,
            fileSize: task.fileSize,
            formatLabel: task.formatLabel
          }).catch((err) => console.error('[history] 写入失败:', err))

          broadcast(IPC_CHANNELS.DOWNLOAD_COMPLETED, {
            taskId: task.taskId,
            filePath: task.filePath,
            fileSize: task.fileSize
          })
        } else {
          task.status = 'failed'
          const errMsg = task.error ?? `yt-dlp 退出码: ${code}`
          broadcast(IPC_CHANNELS.DOWNLOAD_FAILED, {
            taskId: task.taskId,
            error: errMsg
          })
        }

        resolve()
      }
    })

    task.runner = runner
    tasks.set(task.taskId, task)
  })
}

/** 取消下载 */
export function cancelDownload(taskId: string): boolean {
  const task = tasks.get(taskId)
  if (!task) return false
  if (task.status !== 'downloading' && task.status !== 'pending') return false

  task.status = 'cancelled'
  task.runner?.kill()
  tasks.delete(taskId)

  broadcast(IPC_CHANNELS.DOWNLOAD_FAILED, {
    taskId,
    error: '用户取消了下载'
  })

  return true
}

/** 应用退出时清理所有进行中的任务 */
export function cleanupAll(): void {
  tasks.forEach((task) => {
    if (task.status === 'downloading') {
      task.runner?.kill()
    }
  })
  tasks.clear()
}
