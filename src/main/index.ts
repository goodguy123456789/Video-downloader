import { app, BrowserWindow, nativeTheme, session } from 'electron'
import path from 'path'
import { registerAllHandlers } from './ipc'
import { initYtdlp } from './services/ytdlp/ytdlpManager'
import { cleanupAll } from './services/download/downloadManager'
import { loadSettings } from './services/settings/settingsStore'

// 开发环境检测
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  nativeTheme.themeSource = 'dark'

  mainWindow = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 800,
    minHeight: 560,
    frame: false,           // 自定义标题栏
    backgroundColor: '#0f172a',
    titleBarStyle: 'hidden',
    show: false,            // 等内容加载完再显示
    icon: path.join(__dirname, '../../resources/icon.ico').replace('app.asar', 'app.asar.unpacked'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // 注册所有 IPC handler
  registerAllHandlers()

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // 加载页面
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  // 加载持久化设置
  loadSettings()
  // 注入 Referer 头，解决 B站/抖音等平台 CDN 防盗链问题
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://*/*', 'http://*/*'] },
    (details, callback) => {
      if (details.resourceType === 'image') {
        try {
          const url = new URL(details.url)
          if (!details.requestHeaders['Referer'] && !details.requestHeaders['referer']) {
            details.requestHeaders['Referer'] = `${url.protocol}//${url.hostname}/`
          }
        } catch {
          // 忽略无效 URL
        }
      }
      callback({ requestHeaders: details.requestHeaders })
    }
  )

  createWindow()

  // 初始化 yt-dlp（在后台运行，进度通过 IPC 推送）
  initYtdlp((percent, status) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send('ytdlp:initProgress', { percent, status })
      }
    })
  }).then((result) => {
    console.log('[ytdlp]', result)
  }).catch((err) => {
    console.error('[ytdlp] 初始化失败:', err)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    cleanupAll()
    app.quit()
  }
})

app.on('before-quit', () => {
  cleanupAll()
})
