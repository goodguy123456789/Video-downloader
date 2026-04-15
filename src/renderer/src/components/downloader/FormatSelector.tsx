import React from 'react'
import type { VideoFormat } from '../../../../../preload/types'

interface FormatSelectorProps {
  formats: VideoFormat[]
  selectedId: string
  onSelect: (id: string) => void
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes === 0) return ''
  if (bytes > 1024 * 1024 * 1024) return `~${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`
  if (bytes > 1024 * 1024) return `~${(bytes / 1024 / 1024).toFixed(0)}MB`
  return `~${(bytes / 1024).toFixed(0)}KB`
}

function FormatCard({
  fmt,
  isSelected,
  onSelect
}: {
  fmt: VideoFormat
  isSelected: boolean
  onSelect: () => void
}): React.ReactElement {
  const mainLabel = fmt.label.split(' · ')[0]
  const subLabel = fmt.label.split(' · ').slice(1).join(' · ')
  const sizeStr = formatSize(fmt.filesizeApprox)

  return (
    <button
      onClick={onSelect}
      style={{
        textAlign: 'left',
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        border: isSelected
          ? '2px solid var(--moss)'
          : '2px solid var(--parchment-deep)',
        background: isSelected
          ? 'rgba(74,124,89,0.08)'
          : 'rgba(255,255,255,0.4)',
        boxShadow: isSelected
          ? '0 4px 12px rgba(74,124,89,0.15), inset 0 1px 0 rgba(255,255,255,0.5)'
          : 'inset 0 1px 0 rgba(255,255,255,0.4)',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        position: 'relative'
      }}
    >
      {/* 已选中勾 */}
      {isSelected && (
        <span
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--moss)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            color: 'var(--parchment)'
          }}
        >
          ✓
        </span>
      )}

      <div
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 600,
          fontSize: 16,
          color: isSelected ? 'var(--moss)' : 'var(--ink)',
          lineHeight: 1.1
        }}
      >
        {mainLabel}
      </div>
      <div
        style={{
          fontFamily: 'Nunito, sans-serif',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--ink-light)',
          marginTop: 3
        }}
      >
        {subLabel}
        {sizeStr && <span style={{ color: 'var(--sage)', marginLeft: 4 }}>{sizeStr}</span>}
      </div>
    </button>
  )
}

export default function FormatSelector({ formats, selectedId, onSelect }: FormatSelectorProps): React.ReactElement {
  const videoFormats = formats.filter(f => !f.isAudioOnly)
  const audioFormats = formats.filter(f => f.isAudioOnly)

  const renderGroup = (title: string, icon: string, sub: string, items: VideoFormat[]) => {
    if (items.length === 0) return null
    return (
      <div>
        {/* 分组标题 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 13 }}>{icon}</span>
          <span
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--sage)'
            }}
          >
            {title}
          </span>
          <span style={{ flex: 1 }}>
            <span
              style={{
                display: 'block',
                height: 1,
                backgroundImage: 'linear-gradient(to right, var(--sage-light) 50%, transparent 50%)',
                backgroundSize: '8px 100%'
              }}
            />
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: 'var(--sage-light)',
              fontFamily: 'Nunito, sans-serif',
              letterSpacing: '1px'
            }}
          >
            {sub}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {items.map(fmt => (
            <FormatCard
              key={fmt.id}
              fmt={fmt}
              isSelected={fmt.id === selectedId}
              onSelect={() => onSelect(fmt.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="card-journal animate-spring-up delay-200"
      style={{ padding: 16 }}
    >
      <div className="space-y-4">
        {renderGroup('视频格式', '🎥', 'VIDEO', videoFormats)}
        {renderGroup('仅音频', '🎵', 'AUDIO', audioFormats)}
      </div>
    </div>
  )
}
