import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../preload/types'
import { initYtdlp } from '../services/ytdlp/ytdlpManager'

export function registerYtdlpHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.YTDLP_INIT, async () => {
    const result = await initYtdlp((percent, status) => {
      // 向所有窗口广播初始化进度
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send(IPC_CHANNELS.YTDLP_INIT_PROGRESS, { percent, status })
        }
      })
    })
    return result
  })
}
