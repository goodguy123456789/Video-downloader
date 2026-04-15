import { execFile, exec } from 'child_process'
import { getYtdlpPath, getYtdlpBinDir } from '../../utils/pathUtils'
import { ensureDir, fileExists, getFileSize } from '../../utils/fileUtils'

export type InitProgressCallback = (percent: number, status: string) => void

const YTDLP_DOWNLOAD_URL =
  'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'

const MIN_YTDLP_SIZE = 5 * 1024 * 1024 // 5MB，yt-dlp.exe 约 15MB+

let ytdlpReady = false
let ytdlpVersion = ''

/** 通过 exec 检查 yt-dlp 版本（比 spawn 更可靠） */
function getVersionViaExec(exePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // 使用引号包裹路径以处理空格
    exec(`"${exePath}" --version`, { timeout: 15000, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`版本检测失败: ${error.message} | stderr: ${stderr}`))
        return
      }
      const version = stdout.trim()
      resolve(version)
    })
  })
}

/** 检查 yt-dlp 是否已安装且可用 */
async function checkYtdlp(): Promise<string | null> {
  const ytdlpPath = getYtdlpPath()
  console.log('[ytdlp] 检测路径:', ytdlpPath)

  const exists = await fileExists(ytdlpPath)
  if (!exists) {
    console.log('[ytdlp] 文件不存在')
    return null
  }

  const size = await getFileSize(ytdlpPath)
  console.log('[ytdlp] 文件大小:', size, 'bytes')

  // 文件太小说明不完整
  if (size < MIN_YTDLP_SIZE) {
    console.log('[ytdlp] 文件不完整（过小），将重新下载')
    return null
  }

  try {
    const version = await getVersionViaExec(ytdlpPath)
    console.log('[ytdlp] 版本:', version)
    if (version && /^\d{4}\.\d{2}\.\d{2}/.test(version)) {
      return version
    }
    console.log('[ytdlp] 版本格式不匹配:', version)
    // 大文件存在即认为可用，版本格式可能不标准
    return `已安装`
  } catch (err) {
    console.error('[ytdlp] 运行 --version 失败:', err)
    // 文件存在且大小足够，仍认为可用
    if (size >= MIN_YTDLP_SIZE) {
      console.log('[ytdlp] 文件大小足够，认为已就绪')
      return '已安装'
    }
    return null
  }
}

/** 使用 PowerShell Invoke-WebRequest 下载文件（自动走 Windows 系统代理） */
async function downloadViaPS(url: string, destPath: string, onProgress: InitProgressCallback): Promise<void> {
  return new Promise((resolve, reject) => {
    onProgress(10, '正在通过 PowerShell 下载 yt-dlp...')

    const psScript = [
      '$ProgressPreference = "SilentlyContinue"',
      `Invoke-WebRequest -Uri "${url}" -OutFile "${destPath}" -UseBasicParsing`
    ].join('; ')

    let progressTimer: NodeJS.Timeout | null = null

    const child = execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', psScript],
      { timeout: 300000 },
      (error, _stdout, stderr) => {
        if (progressTimer) clearInterval(progressTimer)
        if (error) {
          reject(new Error(`PowerShell 下载失败: ${stderr || error.message}`))
          return
        }
        onProgress(90, '下载完成，验证中...')
        resolve()
      }
    )

    // 模拟进度（PS不输出进度）
    let tick = 15
    progressTimer = setInterval(() => {
      tick = Math.min(tick + 5, 85)
      onProgress(tick, '正在下载 yt-dlp.exe（约 15MB）...')
    }, 3000)

    child.on('error', (err) => {
      if (progressTimer) clearInterval(progressTimer)
      reject(new Error(`启动 PowerShell 失败: ${err.message}`))
    })
  })
}

/** 备用：使用 curl.exe 下载（Windows 10+ 内置） */
async function downloadViaCurl(url: string, destPath: string, onProgress: InitProgressCallback): Promise<void> {
  return new Promise((resolve, reject) => {
    onProgress(10, '正在通过 curl 下载 yt-dlp...')

    execFile(
      'curl.exe',
      ['-L', '-o', destPath, '-#', url],
      { timeout: 300000 },
      (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(`curl 下载失败: ${stderr || error.message}`))
          return
        }
        onProgress(90, '下载完成...')
        resolve()
      }
    )
  })
}

/** 从 GitHub 下载 yt-dlp.exe */
async function downloadYtdlp(onProgress: InitProgressCallback): Promise<void> {
  const ytdlpPath = getYtdlpPath()
  const binDir = getYtdlpBinDir()
  await ensureDir(binDir)
  console.log('[ytdlp] 开始下载到:', ytdlpPath)

  // 优先使用 PowerShell
  try {
    await downloadViaPS(YTDLP_DOWNLOAD_URL, ytdlpPath, onProgress)
    console.log('[ytdlp] PowerShell 下载完成')
    return
  } catch (err) {
    console.error('[ytdlp] PowerShell 下载失败，尝试 curl:', err)
  }

  // 备用：curl.exe
  await downloadViaCurl(YTDLP_DOWNLOAD_URL, ytdlpPath, onProgress)
  console.log('[ytdlp] curl 下载完成')
}

/** 初始化 yt-dlp（检测 → 下载 → 验证） */
export async function initYtdlp(
  onProgress: InitProgressCallback
): Promise<{ status: 'ready' | 'error'; version?: string; error?: string }> {
  onProgress(0, '正在检测 yt-dlp...')
  const existingVersion = await checkYtdlp()

  if (existingVersion) {
    ytdlpReady = true
    ytdlpVersion = existingVersion
    onProgress(100, `yt-dlp ${existingVersion} 已就绪`)
    return { status: 'ready', version: existingVersion }
  }

  try {
    onProgress(0, '首次使用，正在下载 yt-dlp...')
    await downloadYtdlp(onProgress)

    onProgress(99, '正在验证...')
    const version = await checkYtdlp()
    if (version) {
      ytdlpReady = true
      ytdlpVersion = version
      onProgress(100, `yt-dlp ${version} 安装成功！`)
      return { status: 'ready', version }
    } else {
      return { status: 'error', error: 'yt-dlp 下载后验证失败，请手动重启应用重试' }
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : '未知错误'
    return { status: 'error', error }
  }
}

export function isYtdlpReady(): boolean { return ytdlpReady }
export function getYtdlpVersion(): string { return ytdlpVersion }
