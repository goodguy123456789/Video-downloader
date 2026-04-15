import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../preload/types'
import type { VideoInfo, VideoFormat } from '../../preload/types'
import { runYtdlpCollect } from '../services/ytdlp/ytdlpRunner'
import { startDownload, cancelDownload } from '../services/download/downloadManager'
import { getDefaultDownloadDir } from '../utils/pathUtils'
import { getCookieArgs, getProxyArgs } from '../services/settings/settingsStore'

/** 格式化秒数为 MM:SS 或 HH:MM:SS */
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '未知'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/** 将 yt-dlp 格式数组转换为应用内格式 */
function parseFormats(rawFormats: unknown[]): VideoFormat[] {
  if (!Array.isArray(rawFormats)) return []

  // 过滤出有效格式
  const formats: VideoFormat[] = rawFormats
    .filter((f: unknown) => {
      const fmt = f as Record<string, unknown>
      return (
        fmt.format_id &&
        fmt.ext &&
        // 排除 storyboard 等非视频格式
        !String(fmt.format_id).includes('storyboard') &&
        !String(fmt.format_note ?? '').toLowerCase().includes('storyboard')
      )
    })
    .map((f: unknown) => {
      const fmt = f as Record<string, unknown>
      const isAudioOnly = !fmt.vcodec || fmt.vcodec === 'none'
      const width = (fmt.width as number) ?? 0
      const height = (fmt.height as number) ?? 0
      const ext = String(fmt.ext ?? 'mp4')
      const acodec = String(fmt.acodec ?? 'none')
      const vcodec = String(fmt.vcodec ?? 'none')
      const tbr = (fmt.tbr as number) ?? 0
      const filesizeApprox = (fmt.filesize ?? fmt.filesize_approx ?? 0) as number

      let label: string
      if (isAudioOnly) {
        label = `仅音频 · ${ext.toUpperCase()} · ${Math.round(tbr || 0)}kbps`
      } else {
        const res = height > 0 ? `${height}p` : (fmt.format_note as string) ?? '未知画质'
        label = `${res} · ${ext.toUpperCase()}`
        if (tbr > 0) label += ` · ${Math.round(tbr)}kbps`
      }

      // B站等平台视频流和音频流分开，需要自动拼接最佳音频
      const formatId = (!isAudioOnly && acodec === 'none')
        ? `${String(fmt.format_id)}+bestaudio`
        : String(fmt.format_id)

      return {
        id: formatId,
        label,
        ext,
        resolution: height > 0 ? `${width}x${height}` : '',
        width,
        height,
        filesizeApprox,
        acodec,
        vcodec,
        isAudioOnly,
        tbr
      }
    })

  // 去重（按高度分组，每组保留 tbr 最高的）
  const videoFormats = formats.filter((f) => !f.isAudioOnly)
  const audioFormats = formats.filter((f) => f.isAudioOnly)

  const heightGroups = new Map<number, VideoFormat>()
  videoFormats.forEach((f) => {
    const key = f.height ?? 0
    const existing = heightGroups.get(key)
    if (!existing || (f.tbr ?? 0) > (existing.tbr ?? 0)) {
      heightGroups.set(key, f)
    }
  })

  const deduplicatedVideo = Array.from(heightGroups.values())
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))

  // 音频只保留前 2 种
  const topAudio = audioFormats
    .sort((a, b) => (b.tbr ?? 0) - (a.tbr ?? 0))
    .slice(0, 2)

  return [...deduplicatedVideo, ...topAudio]
}

export function registerVideoHandlers(): void {
  // 解析视频信息
  ipcMain.handle(IPC_CHANNELS.VIDEO_PARSE, async (_, { url }: { url: string }) => {
    if (!url || !url.startsWith('http')) {
      throw new Error('请输入有效的视频链接')
    }

    const output = await runYtdlpCollect([
      '--dump-json',
      '--no-download',
      '--no-playlist',
      ...getCookieArgs(),
      ...getProxyArgs(),
      url
    ], 60000)

    let data: Record<string, unknown>
    try {
      // 取第一行（可能有多行 JSON，每行一个视频）
      const firstLine = output.trim().split('\n')[0]
      data = JSON.parse(firstLine)
    } catch {
      throw new Error('无法解析视频信息，请确认链接是否正确')
    }

    const videoInfo: VideoInfo = {
      title: String(data.title ?? '未知标题'),
      thumbnail: String(data.thumbnail ?? ''),
      duration: Number(data.duration ?? 0),
      durationStr: formatDuration(Number(data.duration ?? 0)),
      uploader: String(data.uploader ?? data.channel ?? '未知上传者'),
      webpage_url: String(data.webpage_url ?? url),
      formats: parseFormats(data.formats as unknown[] ?? [])
    }

    return videoInfo
  })

  // 开始下载
  ipcMain.handle(
    IPC_CHANNELS.VIDEO_DOWNLOAD,
    async (_, { url, formatId, outputDir, title, thumbnail, formatLabel }: {
      url: string
      formatId: string
      outputDir: string
      title: string
      thumbnail: string
      formatLabel: string
    }) => {
      const dir = outputDir || getDefaultDownloadDir()
      const taskId = await startDownload({ url, formatId, outputDir: dir, title, thumbnail, formatLabel })
      return { taskId }
    }
  )

  // 取消下载
  ipcMain.handle(IPC_CHANNELS.VIDEO_CANCEL, async (_, { taskId }: { taskId: string }) => {
    const success = cancelDownload(taskId)
    return { success }
  })
}
