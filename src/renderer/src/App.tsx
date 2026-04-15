import React, { useState, useEffect, useCallback } from 'react'
import type { VideoInfo, VideoFormat } from '../../../preload/types'
import TitleBar from './components/layout/TitleBar'
import Sidebar, { type TabType } from './components/layout/Sidebar'
import UrlInput from './components/downloader/UrlInput'
import VideoInfoCard from './components/downloader/VideoInfo'
import FormatSelector from './components/downloader/FormatSelector'
import DownloadList from './components/progress/DownloadList'
import HistoryList from './components/history/HistoryList'
import CookieGuideModal from './components/common/CookieGuideModal'
import { useAppStore } from './store/appStore'
import { useDownloadStore } from './store/downloadStore'

/** 剥离 Electron IPC 错误包装前缀，只保留实际错误内容 */
function stripIpcPrefix(raw: string): string {
  // Electron IPC 错误格式: "Error invoking remote method 'xxx': Error: <实际错误>"
  const match = raw.match(/Error invoking remote method '[^']+': Error: ([\s\S]+)$/)
  return match ? match[1] : raw
}

/** 判断错误信息是否属于 Cookie 相关问题 */
function isCookieError(msg: string): boolean {
  return (
    msg.includes('DPAPI') ||
    msg.includes('Could not copy') ||
    msg.includes('cookie database') ||
    msg.includes('cookies-from-browser') ||
    msg.includes('无法读取浏览器 Cookie') ||
    msg.includes('Chrome/Edge 新版加密限制') ||
    msg.includes('Netscape format') ||
    msg.includes('cookies 文件格式无效') ||
    msg.includes('抖音需要登录凭证') ||
    msg.includes('Fresh cookies')
  )
}

export default function App(): React.ReactElement {
  const [activeTab, setActiveTab]       = useState<TabType>('downloader')
  const [isParsing, setIsParsing]       = useState(false)
  const [parseError, setParseError]     = useState('')
  const [videoInfo, setVideoInfo]       = useState<VideoInfo | null>(null)
  const [selectedFormat, setSelectedFormat] = useState('')
  const [outputDir, setOutputDir]       = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [cookieModal, setCookieModal]   = useState<'first-launch' | 'error' | null>(null)

  const { setYtdlpStatus, setYtdlpVersion, setYtdlpInitProgress, setYtdlpError } = useAppStore()
  const { addItem, updateProgress, setCompleted, setFailed } = useDownloadStore()

  // 初始化 yt-dlp
  useEffect(() => {
    if (!window.electronAPI) return
    setYtdlpStatus('checking')
    const unsub = window.electronAPI.onYtdlpInitProgress(({ percent, status }) => {
      setYtdlpInitProgress(percent, status)
      setYtdlpStatus(percent < 100 ? 'downloading' : 'checking')
    })
    window.electronAPI.ytdlpInit().then(result => {
      if (result.status === 'ready') {
        setYtdlpStatus('ready')
        setYtdlpVersion(result.version ?? '')
      } else {
        setYtdlpStatus('error')
        setYtdlpError(result.error ?? '初始化失败')
      }
    }).catch(err => {
      setYtdlpStatus('error')
      setYtdlpError(err instanceof Error ? err.message : '未知错误')
    })
    return unsub
  }, [setYtdlpStatus, setYtdlpVersion, setYtdlpInitProgress, setYtdlpError])

  // 首次启动：提示 cookie 使用说明（v2 key 确保更新后重新展示）
  useEffect(() => {
    const t = setTimeout(() => setCookieModal('first-launch'), 1200)
    return () => clearTimeout(t)
  }, [])

  // 监听下载事件
  useEffect(() => {
    if (!window.electronAPI) return
    const u1 = window.electronAPI.onDownloadProgress(d => {
      updateProgress(d.taskId, { percent: d.percent, speed: d.speed, eta: d.eta, filename: d.filename })
    })
    const u2 = window.electronAPI.onDownloadCompleted(d => setCompleted(d.taskId, d.filePath, d.fileSize))
    const u3 = window.electronAPI.onDownloadFailed(d => setFailed(d.taskId, d.error))
    return () => { u1(); u2(); u3() }
  }, [updateProgress, setCompleted, setFailed])

  const handleParse = useCallback(async (url: string) => {
    setIsParsing(true)
    setParseError('')
    setVideoInfo(null)
    setSelectedFormat('')
    try {
      const info = await window.electronAPI.parseVideo(url)
      setVideoInfo(info)
      if (info.formats.length > 0) setSelectedFormat(info.formats[0].id)
    } catch (err) {
      const raw = err instanceof Error ? err.message : '解析失败，请检查链接'
      const msg = stripIpcPrefix(raw)
      setParseError(msg)
      if (isCookieError(msg)) setCookieModal('error')
    } finally {
      setIsParsing(false)
    }
  }, [])

  const handleChooseDir = async () => {
    const result = await window.electronAPI.chooseDir()
    if (result.path) setOutputDir(result.path)
  }

  const handleDownload = async () => {
    if (!videoInfo || !selectedFormat) return
    const fmt = videoInfo.formats.find((f: VideoFormat) => f.id === selectedFormat)
    if (!fmt) return
    setIsDownloading(true)
    try {
      const { taskId } = await window.electronAPI.downloadVideo(videoInfo.webpage_url, selectedFormat, outputDir)
      addItem({ taskId, title: videoInfo.title, thumbnail: videoInfo.thumbnail, formatLabel: fmt.label })
      setVideoInfo(null)
      setSelectedFormat('')
      setParseError('')
    } catch (err) {
      setParseError(err instanceof Error ? err.message : '启动下载失败')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--parchment)'
      }}
    >
      <TitleBar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 主内容区 */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0
          }}
        >
          {/* 内层容器承载 flex 布局、间距和背景 */}
          <div
            style={{
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              minHeight: '100%',
              /* 地形图等高线背景 */
              background: `
                radial-gradient(circle at 80% 20%, transparent 30%, rgba(143,175,143,0.06) 31%, transparent 32%),
                radial-gradient(circle at 80% 20%, transparent 45%, rgba(143,175,143,0.05) 46%, transparent 47%),
                radial-gradient(circle at 80% 20%, transparent 60%, rgba(143,175,143,0.04) 61%, transparent 62%),
                radial-gradient(circle at 20% 80%, transparent 25%, rgba(143,175,143,0.05) 26%, transparent 27%),
                radial-gradient(circle at 20% 80%, transparent 40%, rgba(143,175,143,0.04) 41%, transparent 42%),
                var(--parchment)
              `
            }}
          >
          {activeTab === 'downloader' && (
            <>
              {/* URL 输入卡片 */}
              <UrlInput onParse={handleParse} isParsing={isParsing} />

              {/* 错误提示 */}
              {parseError && (
                <div
                  className="animate-spring-up"
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(212,106,106,0.08)',
                    border: '1px dashed var(--berry)',
                    display: 'flex', alignItems: 'flex-start', gap: 8
                  }}
                >
                  <span style={{ fontSize: 14 }}>⚠️</span>
                  <span style={{ fontSize: 12, color: 'var(--berry)', fontFamily: 'Nunito, sans-serif', fontWeight: 600, lineHeight: 1.4 }}>
                    {parseError}
                  </span>
                </div>
              )}

              {/* 视频信息 */}
              {videoInfo && <VideoInfoCard info={videoInfo} />}

              {/* 格式选择 + 下载 */}
              {videoInfo && videoInfo.formats.length > 0 && (
                <>
                  <FormatSelector
                    formats={videoInfo.formats}
                    selectedId={selectedFormat}
                    onSelect={setSelectedFormat}
                  />

                  {/* 保存目录 */}
                  <div
                    className="animate-spring-up"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8
                    }}
                  >
                    <div
                      onClick={handleChooseDir}
                      style={{
                        flex: 1,
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px dashed var(--parchment-deep)',
                        background: 'rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontFamily: 'Nunito, sans-serif',
                        fontWeight: 600,
                        color: outputDir ? 'var(--ink-light)' : 'var(--sage)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--sage)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--parchment-deep)' }}
                    >
                      📁 {outputDir || '默认保存到 Downloads — 点击更改目录'}
                    </div>
                  </div>

                  {/* 下载按钮 */}
                  <button
                    onClick={handleDownload}
                    disabled={!selectedFormat || isDownloading}
                    className="btn-primary animate-spring-up"
                    style={{ width: '100%', padding: '14px 24px', fontSize: 15 }}
                  >
                    {isDownloading ? (
                      <>
                        <span
                          style={{
                            width: 14, height: 14,
                            border: '2px solid var(--parchment)',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            display: 'inline-block',
                            animation: 'spin 0.7s linear infinite'
                          }}
                        />
                        准备采集...
                      </>
                    ) : (
                      '⬇︎  开始采集'
                    )}
                  </button>
                </>
              )}

              {/* 下载任务列表 */}
              <DownloadList />

              {/* 空状态 */}
              {!videoInfo && !isParsing && !parseError && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 24px',
                    textAlign: 'center',
                    gap: 16
                  }}
                >
                  <span style={{ fontSize: 56, filter: 'drop-shadow(0 4px 8px rgba(44,44,44,0.1))' }}>🎬</span>
                  <div>
                    <p
                      style={{
                        fontFamily: '"Playfair Display", Georgia, serif',
                        fontWeight: 600,
                        fontSize: 18,
                        color: 'var(--ink)',
                        marginBottom: 6
                      }}
                    >
                      准备好探险了吗？
                    </p>
                    <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, color: 'var(--sage)', lineHeight: 1.6 }}>
                      粘贴任意视频链接，即可开始采集<br/>
                      YouTube · B站 · 抖音 · TikTok · 1000+ 网站
                    </p>
                  </div>

                  {/* 装饰点阵 */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {['var(--sage-light)', 'var(--sage)', 'var(--moss)', 'var(--sage)', 'var(--sage-light)'].map((c, i) => (
                      <span
                        key={i}
                        style={{
                          width: 6, height: 6,
                          borderRadius: '50%',
                          background: c,
                          opacity: 0.7
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && <HistoryList />}
          </div>
        </main>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Cookie 使用说明弹窗 */}
      {cookieModal && (
        <CookieGuideModal
          reason={cookieModal}
          onClose={() => {
            setCookieModal(null)
          }}
        />
      )}
    </div>
  )
}
