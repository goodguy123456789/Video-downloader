import React, { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'

interface UrlInputProps {
  onParse: (url: string) => void
  isParsing: boolean
}

export default function UrlInput({ onParse, isParsing }: UrlInputProps): React.ReactElement {
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { ytdlpStatus } = useAppStore()
  const isReady = ytdlpStatus === 'ready'

  useEffect(() => { inputRef.current?.focus() }, [])

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').trim()
    if (pasted.startsWith('http') && isReady) {
      setTimeout(() => onParse(pasted), 50)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (trimmed && isReady) onParse(trimmed)
  }

  return (
    <div
      className="card-journal animate-spring-up"
      style={{ padding: 20 }}
    >
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: 12 }}>🔗</span>
        <span className="label-meta">粘贴视频链接</span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={handlePaste}
            placeholder={
              !isReady
                ? '引擎初始化中，请稍候...'
                : 'YouTube · B站 · 抖音 · TikTok · Twitter ...'
            }
            disabled={!isReady || isParsing}
            style={{
              width: '100%',
              background: 'var(--parchment-dark)',
              border: '1px solid var(--parchment-deep)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 36px 10px 14px',
              fontSize: 13,
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 600,
              color: 'var(--ink)',
              outline: 'none',
              boxShadow: 'inset 0 2px 4px rgba(44,44,44,0.06)',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--sage)'
              e.target.style.boxShadow = 'inset 0 2px 4px rgba(44,44,44,0.06), 0 0 0 3px rgba(143,175,143,0.2)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--parchment-deep)'
              e.target.style.boxShadow = 'inset 0 2px 4px rgba(44,44,44,0.06)'
            }}
          />
          {url && (
            <button
              type="button"
              onClick={() => setUrl('')}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--ink-light)', fontSize: 11, padding: 2
              }}
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!url.trim() || !isReady || isParsing}
          className="btn-primary flex-shrink-0"
          style={{ padding: '10px 20px' }}
        >
          {isParsing ? (
            <>
              <span
                style={{
                  width: 12, height: 12,
                  border: '2px solid var(--parchment)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite'
                }}
              />
              解析中
            </>
          ) : '解析'}
        </button>
      </form>

      {/* 支持网站提示 */}
      <p style={{ marginTop: 10, fontSize: 11, color: 'var(--sage)', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
        ✦ 支持 1000+ 个网站 — 粘贴链接自动识别
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
