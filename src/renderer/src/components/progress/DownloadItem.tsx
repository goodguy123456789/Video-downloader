import React, { useState } from 'react'
import type { DownloadItem as DownloadItemType } from '../../store/downloadStore'

interface DownloadItemProps {
  item: DownloadItemType
  onCancel: (taskId: string) => void
  onOpenFile: (filePath: string) => void
  onOpenDir: (filePath: string) => void
  onRemove: (taskId: string) => void
}

function formatSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes > 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

const STATUS_CONFIG = {
  pending:    { label: '待采集', dot: 'var(--sage)',   bar: 'var(--sage)'  },
  downloading:{ label: '采集中', dot: 'var(--moss)',   bar: 'var(--moss)'  },
  completed:  { label: '已入库', dot: 'var(--gold)',   bar: 'var(--gold)'  },
  failed:     { label: '采集失败', dot: 'var(--berry)', bar: 'var(--berry)' },
  cancelled:  { label: '已取消', dot: 'var(--sage)',   bar: 'var(--sage-light)' }
}

export default function DownloadItem({
  item, onCancel, onOpenFile, onOpenDir, onRemove
}: DownloadItemProps): React.ReactElement {
  const [imgFailed, setImgFailed] = useState(false)
  const config = STATUS_CONFIG[item.status]
  const isDone   = item.status === 'completed'
  const isFailed = item.status === 'failed' || item.status === 'cancelled'
  const isActive = item.status === 'downloading' || item.status === 'pending'

  return (
    <div
      style={{
        background: 'var(--parchment)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--parchment-deep)',
        boxShadow: '0 4px 12px rgba(44,44,44,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
        padding: 12,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 点阵背景 */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(var(--parchment-dark) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
          opacity: 0.3
        }}
      />

      {/* 左侧时间轴节点 */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 12 }}>
        {/* 节点 + 竖线 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div
            style={{
              width: 14, height: 14,
              borderRadius: '50%',
              border: `3px solid ${isDone ? 'var(--gold)' : 'var(--sage)'}`,
              background: isDone ? 'var(--gold)' : isActive ? 'var(--parchment)' : 'var(--parchment-dark)',
              boxShadow: isDone ? '0 0 0 2px rgba(201,168,76,0.3)' : 'none',
              flexShrink: 0
            }}
          />
        </div>

        {/* 内容区 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 顶部：缩略图 + 标题 + 状态 */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            {/* 缩略图 */}
            <div
              style={{
                flexShrink: 0, width: 52, height: 34,
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                background: 'var(--parchment-deep)',
                border: '1px solid rgba(255,255,255,0.6)'
              }}
            >
              {item.thumbnail && !imgFailed ? (
                <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setImgFailed(true)} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎬</div>
              )}
            </div>

            {/* 标题和状态 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 700,
                  fontSize: 12,
                  color: 'var(--ink)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: 3
                }}
              >
                {item.title}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* 状态徽章 */}
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: `${config.dot}22`,
                    fontSize: 10, fontWeight: 800, fontFamily: 'Nunito, sans-serif',
                    color: config.dot,
                    letterSpacing: '0.5px'
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: config.dot }} />
                  {config.label}
                </span>
                <span style={{ fontSize: 10, color: 'var(--ink-light)', fontFamily: 'Nunito, sans-serif' }}>
                  {item.formatLabel}
                </span>
                {isDone && item.fileSize > 0 && (
                  <span style={{ fontSize: 10, color: 'var(--sage)', fontFamily: 'Nunito, sans-serif' }}>
                    {formatSize(item.fileSize)}
                  </span>
                )}
              </div>
            </div>

            {/* 移除按钮 */}
            {(isFailed || isDone) && (
              <button
                onClick={() => onRemove(item.taskId)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--sage)', fontSize: 10, padding: 2, flexShrink: 0
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* 进度条（采集中） */}
          {isActive && (
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  height: 6, borderRadius: 99,
                  background: 'var(--parchment-deep)',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.5)'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${item.percent}%`,
                    background: `linear-gradient(to right, var(--moss), var(--gold))`,
                    borderRadius: 99,
                    transition: 'width 0.5s ease',
                    boxShadow: '0 1px 2px rgba(74,124,89,0.4)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, fontFamily: 'Nunito, sans-serif', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--moss)' }}>
                  {item.percent.toFixed(1)}%
                </span>
                <span style={{ fontSize: 10, fontFamily: 'Nunito, sans-serif', color: 'var(--ink-light)' }}>
                  {item.speed && `${item.speed}`}
                  {item.eta && ` · 剩余 ${item.eta}`}
                </span>
              </div>
            </div>
          )}

          {/* 完成进度条 */}
          {isDone && (
            <div
              style={{
                marginTop: 8, height: 4, borderRadius: 99,
                background: 'linear-gradient(to right, var(--moss), var(--gold))',
                boxShadow: '0 1px 4px rgba(201,168,76,0.3)'
              }}
            />
          )}

          {/* 错误信息 */}
          {isFailed && item.error && (
            <p style={{ marginTop: 6, fontSize: 10, color: 'var(--berry)', fontFamily: 'Nunito, sans-serif', lineHeight: 1.4 }}>
              {item.error.slice(0, 80)}
            </p>
          )}

          {/* 操作按钮 */}
          {(isActive || isDone) && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {isActive && (
                <button
                  onClick={() => onCancel(item.taskId)}
                  className="btn-ghost"
                  style={{ fontSize: 10 }}
                >
                  取消采集
                </button>
              )}
              {isDone && (
                <>
                  <button onClick={() => onOpenFile(item.filePath)} className="btn-ghost" style={{ fontSize: 10 }}>
                    📂 打开文件
                  </button>
                  <button onClick={() => onOpenDir(item.filePath)} className="btn-ghost" style={{ fontSize: 10 }}>
                    📁 所在目录
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
