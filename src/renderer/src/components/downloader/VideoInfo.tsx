import React, { useState } from 'react'
import type { VideoInfo } from '../../../../../preload/types'

interface VideoInfoProps {
  info: VideoInfo
}

function formatDuration(seconds: number): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function VideoInfoCard({ info }: VideoInfoProps): React.ReactElement {
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <div
      className="card-journal animate-spring-up delay-100"
      style={{ overflow: 'hidden' }}
    >
      {/* 顶部标签行 */}
      <div
        style={{
          background: 'var(--moss)',
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        <span
          style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'rgba(245,240,232,0.7)',
            fontFamily: 'Nunito, sans-serif'
          }}
        >
          FIELD CAPTURE IDENTIFIED
        </span>
        <span style={{ flex: 1, height: 1, background: 'rgba(245,240,232,0.2)' }} />
        <span style={{ fontSize: 10, color: 'rgba(245,240,232,0.6)', fontFamily: 'Nunito, sans-serif' }}>
          {info.formats.length} formats
        </span>
      </div>

      {/* 主体 */}
      <div className="flex gap-4 p-4">
        {/* 缩略图 */}
        <div
          style={{
            flexShrink: 0,
            width: 120,
            height: 72,
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: 'var(--parchment-deep)',
            boxShadow: '0 4px 12px rgba(44,44,44,0.12)',
            border: '2px solid rgba(255,255,255,0.7)'
          }}
        >
          {info.thumbnail && !imgFailed ? (
            <img
              src={info.thumbnail}
              alt={info.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              🎬
            </div>
          )}
        </div>

        {/* 元信息 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 700,
              fontSize: 15,
              color: 'var(--ink)',
              lineHeight: 1.25,
              marginBottom: 8,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {info.title}
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
            {info.uploader && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink-light)', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
                <span style={{ color: 'var(--sage)' }}>👤</span>
                <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{info.uploader}</span>
              </span>
            )}
            {info.duration > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink-light)', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
                <span style={{ color: 'var(--sage)' }}>⏱</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatDuration(info.duration)}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
