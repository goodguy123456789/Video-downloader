import React from 'react'

export default function TitleBar(): React.ReactElement {
  return (
    <div
      className="drag-region flex items-center justify-between flex-shrink-0"
      style={{
        height: 44,
        background: 'var(--parchment-dark)',
        borderBottom: '2px dashed var(--parchment-deep)',
        paddingInline: 16
      }}
    >
      {/* Logo 胶囊 */}
      <div
        className="no-drag flex items-center gap-2 px-3 py-1"
        style={{
          borderRadius: 'var(--radius-pill)',
          background: 'var(--parchment)',
          boxShadow: '0 4px 12px rgba(44,44,44,0.1), var(--shadow-inset)',
          border: '1px solid rgba(255,255,255,0.8)'
        }}
      >
        <span style={{ fontSize: 14 }}>🎬</span>
        <span
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '-0.5px',
            color: 'var(--ink)'
          }}
        >
          视频日志
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--sage)',
            fontFamily: 'Nunito, sans-serif'
          }}
        >
          FIELD RECORDER
        </span>
      </div>

      {/* 窗口控制 */}
      <div className="no-drag flex items-center gap-1">
        {[
          { label: '─', title: '最小化', action: () => window.electronAPI.windowMinimize(), hover: 'rgba(143,175,143,0.3)' },
          { label: '⬜', title: '最大化', action: () => window.electronAPI.windowMaximize(), hover: 'rgba(143,175,143,0.3)' },
          { label: '✕', title: '关闭', action: () => window.electronAPI.windowClose(), hover: 'rgba(212,106,106,0.3)' }
        ].map((btn) => (
          <button
            key={btn.title}
            onClick={btn.action}
            title={btn.title}
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--ink-light)',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.background = btn.hover }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent' }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
