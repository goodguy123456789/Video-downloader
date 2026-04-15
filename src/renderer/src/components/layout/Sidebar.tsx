import React, { useEffect, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import type { CookieBrowser } from '../../../../../preload/types'

export type TabType = 'downloader' | 'history'

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const NAV_ITEMS: { id: TabType; label: string; icon: string; sub: string }[] = [
  { id: 'downloader', label: '下载采集', icon: '⬇︎', sub: 'CAPTURE' },
  { id: 'history',    label: '探险日志', icon: '📋', sub: 'JOURNAL' }
]

const BROWSERS: { id: CookieBrowser; label: string; tip: string }[] = [
  { id: 'none',    label: '不使用',   tip: '无 Cookie' },
  { id: 'firefox', label: 'Firefox', tip: 'Firefox（推荐）' },
  { id: 'edge',    label: 'Edge',    tip: 'Microsoft Edge' },
  { id: 'chrome',  label: 'Chrome',  tip: 'Google Chrome' },
  { id: 'file',    label: '导入文件', tip: '手动导入 cookies.txt' }
]

export default function Sidebar({ activeTab, onTabChange }: SidebarProps): React.ReactElement {
  const { ytdlpStatus, ytdlpInitPercent, ytdlpInitMessage, ytdlpVersion, ytdlpError } = useAppStore()
  const [cookieBrowser, setCookieBrowser] = useState<CookieBrowser>('none')
  const [cookiesFile, setCookiesFile] = useState<string>('')
  const [proxyUrl, setProxyUrl] = useState<string>('')

  useEffect(() => {
    window.electronAPI?.getSettings().then(s => {
      setCookieBrowser(s.cookieBrowser)
      setCookiesFile(s.cookiesFile ?? '')
      setProxyUrl(s.proxyUrl ?? '')
    })
  }, [])

  const handleChooseFile = async () => {
    const result = await window.electronAPI?.chooseCookiesFile()
    if (result?.path) {
      setCookiesFile(result.path)
      await window.electronAPI?.setSettings({ cookieBrowser: 'file', cookiesFile: result.path })
      setCookieBrowser('file')
    }
  }

  const handleClearFile = async () => {
    setCookiesFile('')
    setCookieBrowser('none')
    await window.electronAPI?.setSettings({ cookieBrowser: 'none', cookiesFile: '' })
  }

  const handleCookieChange = async (browser: CookieBrowser) => {
    if (browser === 'file') {
      if (!cookiesFile) {
        await handleChooseFile()
      } else {
        setCookieBrowser('file')
        await window.electronAPI?.setSettings({ cookieBrowser: 'file' })
      }
      return
    }
    setCookieBrowser(browser)
    await window.electronAPI?.setSettings({ cookieBrowser: browser })
  }

  return (
    <div
      className="flex flex-col flex-shrink-0"
      style={{
        width: 160,
        background: 'var(--parchment-dark)',
        borderRight: '2px dashed var(--parchment-deep)'
      }}
    >
      {/* 导航 */}
      <nav className="flex-1 pt-4 px-3 space-y-2">
        {NAV_ITEMS.map((item, i) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="w-full text-left"
              style={{
                animationDelay: `${i * 0.1}s`,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: isActive ? '1px solid rgba(255,255,255,0.8)' : '1px solid transparent',
                background: isActive ? 'var(--parchment)' : 'transparent',
                boxShadow: isActive ? 'var(--shadow-float-sm), var(--shadow-inset)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <span
                  style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 13,
                    color: isActive ? 'var(--moss)' : 'var(--ink-light)'
                  }}
                >
                  {item.label}
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '1.5px',
                  color: isActive ? 'var(--gold)' : 'var(--sage)'
                }}
              >
                {item.sub}
              </div>
            </button>
          )
        })}
      </nav>

      {/* 分割线 */}
      <hr className="divider-dashed mx-3" />

      {/* yt-dlp 状态 */}
      <div className="p-3">
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--sage)',
            fontFamily: 'Nunito, sans-serif',
            marginBottom: 8
          }}
        >
          ENGINE STATUS
        </div>

        {ytdlpStatus === 'ready' && (
          <div
            className="badge-pill"
            style={{ background: 'rgba(74,124,89,0.12)', color: 'var(--moss)' }}
          >
            <span
              style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: 'var(--moss)',
                flexShrink: 0
              }}
            />
            <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10 }}>
              v{ytdlpVersion}
            </span>
          </div>
        )}

        {(ytdlpStatus === 'checking' || ytdlpStatus === 'downloading') && (
          <div className="space-y-2">
            <div
              className="badge-pill"
              style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold)' }}
            >
              <span
                className="animate-pulse-soft"
                style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }}
              />
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10 }}>
                {ytdlpStatus === 'downloading' ? '下载中' : '检测中'}
              </span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 99,
                background: 'var(--parchment-deep)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${ytdlpInitPercent}%`,
                  background: `linear-gradient(to right, var(--moss), var(--gold))`,
                  borderRadius: 99,
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
            <p style={{ fontSize: 10, color: 'var(--ink-light)', fontFamily: 'Nunito, sans-serif', lineHeight: 1.4 }}>
              {ytdlpInitMessage || '初始化中...'}
            </p>
          </div>
        )}

        {ytdlpStatus === 'error' && (
          <div className="space-y-1.5">
            <div
              className="badge-pill"
              style={{ background: 'rgba(212,106,106,0.15)', color: 'var(--berry)' }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--berry)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10 }}>引擎错误</span>
            </div>
            <p style={{ fontSize: 10, color: 'var(--berry)', fontFamily: 'Nunito, sans-serif', lineHeight: 1.4 }}>
              {ytdlpError?.slice(0, 60)}...
            </p>
          </div>
        )}

        {ytdlpStatus === 'idle' && (
          <div
            className="badge-pill"
            style={{ background: 'var(--parchment-deep)', color: 'var(--ink-light)' }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sage)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10 }}>等待中</span>
          </div>
        )}
      </div>

      {/* Cookie 设置 */}
      <hr className="divider-dashed mx-3" />
      <div className="p-3">
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--sage)',
            fontFamily: 'Nunito, sans-serif',
            marginBottom: 6
          }}
        >
          COOKIE 来源
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {BROWSERS.map(b => (
            <button
              key={b.id}
              title={b.tip}
              onClick={() => handleCookieChange(b.id)}
              style={{
                textAlign: 'left',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                border: cookieBrowser === b.id
                  ? '1px solid var(--moss)'
                  : '1px solid transparent',
                background: cookieBrowser === b.id
                  ? 'rgba(74,124,89,0.12)'
                  : 'transparent',
                cursor: 'pointer',
                fontSize: 11,
                fontFamily: 'Nunito, sans-serif',
                fontWeight: cookieBrowser === b.id ? 700 : 500,
                color: cookieBrowser === b.id ? 'var(--moss)' : 'var(--ink-light)',
                transition: 'all 0.2s'
              }}
            >
              {b.id === 'none' ? '🚫' : '🌐'} {b.label}
            </button>
          ))}
        </div>
        {/* Cookie 说明区 */}
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {cookieBrowser === 'none' && (
            <p style={{ fontSize: 9, fontFamily: 'Nunito, sans-serif', color: 'var(--ink-light)', lineHeight: 1.5 }}>
              不读取登录信息，只能下载无需登录的公开视频。
            </p>
          )}
          {(cookieBrowser === 'edge' || cookieBrowser === 'chrome') && (
            <div style={{
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(212,106,106,0.08)',
              border: '1px dashed rgba(212,106,106,0.35)'
            }}>
              <p style={{ fontSize: 9, fontFamily: 'Nunito, sans-serif', color: 'var(--berry)', lineHeight: 1.6, margin: 0 }}>
                ⚠️ <strong>新版 {cookieBrowser === 'edge' ? 'Edge' : 'Chrome'} 可能失败</strong><br/>
                Chrome 127+ 启用了新加密，yt-dlp 无法解密。建议改用 Firefox 或导入文件。
              </p>
            </div>
          )}
          {cookieBrowser === 'firefox' && (
            <div style={{
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(74,124,89,0.08)',
              border: '1px dashed rgba(74,124,89,0.35)'
            }}>
              <p style={{ fontSize: 9, fontFamily: 'Nunito, sans-serif', color: 'var(--moss)', lineHeight: 1.6, margin: 0 }}>
                ✦ <strong>推荐选项</strong><br/>
                Firefox 不锁定 Cookie，无需关闭浏览器即可读取。
              </p>
            </div>
          )}
          {cookieBrowser === 'file' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                onClick={handleChooseFile}
                style={{
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px dashed var(--gold)',
                  background: 'rgba(201,168,76,0.08)',
                  cursor: 'pointer',
                  fontSize: 9,
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  textAlign: 'left'
                }}
              >
                📂 {cookiesFile ? '重新选择文件' : '选择 cookies.txt'}
              </button>
              {cookiesFile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <p style={{ fontSize: 9, fontFamily: 'Nunito, sans-serif', color: 'var(--moss)', lineHeight: 1.4, wordBreak: 'break-all', flex: 1, margin: 0 }}>
                    ✓ {cookiesFile.split('\\').pop()}
                  </p>
                  <button
                    onClick={handleClearFile}
                    title="取消导入"
                    style={{
                      flexShrink: 0,
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--ink-light)', fontSize: 10, padding: '1px 3px',
                      borderRadius: 3, lineHeight: 1,
                      transition: 'color 0.15s'
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--berry)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-light)' }}
                  >✕</button>
                </div>
              ) : (
                <p style={{ fontSize: 9, fontFamily: 'Nunito, sans-serif', color: 'var(--ink-light)', lineHeight: 1.5 }}>
                  用扩展「get cookies txt」(by yaagame) 导出后导入，支持所有浏览器包括 Chrome/Edge。
                </p>
              )}
            </div>
          )}
          {cookieBrowser !== 'none' && (
            <p style={{ fontSize: 9, fontFamily: 'Nunito, sans-serif', color: 'var(--gold)', lineHeight: 1.5 }}>
              💡 可下载 B站大会员、YouTube Premium 等需登录的内容。
            </p>
          )}
        </div>
      </div>

      {/* 代理设置 */}
      <hr className="divider-dashed mx-3" />
      <div className="p-3">
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--sage)',
            fontFamily: 'Nunito, sans-serif',
            marginBottom: 6
          }}
        >
          PROXY 代理
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={proxyUrl}
            onChange={(e) => setProxyUrl(e.target.value)}
            onBlur={async () => {
              await window.electronAPI?.setSettings({ proxyUrl: proxyUrl.trim() })
            }}
            placeholder="http://127.0.0.1:7890"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: proxyUrl ? '4px 22px 4px 7px' : '4px 7px',
              borderRadius: 'var(--radius-sm)',
              border: proxyUrl
                ? '1px solid rgba(74,124,89,0.6)'
                : '1px solid var(--parchment-deep)',
              background: proxyUrl ? 'rgba(74,124,89,0.06)' : 'transparent',
              fontSize: 9,
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 600,
              color: proxyUrl ? 'var(--moss)' : 'var(--ink-light)',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />
          {proxyUrl && (
            <button
              onClick={async () => {
                setProxyUrl('')
                await window.electronAPI?.setSettings({ proxyUrl: '' })
              }}
              style={{
                position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--ink-light)', fontSize: 9, padding: '1px 2px', lineHeight: 1
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--berry)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-light)' }}
            >✕</button>
          )}
        </div>
        <p style={{ fontSize: 9, fontFamily: 'Nunito, sans-serif', color: 'var(--ink-light)', lineHeight: 1.5, marginTop: 4 }}>
          {proxyUrl
            ? '✦ 代理已启用，解析和下载均走代理'
            : 'socks5:// 或 http:// 均支持'}
        </p>
      </div>

      {/* 底部装饰 */}
      <div
        style={{
          padding: '8px 12px 12px',
          fontFamily: 'Nunito, sans-serif',
          fontSize: 9,
          fontWeight: 800,
          color: 'var(--sage-light)',
          letterSpacing: '1px',
          textAlign: 'center'
        }}
      >
        FIELD RECORDER v1.0
      </div>
    </div>
  )
}
