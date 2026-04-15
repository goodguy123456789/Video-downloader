export interface ParsedProgress {
  percent: number
  speed: string
  eta: string
  filename: string
}

// yt-dlp 下载进度正则：[download]  65.3% of ~123.45MiB at 2.34MiB/s ETA 00:12
const PROGRESS_REGEX = /\[download\]\s+([\d.]+)%\s+of\s+~?[\d.]+\S+\s+at\s+([\d.]+\S+)\s+ETA\s+([\d:]+)/

// 文件名正则（合并后输出）
const FILENAME_MERGE_REGEX = /\[Merger\]\s+Merging formats into\s+"(.+?)"/
// 文件名正则（直接下载）
const FILENAME_DEST_REGEX = /\[download\]\s+Destination:\s+(.+)/
// 已存在文件
const FILENAME_EXISTS_REGEX = /\[download\]\s+(.+?)\s+has already been downloaded/

/** 解析 yt-dlp 单行输出，返回进度信息（无法解析返回 null） */
export function parseProgressLine(line: string): Partial<ParsedProgress> | null {
  const progressMatch = line.match(PROGRESS_REGEX)
  if (progressMatch) {
    return {
      percent: parseFloat(progressMatch[1]),
      speed: progressMatch[2],
      eta: progressMatch[3]
    }
  }

  const mergeMatch = line.match(FILENAME_MERGE_REGEX)
  if (mergeMatch) {
    return { filename: mergeMatch[1], percent: 100 }
  }

  const destMatch = line.match(FILENAME_DEST_REGEX)
  if (destMatch) {
    return { filename: destMatch[1] }
  }

  const existsMatch = line.match(FILENAME_EXISTS_REGEX)
  if (existsMatch) {
    return { filename: existsMatch[1], percent: 100 }
  }

  // 下载完成标志
  if (line.includes('[download] 100%')) {
    return { percent: 100, speed: '', eta: '0:00' }
  }

  return null
}

/** 格式化文件大小 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}
