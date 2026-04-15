import React, { useState } from 'react'

interface CookieGuideModalProps {
  /** 'first-launch' 首次启动引导 | 'error' 遇到 cookie 错误 */
  reason: 'first-launch' | 'error'
  onClose: () => void
}

const STEPS = [
  {
    icon: '🍪',
    title: '安装浏览器扩展',
    desc: (
      <span>
        在 Chrome / Edge 扩展商店搜索安装下方插件，开发者：yaagame
        {/* 插件卡片 */}
        <span style={{
          display: 'flex', alignItems: 'center', gap: 10, marginTop: 8,
          padding: '8px 12px', borderRadius: 8,
          background: 'rgba(255,220,200,0.25)',
          border: '1px solid rgba(201,168,76,0.3)'
        }}>
          <span style={{
            fontSize: 28, lineHeight: 1,
            background: '#fce8e8', borderRadius: 8,
            padding: '4px 6px', flexShrink: 0
          }}>🍪</span>
          <span>
            <strong style={{ fontSize: 12, color: 'var(--ink)', display: 'block', fontFamily: 'Nunito, sans-serif' }}>
              get cookies txt
            </strong>
            <span style={{ fontSize: 10, color: 'var(--ink-light)', fontFamily: 'Nunito, sans-serif' }}>
              Automatically manage cookie banners and export cookies in cookies txt format
            </span>
          </span>
        </span>
      </span>
    )
  },
  {
    icon: '🌐',
    title: '登录目标网站',
    desc: '打开 B站 / YouTube 等网站，确保已登录你的账号（大会员账号）'
  },
  {
    icon: '📥',
    title: '导出 cookies.txt',
    desc: '点击扩展图标，选择当前网站，点击「Export」导出文件保存到桌面'
  },
  {
    icon: '📂',
    title: '导入到本软件',
    desc: '在左侧「COOKIE 来源」选择「导入文件」，点击「选择 cookies.txt」'
  }
]

export default function CookieGuideModal({ reason, onClose }: CookieGuideModalProps): React.ReactElement {
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState('')

  const handleImport = async () => {
    setImporting(true)
    try {
      const result = await window.electronAPI?.chooseCookiesFile()
      if (result?.path) {
        await window.electronAPI?.setSettings({ cookieBrowser: 'file', cookiesFile: result.path })
        const name = result.path.split('\\').pop() ?? result.path
        setImported(name)
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    /* 遮罩层 */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(44,44,44,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* 弹窗卡片 */}
      <div
        className="animate-spring-up"
        style={{
          width: '100%',
          maxWidth: 460,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--parchment)',
          border: '2px solid var(--parchment-deep)',
          boxShadow: 'var(--shadow-float)',
          overflow: 'hidden'
        }}
      >
        {/* 顶部色条 */}
        <div style={{ height: 4, background: `linear-gradient(to right, var(--moss), var(--gold))` }} />

        {/* 头部 */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            {reason === 'error' ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '2px 10px', borderRadius: 99, marginBottom: 8,
                background: 'rgba(212,106,106,0.1)',
                border: '1px solid rgba(212,106,106,0.3)'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--berry)', flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1px', color: 'var(--berry)', fontFamily: 'Nunito, sans-serif' }}>
                  COOKIE 读取失败
                </span>
              </div>
            ) : (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '2px 10px', borderRadius: 99, marginBottom: 8,
                background: 'rgba(201,168,76,0.1)',
                border: '1px solid rgba(201,168,76,0.3)'
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1px', color: 'var(--gold)', fontFamily: 'Nunito, sans-serif' }}>
                  GETTING STARTED
                </span>
              </div>
            )}
            <h2 style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 18, fontWeight: 700,
              color: 'var(--ink)', margin: 0
            }}>
              {reason === 'error' ? '无法读取浏览器 Cookie' : '下载需要登录的视频？'}
            </h2>
            <p style={{
              fontFamily: 'Nunito, sans-serif', fontSize: 12,
              color: 'var(--sage)', marginTop: 4, lineHeight: 1.5
            }}>
              {reason === 'error'
                ? 'Chrome / Edge 新版本加密了 Cookie 数据库，yt-dlp 无法直接读取。'
                : '使用 cookies.txt 文件可以下载 B站大会员、YouTube Premium 等付费内容。'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0, marginLeft: 12,
              width: 28, height: 28, borderRadius: '50%',
              border: '1px solid var(--parchment-deep)',
              background: 'transparent', cursor: 'pointer',
              fontSize: 14, color: 'var(--ink-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >✕</button>
        </div>

        {/* 步骤列表 */}
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {/* 序号 */}
              <div style={{
                flexShrink: 0,
                width: 28, height: 28, borderRadius: '50%',
                background: i < 3 ? 'rgba(74,124,89,0.1)' : 'rgba(201,168,76,0.15)',
                border: `1px solid ${i < 3 ? 'rgba(74,124,89,0.25)' : 'rgba(201,168,76,0.35)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13
              }}>
                {step.icon}
              </div>
              {/* 内容 */}
              <div style={{ paddingTop: 4 }}>
                <p style={{
                  fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700,
                  color: 'var(--ink)', margin: '0 0 2px'
                }}>
                  步骤 {i + 1}：{step.title}
                </p>
                <p style={{
                  fontFamily: 'Nunito, sans-serif', fontSize: 11,
                  color: 'var(--ink-light)', margin: 0, lineHeight: 1.5
                }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 分隔线 */}
        <hr className="divider-dashed mx-6" />

        {/* 操作按钮 */}
        <div style={{ padding: '14px 24px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {imported ? (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'rgba(74,124,89,0.08)',
              border: '1px solid rgba(74,124,89,0.3)',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--moss)', fontFamily: 'Nunito, sans-serif', margin: 0 }}>
                  导入成功！
                </p>
                <p style={{ fontSize: 10, color: 'var(--ink-light)', fontFamily: 'Nunito, sans-serif', margin: 0 }}>
                  {imported}
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleImport}
              disabled={importing}
              className="btn-primary"
              style={{ width: '100%', padding: '11px 20px', fontSize: 13 }}
            >
              {importing ? '选择中...' : '📂  现在导入 cookies 文件'}
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '9px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--parchment-deep)',
              background: 'transparent', cursor: 'pointer',
              fontSize: 12, fontFamily: 'Nunito, sans-serif',
              fontWeight: 600, color: 'var(--ink-light)',
              transition: 'all 0.2s'
            }}
          >
            {imported ? '完成' : '稍后再说，先下载免费内容'}
          </button>
        </div>
      </div>
    </div>
  )
}
