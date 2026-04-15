import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI, DownloadProgress, DownloadCompleted, DownloadFailed, YtdlpInitProgress } from './types'
import { IPC_CHANNELS } from './types'

const electronAPI: ElectronAPI = {
  // yt-dlp 初始化
  ytdlpInit: () => ipcRenderer.invoke(IPC_CHANNELS.YTDLP_INIT),

  // 视频解析
  parseVideo: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.VIDEO_PARSE, { url }),

  // 开始下载
  downloadVideo: (url: string, formatId: string, outputDir: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.VIDEO_DOWNLOAD, { url, formatId, outputDir }),

  // 取消下载
  cancelDownload: (taskId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.VIDEO_CANCEL, { taskId }),

  // 历史记录
  getHistory: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_GET_ALL),
  clearHistory: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_CLEAR),

  // Shell 操作
  openFile: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.SHELL_OPEN_FILE, { filePath }),
  openDir: (dirPath: string) => ipcRenderer.invoke(IPC_CHANNELS.SHELL_OPEN_DIR, { dirPath }),
  chooseDir: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_CHOOSE_DIR),

  // 窗口控制
  windowMinimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  windowMaximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  windowClose: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),

  // 设置
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  setSettings: (patch: object) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, patch),
  chooseCookiesFile: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_CHOOSE_COOKIES_FILE),

  // 事件监听（返回取消订阅函数）
  onDownloadProgress: (callback: (data: DownloadProgress) => void) => {
    const listener = (_: unknown, data: DownloadProgress) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_PROGRESS, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_PROGRESS, listener)
  },

  onDownloadCompleted: (callback: (data: DownloadCompleted) => void) => {
    const listener = (_: unknown, data: DownloadCompleted) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_COMPLETED, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_COMPLETED, listener)
  },

  onDownloadFailed: (callback: (data: DownloadFailed) => void) => {
    const listener = (_: unknown, data: DownloadFailed) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_FAILED, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_FAILED, listener)
  },

  onYtdlpInitProgress: (callback: (data: YtdlpInitProgress) => void) => {
    const listener = (_: unknown, data: YtdlpInitProgress) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.YTDLP_INIT_PROGRESS, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.YTDLP_INIT_PROGRESS, listener)
  }
}

// 通过 contextBridge 安全暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI)
