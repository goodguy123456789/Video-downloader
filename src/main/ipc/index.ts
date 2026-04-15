import { registerYtdlpHandlers } from './ytdlpHandlers'
import { registerVideoHandlers } from './videoHandlers'
import { registerHistoryHandlers } from './historyHandlers'
import { registerShellHandlers } from './shellHandlers'
import { registerSettingsHandlers } from './settingsHandlers'

export function registerAllHandlers(): void {
  registerYtdlpHandlers()
  registerVideoHandlers()
  registerHistoryHandlers()
  registerShellHandlers()
  registerSettingsHandlers()
}
