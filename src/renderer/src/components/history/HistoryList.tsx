import React, { useState, useEffect, useCallback } from 'react'
import type { HistoryItem } from '../../../../../preload/types'

function formatSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes > 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return `今日 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  if (diffDays === 1) return '昨日'
  if (diffDays < 7)  return `${diffDays} 日前`
  return d.toLocaleDateString('zh-CN')
}

export default function HistoryList(): React.ReactElement {
  const [items, setItems]   = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [failedThumbs, setFailedThumbs] = useState<Set<string>>(new Set())

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.electronAPI.getHistory()
      setItems(data)
    } catch (err) {
      console.error('加载历史失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const handleClear = async () => {
    if (!confirm('确认清空所有探险记录？')) return
    await window.electronAPI.clearHistory()
    setItems([])
  }

  const handleOpenFile = (filePath: string) => window.electronAPI.openFile(filePath)
  const handleOpenDir  = (filePath: string) => {
    const dir = filePath.replace(/[\\/][^\\/]+$/, '')
    window.electronAPI.openDir(dir)
  }

  if (loading) {
    return (
      <div
        className="card-journal"
        style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
      >
        <span style={{ fontSize: 32, animation: 'pulseSoft 1.5s ease-in-out infinite' }}>📜</span>
        <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, color: 'var(--ink-light)' }}>
          翻阅探险日志...
        </span>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div
        className="card-journal animate-spring-up"
        style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
      >
        <span style={{ fontSize: 48 }}>📋</span>
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 600, fontSize: 16,
              color: 'var(--ink)', marginBottom: 6
            }}
          >
            日志尚空
          </p>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, color: 'var(--ink-light)' }}>
            采集视频后，记录将自动归入此处
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card-journal animate-spring-up" style={{ padding: 16 }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12 }}>📋</span>
          <span className="label-meta">探险记录</span>
          <span
            style={{
              padding: '1px 8px', borderRadius: 'var(--radius-pill)',
              background: 'var(--gold)', color: 'var(--parchment)',
              fontSize: 10, fontWeight: 800, fontFamily: 'Nunito, sans-serif'
            }}
          >
            {items.length}
          </span>
        </div>
        <button onClick={handleClear} className="btn-ghost" style={{ fontSize: 10, color: 'var(--berry)' }}>
          清空记录
        </button>
      </div>

      <hr className="divider-dashed" style={{ marginBottom: 12 }} />

      {/* 时间轴列表 */}
      <div style={{ position: 'relative' }}>
        {/* 时间轴竖线 */}
        <div
          className="timeline-line"
          style={{
            position: 'absolute',
            left: 7, top: 8, bottom: 8
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '8px 0',
                borderBottom: i < items.length - 1 ? '1px dashed var(--parchment-dark)' : 'none'
              }}
            >
              {/* 节点 */}
              <div
                style={{
                  flexShrink: 0,
                  width: 16, height: 16,
                  marginTop: 2,
                  borderRadius: '50%',
                  border: '3px solid var(--sage)',
                  background: 'var(--parchment)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)'
                }}
              />

              {/* 内容 */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {/* 缩略图 */}
                <div
                  style={{
                    flexShrink: 0, width: 48, height: 30,
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: 'var(--parchment-deep)',
                    border: '1px solid rgba(255,255,255,0.6)'
                  }}
                >
                  {item.thumbnail && !failedThumbs.has(item.id) ? (
                    <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={() => setFailedThumbs(prev => new Set(prev).add(item.id))} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🎬</div>
                  )}
                </div>

                {/* 文字 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 12,
                      color: 'var(--ink)', marginBottom: 3,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}
                  >
                    {item.title}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
                    <span style={{ fontSize: 10, color: 'var(--sage)', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
                      {item.formatLabel}
                    </span>
                    {item.fileSize > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--ink-light)', fontFamily: 'Nunito, sans-serif' }}>
                        {formatSize(item.fileSize)}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 10, color: 'var(--ink-light)', fontFamily: 'Nunito, sans-serif',
                        fontVariantNumeric: 'tabular-nums', fontWeight: 700
                      }}
                    >
                      {formatDate(item.downloadedAt)}
                    </span>
                  </div>
                </div>

                {/* 操作图标 */}
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  {[
                    { icon: '📂', title: '打开文件', action: () => handleOpenFile(item.filePath) },
                    { icon: '📁', title: '所在目录', action: () => handleOpenDir(item.filePath) }
                  ].map(btn => (
                    <button
                      key={btn.title}
                      onClick={btn.action}
                      title={btn.title}
                      style={{
                        width: 26, height: 26,
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--parchment-deep)',
                        background: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget
                        el.style.background = 'var(--parchment)'
                        el.style.boxShadow = '0 2px 6px rgba(44,44,44,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget
                        el.style.background = 'rgba(255,255,255,0.5)'
                        el.style.boxShadow = 'none'
                      }}
                    >
                      {btn.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
