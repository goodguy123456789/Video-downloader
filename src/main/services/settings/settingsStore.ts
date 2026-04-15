import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export type CookieBrowser = 'none' | 'edge' | 'chrome' | 'firefox' | 'file'

interface Settings {
  cookieBrowser: CookieBrowser
  cookiesFile?: string
  proxyUrl?: string
}

const defaultSettings: Settings = { cookieBrowser: 'none', proxyUrl: '' }
let current: Settings = { ...defaultSettings }

function settingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

export function loadSettings(): void {
  try {
    const raw = fs.readFileSync(settingsPath(), 'utf-8')
    current = { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    current = { ...defaultSettings }
  }
}

export function getSettings(): Settings {
  return { ...current }
}

export function updateSettings(patch: Partial<Settings>): Settings {
  current = { ...current, ...patch }
  try {
    fs.writeFileSync(settingsPath(), JSON.stringify(current, null, 2))
  } catch (e) {
    console.error('[settings] 写入失败:', e)
  }
  return { ...current }
}

const NETSCAPE_HEADER = '# Netscape HTTP Cookie File\n# This file was generated automatically.\n\n'

/**
 * 就地修复 cookies 文件：
 * - 去 BOM、统一换行
 * - 补全 Netscape 头部
 * - 将 expires=0 替换为未来时间戳，修复 Python http.cookiejar AssertionError
 */
function fixCookiesInPlace(filePath: string): void {
  try {
    let content = fs.readFileSync(filePath, 'utf-8')
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1)
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    const futureTs = String(Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 3600)

    const lines = content.split('\n').map(line => {
      if (!line || line.startsWith('#')) return line
      const parts = line.split('\t')
      if (parts.length >= 6) {
        // 修复 expires=0 → 未来时间戳（http.cookiejar 无法解析 "0"）
        if (parts[4] === '0' || parts[4] === '') parts[4] = futureTs
        // 修复 domain/include_subdomains 不一致（Python AssertionError 的真正原因）
        // 规则：域名以 '.' 开头 → include_subdomains 必须是 TRUE，反之必须是 FALSE
        if (parts[0].startsWith('.')) parts[1] = 'TRUE'
        else parts[1] = 'FALSE'
      }
      return parts.join('\t')
    })

    let result = lines.join('\n')
    if (!result.startsWith('# Netscape HTTP Cookie File')) {
      result = NETSCAPE_HEADER + result
    }

    fs.writeFileSync(filePath, result, 'utf-8')
  } catch {
    // 无法读写，忽略
  }
}

/** 返回传递给 yt-dlp 的代理参数 */
export function getProxyArgs(): string[] {
  const url = current.proxyUrl?.trim()
  if (url) return ['--proxy', url]
  return []
}

/** 返回传递给 yt-dlp 的 Cookie 参数 */
export function getCookieArgs(): string[] {
  if (current.cookieBrowser === 'none') return []
  if (current.cookieBrowser === 'file') {
    if (!current.cookiesFile) return []
    fixCookiesInPlace(current.cookiesFile)
    return ['--cookies', current.cookiesFile]
  }
  return ['--cookies-from-browser', current.cookieBrowser]
}
