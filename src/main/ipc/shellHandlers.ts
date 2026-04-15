import { ipcMain, shell, dialog, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../preload/types'

export function registerShellHandlers(): void {
  // 用默认程序打开文件
  ipcMain.handle(IPC_CHANNELS.SHELL_OPEN_FILE, async (_, { filePath }: { filePath: string }) => {
    await shell.openPath(filePath)
  })

  // 在文件管理器中显示文件
  ipcMain.handle(IPC_CHANNELS.SHELL_OPEN_DIR, async (_, { dirPath }: { dirPath: string }) => {
    await shell.openPath(dirPath)
  })

  // 打开文件夹选择对话框
  ipcMain.handle(IPC_CHANNELS.DIALOG_CHOOSE_DIR, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win ?? BrowserWindow.getFocusedWindow()!, {
      properties: ['openDirectory'],
      title: '选择下载目录'
    })
    return { path: result.canceled ? null : result.filePaths[0] }
  })

  // 窗口控制
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })
}
