// IPC 通道名称常量
export const IPC_CHANNELS = {
  // ytdlp
  YTDLP_INIT: 'ytdlp:init',
  YTDLP_INIT_PROGRESS: 'ytdlp:initProgress',

  // video
  VIDEO_PARSE: 'video:parse',
  VIDEO_DOWNLOAD: 'video:download',
  VIDEO_CANCEL: 'video:cancel',

  // download events (main → renderer)
  DOWNLOAD_PROGRESS: 'download:progress',
  DOWNLOAD_COMPLETED: 'download:completed',
  DOWNLOAD_FAILED: 'download:failed',

  // history
  HISTORY_GET_ALL: 'history:getAll',
  HISTORY_CLEAR: 'history:clear',

  // shell
  SHELL_OPEN_FILE: 'shell:openFile',
  SHELL_OPEN_DIR: 'shell:openDir',
  DIALOG_CHOOSE_DIR: 'dialog:chooseDir',

  // window
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  // settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  DIALOG_CHOOSE_COOKIES_FILE: 'dialog:chooseCookiesFile'
} as const

// 视频格式
export interface VideoFormat {
  id: string
  label: string
  ext: string
  resolution: string
  width?: number
  height?: number
  filesizeApprox?: number
  acodec: string
  vcodec: string
  isAudioOnly: boolean
  tbr?: number
}

// 视频信息
export interface VideoInfo {
  title: string
  thumbnail: string
  duration: number
  durationStr: string
  uploader: string
  webpage_url: string
  formats: VideoFormat[]
}

// 下载任务状态
export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled'

// 下载进度
export interface DownloadProgress {
  taskId: string
  percent: number
  speed: string
  eta: string
  filename: string
}

// 下载完成
export interface DownloadCompleted {
  taskId: string
  filePath: string
  fileSize: number
}

// 下载失败
export interface DownloadFailed {
  taskId: string
  error: string
}

// 历史记录条目
export interface HistoryItem {
  id: string
  title: string
  thumbnail: string
  url: string
  filePath: string
  fileSize: number
  formatLabel: string
  downloadedAt: string
}

// yt-dlp 初始化进度
export interface YtdlpInitProgress {
  percent: number
  status: string
}

// yt-dlp 初始化结果
export interface YtdlpInitResult {
  status: 'ready' | 'downloading' | 'error'
  version?: string
  error?: string
}

// 设置
export type CookieBrowser = 'none' | 'edge' | 'chrome' | 'firefox' | 'file'
export interface AppSettings {
  cookieBrowser: CookieBrowser
  cookiesFile?: string
  proxyUrl?: string
}

// ElectronAPI 接口（暴露到 window）
export interface ElectronAPI {
  // ytdlp
  ytdlpInit: () => Promise<YtdlpInitResult>

  // video
  parseVideo: (url: string) => Promise<VideoInfo>
  downloadVideo: (url: string, formatId: string, outputDir: string) => Promise<{ taskId: string }>
  cancelDownload: (taskId: string) => Promise<{ success: boolean }>

  // history
  getHistory: () => Promise<HistoryItem[]>
  clearHistory: () => Promise<void>

  // shell
  openFile: (filePath: string) => Promise<void>
  openDir: (dirPath: string) => Promise<void>
  chooseDir: () => Promise<{ path: string | null }>

  // window controls
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void

  // settings
  getSettings: () => Promise<AppSettings>
  setSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>
  chooseCookiesFile: () => Promise<{ path: string | null }>

  // event listeners (main → renderer)
  onDownloadProgress: (callback: (data: DownloadProgress) => void) => () => void
  onDownloadCompleted: (callback: (data: DownloadCompleted) => void) => () => void
  onDownloadFailed: (callback: (data: DownloadFailed) => void) => () => void
  onYtdlpInitProgress: (callback: (data: YtdlpInitProgress) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
