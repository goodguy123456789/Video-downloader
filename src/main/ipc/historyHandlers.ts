import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../preload/types'
import { getAllHistory, clearHistory } from '../services/history/historyStore'

export function registerHistoryHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.HISTORY_GET_ALL, async () => {
    return getAllHistory()
  })

  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, async () => {
    await clearHistory()
  })
}
