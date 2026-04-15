import { ipcMain, dialog, app } from 'electron'
import fs from 'fs'
import path from 'path'
import { IPC_CHANNELS } from '../../preload/types'
import { getSettings, updateSettings } from '../services/settings/settingsStore'
import type { CookieBrowser } from '../services/settings/settingsStore'

const NETSCAPE_HEADER = '# Netscape HTTP Cookie File\n# This file was generated automatically.\n\n'

/**
 * 清洗并修复 cookies.txt：
 * 1. 去除 BOM
 * 2. 统一换行符为 LF
 * 3. 补全 Netscape 头部
 * 4. 将 expires=0（session cookie）替换为 10 年后的时间戳，
 *    避免 Python http.cookiejar 解析 "0" 时触发 AssertionError
 */
function fixAndCopyCookies(srcPath: string): string {
  const destPath = path.join(app.getPath('userData'), 'cookies.txt')
  let content = fs.readFileSync(srcPath, 'utf-8')

  // 去 BOM
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1)
  // 统一换行
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const futureTs = String(Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 3600)

  const lines = content.split('\n').map(line => {
    if (!line || line.startsWith('#')) return line
    const parts = line.split('\t')
    if (parts.length >= 6) {
      // 修复 expires=0 → 未来时间戳
      if (parts[4] === '0' || parts[4] === '') parts[4] = futureTs
      // 修复 domain/include_subdomains 不一致（Python http.cookiejar AssertionError 的真正原因）
      if (parts[0].startsWith('.')) parts[1] = 'TRUE'
      else parts[1] = 'FALSE'
    }
    return parts.join('\t')
  })

  let result = lines.join('\n')
  if (!result.startsWith('# Netscape HTTP Cookie File')) {
    result = NETSCAPE_HEADER + result
  }

  fs.writeFileSync(destPath, result, 'utf-8')
  return destPath
}

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => getSettings())

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_, patch: { cookieBrowser?: CookieBrowser; cookiesFile?: string }) => {
    return updateSettings(patch)
  })

  ipcMain.handle(IPC_CHANNELS.DIALOG_CHOOSE_COOKIES_FILE, async () => {
    const result = await dialog.showOpenDialog({
      title: '选择 Cookies 文件',
      filters: [
        { name: 'Cookies 文件', extensions: ['txt'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || !result.filePaths[0]) return { path: null }

    try {
      const fixedPath = fixAndCopyCookies(result.filePaths[0])
      return { path: fixedPath }
    } catch (e) {
      console.error('[cookies] 文件处理失败:', e)
      return { path: result.filePaths[0] }
    }
  })
}
