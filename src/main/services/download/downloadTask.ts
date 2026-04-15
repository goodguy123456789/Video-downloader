import type { DownloadStatus } from '../../../preload/types'
import type { RunnerResult } from '../ytdlp/ytdlpRunner'

export interface DownloadTask {
  taskId: string
  url: string
  formatId: string
  outputDir: string
  title: string
  thumbnail: string
  formatLabel: string
  status: DownloadStatus
  percent: number
  speed: string
  eta: string
  filename: string
  filePath: string
  fileSize: number
  error?: string
  runner?: RunnerResult
  createdAt: number
}

/** 创建新的下载任务 */
export function createDownloadTask(params: {
  url: string
  formatId: string
  outputDir: string
  title: string
  thumbnail: string
  formatLabel: string
}): DownloadTask {
  return {
    taskId: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...params,
    status: 'pending',
    percent: 0,
    speed: '',
    eta: '',
    filename: '',
    filePath: '',
    fileSize: 0,
    createdAt: Date.now()
  }
}
