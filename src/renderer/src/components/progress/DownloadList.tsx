import React from 'react'
import { useDownloadStore } from '../../store/downloadStore'
import DownloadItem from './DownloadItem'

export default function DownloadList(): React.ReactElement | null {
  const { getItems, removeItem, clearCompleted } = useDownloadStore()
  const items = getItems()
  if (items.length === 0) return null

  const hasCompleted = items.some(i => i.status === 'completed' || i.status === 'failed')

  const handleCancel = async (taskId: string) => {
    await window.electronAPI.cancelDownload(taskId)
    removeItem(taskId)
  }

  const handleOpenFile = (filePath: string) => window.electronAPI.openFile(filePath)
  const handleOpenDir  = (filePath: string) => {
    const dir = filePath.replace(/[\\/][^\\/]+$/, '')
    window.electronAPI.openDir(dir)
  }

  return (
    <div className="card-journal animate-spring-up delay-300" style={{ padding: 16 }}>
      {/* 标题行 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12 }}>⬇︎</span>
          <span className="label-meta">采集队列</span>
          <span
            style={{
              padding: '1px 8px', borderRadius: 'var(--radius-pill)',
              background: 'var(--moss)', color: 'var(--parchment)',
              fontSize: 10, fontWeight: 800, fontFamily: 'Nunito, sans-serif'
            }}
          >
            {items.length}
          </span>
        </div>
        {hasCompleted && (
          <button onClick={clearCompleted} className="btn-ghost" style={{ fontSize: 10 }}>
            清除已完成
          </button>
        )}
      </div>

      <hr className="divider-dashed" style={{ marginBottom: 12 }} />

      {/* 时间轴列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <div key={item.taskId} style={{ animationDelay: `${i * 0.05}s` }}>
            <DownloadItem
              item={item}
              onCancel={handleCancel}
              onOpenFile={handleOpenFile}
              onOpenDir={handleOpenDir}
              onRemove={removeItem}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
