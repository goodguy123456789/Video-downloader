import { spawn, ChildProcess } from 'child_process'
import { getYtdlpPath } from '../../utils/pathUtils'

/** 将 yt-dlp 常见英文错误转换为友好中文提示 */
function translateYtdlpError(raw: string): string {
  if (!raw) return raw

  // Chrome/Edge Cookie 数据库锁定（浏览器正在运行时）
  if (raw.includes('Could not copy') && raw.includes('cookie database')) {
    return '无法读取浏览器 Cookie（请先关闭 Edge/Chrome 浏览器，再点击解析）\n提示：yt-dlp 需要在浏览器关闭时才能读取登录信息。'
  }

  // Chrome 127+ / Edge 新版 App-Bound 加密，DPAPI 解密失败
  if (raw.includes('Failed to decrypt with DPAPI') || raw.includes('DPAPI')) {
    return 'Chrome/Edge 新版加密限制，无法读取 Cookie。\n解决方法：在左侧设置中改用「Firefox」（推荐），或选「不使用 Cookie」。'
  }

  // cookies.txt 文件格式无效（缺少 Netscape 头部或内容损坏）
  if (raw.includes('invalid Netscape format') || raw.includes('Netscape format')) {
    return 'cookies 文件格式无效，请重新导入 cookies.txt 文件。\n提示：请确认扩展导出的文件是完整的，或尝试重新导出。'
  }

  // 抖音需要 Cookie（未登录或 Cookie 已过期）
  if (raw.includes('Fresh cookies') || (raw.includes('cookies') && raw.includes('Douyin'))) {
    return '抖音需要登录凭证，请在左侧"COOKIE 来源"导入已登录抖音的 cookies.txt 文件。\n提示：导出时需在浏览器中已登录抖音账号。'
  }

  // 需要登录 / 版权限制
  if (raw.includes('This video is only available') || raw.includes('members only') || raw.includes('premium')) {
    return '该视频需要会员或登录才能下载，请在设置中选择已登录该网站的浏览器。'
  }

  // 地区限制（精确匹配，避免误判 URL 中含 /geo/ 的情况）
  if (
    raw.includes('not available in your country') ||
    raw.includes('not available in your region') ||
    raw.includes('geo_restricted') ||
    raw.includes('geo-restriction') ||
    raw.includes('This video is not available in your location')
  ) {
    return '该视频在当前地区不可用（地区限制）。'
  }

  // 私密视频
  if (raw.includes('private video') || raw.includes('Private video')) {
    return '该视频是私密视频，无法下载。'
  }

  // 视频不存在
  if (raw.includes('Video unavailable') || raw.includes('has been removed')) {
    return '视频不存在或已被删除。'
  }

  // SSL / TLS 握手失败
  if (raw.includes('_ssl.c') || raw.includes('SSLError') || raw.includes('EOF occurred in violation of protocol')) {
    return 'SSL 握手失败，可能是网络不稳定或防火墙拦截。请检查网络连接后重试，或在左侧配置代理。'
  }

  // 网络超时
  if (raw.includes('timed out') || raw.includes('timeout')) {
    return '网络超时，请检查网络连接后重试。'
  }

  return raw
}

export interface RunnerOptions {
  args: string[]
  onOutput: (line: string) => void
  onError: (line: string) => void
  onExit: (code: number | null) => void
  timeout?: number
}

export interface RunnerResult {
  process: ChildProcess
  kill: () => void
}

/** 运行 yt-dlp 并流式回调每行输出 */
export function runYtdlp(options: RunnerOptions): RunnerResult {
  const ytdlpPath = getYtdlpPath()
  const { args, onOutput, onError, onExit, timeout = 60000 } = options

  const child = spawn(ytdlpPath, args, {
    windowsHide: true
  })

  let stdoutBuffer = ''
  let stderrBuffer = ''

  child.stdout.on('data', (data: Buffer) => {
    stdoutBuffer += data.toString()
    const lines = stdoutBuffer.split('\n')
    stdoutBuffer = lines.pop() ?? ''
    lines.forEach((line) => {
      const trimmed = line.trim()
      if (trimmed) onOutput(trimmed)
    })
  })

  child.stderr.on('data', (data: Buffer) => {
    stderrBuffer += data.toString()
    const lines = stderrBuffer.split('\n')
    stderrBuffer = lines.pop() ?? ''
    lines.forEach((line) => {
      const trimmed = line.trim()
      if (trimmed) onError(trimmed)
    })
  })

  child.on('close', (code) => {
    if (stdoutBuffer.trim()) onOutput(stdoutBuffer.trim())
    if (stderrBuffer.trim()) onError(stderrBuffer.trim())
    onExit(code)
  })

  // 超时处理（仅用于 --dump-json 解析，不用于下载）
  let timeoutHandle: NodeJS.Timeout | null = null
  if (timeout > 0) {
    timeoutHandle = setTimeout(() => {
      killProcess(child)
    }, timeout)
    child.on('close', () => {
      if (timeoutHandle) clearTimeout(timeoutHandle)
    })
  }

  const kill = () => killProcess(child)
  return { process: child, kill }
}

/** 强制终止进程（包括子进程树） */
export function killProcess(child: ChildProcess): void {
  if (!child.pid || child.killed) return
  try {
    // Windows 上 kill() 不可靠，使用 taskkill 终止整个进程树
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
      windowsHide: true,
      detached: true
    }).unref()
  } catch {
    // 回退到普通 kill
    try {
      child.kill('SIGTERM')
    } catch {
      // 忽略
    }
  }
}

/** 运行 yt-dlp 并收集完整输出（用于 --dump-json） */
export function runYtdlpCollect(args: string[], timeoutMs = 60000): Promise<string> {
  return new Promise((resolve, reject) => {
    const ytdlpPath = getYtdlpPath()
    const child = spawn(ytdlpPath, args, { windowsHide: true })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString() })

    const timer = setTimeout(() => {
      killProcess(child)
      reject(new Error('yt-dlp 超时（解析视频信息超过 60 秒）'))
    }, timeoutMs)

    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) {
        resolve(stdout)
      } else {
        // 提取关键错误信息
        const errLine = stderr.split('\n').find(l => l.includes('ERROR:')) ?? stderr.slice(-300)
        const friendlyMsg = translateYtdlpError(errLine)
        reject(new Error(friendlyMsg || `yt-dlp 退出码: ${code}`))
      }
    })
  })
}
