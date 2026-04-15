import { app } from 'electron'
import path from 'path'
import os from 'os'

/** yt-dlp 可执行文件路径 */
export function getYtdlpPath(): string {
  return path.join(app.getPath('userData'), 'bin', 'yt-dlp.exe')
}

/** yt-dlp bin 目录 */
export function getYtdlpBinDir(): string {
  return path.join(app.getPath('userData'), 'bin')
}

/** 历史记录 JSON 文件路径 */
export function getHistoryFilePath(): string {
  return path.join(app.getPath('userData'), 'history.json')
}

/** 默认下载目录（用户 Downloads 文件夹） */
export function getDefaultDownloadDir(): string {
  return app.getPath('downloads')
}

/** userData 目录 */
export function getUserDataDir(): string {
  return app.getPath('userData')
}

/** 获取系统 Downloads 文件夹 */
export function getSystemDownloadsDir(): string {
  return path.join(os.homedir(), 'Downloads')
}
