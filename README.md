<p align="center">
  <img src="resources/icon.png" width="96" alt="万能视频下载器" />
</p>

<h1 align="center">万能视频下载器</h1>

<p align="center">
  <strong>一键下载 B站大会员 · YouTube Premium · 1000+ 平台视频</strong><br/>
  无需命令行，解决网页版无法下载、会员视频无法保存的痛点
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Windows-blue?logo=windows" />
  <img src="https://img.shields.io/badge/Electron-33-47848F?logo=electron" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/yt--dlp-latest-FF0000" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
</p>

---

## 痛点，我们都懂

- 在 B 站追番，却发现**网页版根本没有下载按钮**
- 开了大会员，想把喜欢的视频存下来慢慢看，**下载工具却提示无权限**
- 想用命令行工具，却对着一堆参数**完全不知道怎么用**

**万能视频下载器** 就是为此而生——打开即用，粘贴链接，选画质，点下载。

---

## 功能亮点

### 解决会员视频无法下载
通过导入浏览器 cookies，让下载器"假装"成你已登录的账号，从而突破会员限制，下载 **B站大会员 / Anime / 课程** 等付费内容。

### 支持 1000+ 视频平台
底层基于 [yt-dlp](https://github.com/yt-dlp/yt-dlp)，原生支持：

| 平台 | 支持内容 |
|------|----------|
| **B站 (bilibili.com)** | 普通视频、大会员番剧、课程、直播回放 |
| **YouTube** | 普通视频、Premium 内容、播放列表 |
| **抖音 / TikTok** | 短视频、无水印下载 |
| **微博 / 微信视频号** | 视频内容 |
| **Twitter / X** | 视频推文 |
| **1000+ 其他平台** | 自动识别，覆盖主流全球视频站 |

### 画质自由选择
解析完成后展示所有可用格式，从 **4K / 1080P** 到纯音频，按需选择。

### 开箱即用，无需配置
- 首次启动**自动下载 yt-dlp 核心引擎**，无需手动安装任何依赖
- 界面全中文，新手友好
- 下载进度实时显示，支持**随时取消**
- 自动记录历史下载记录

---

## 截图预览

> 暂无截图，欢迎贡献！

---

## 下载安装

前往 [Releases](../../releases) 页面下载最新版本：

| 安装包 | 说明 |
|--------|------|
| `万能视频下载器 Setup x.x.x.exe` | 标准安装版，可自定义安装目录 |
| `万能视频下载器 x.x.x.exe` | 免安装便携版，下载即用 |

> 系统要求：Windows 10 / 11 x64

---

## 如何下载会员视频（B站大会员）

1. **安装浏览器扩展**
   在 Chrome / Edge 扩展商店搜索 **`get cookies txt`**（开发者：yaagame）并安装

2. **登录 B 站**
   打开 [bilibili.com](https://www.bilibili.com) 并确保已登录**大会员账号**

3. **导出 cookies.txt**
   点击扩展图标 → 选择当前网站 → 点击「Export」→ 保存文件到桌面

4. **导入到本软件**
   在软件左侧「Cookie 来源」选择「导入文件」→ 选择刚才保存的 `cookies.txt`

5. **粘贴视频链接，开始下载**

---

## 本地开发

```bash
# 克隆项目
git clone https://github.com/goodguy123456789/video-downloader.git
cd video-downloader

# 安装依赖
npm install

# 启动开发模式
npm run dev

# 打包为 Windows 安装程序
npm run build
```

**技术栈：**
- [Electron](https://electronjs.org/) — 跨平台桌面应用框架
- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) — 前端界面
- [Tailwind CSS](https://tailwindcss.com/) — 样式
- [electron-vite](https://evite.netlify.app/) — 构建工具
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — 视频下载引擎

---

## 常见问题

**Q: 提示"无法读取 Cookie"怎么办？**
> Chrome / Edge 新版本加密了 Cookie 数据库，yt-dlp 无法直接读取。请使用扩展导出 `cookies.txt` 文件再导入，详见上方教程。

**Q: 下载速度很慢怎么办？**
> 在软件设置中填写代理地址（支持 HTTP / SOCKS5），可显著提升访问 YouTube 等海外平台的速度。

**Q: 支持 Mac / Linux 吗？**
> 目前仅提供 Windows 构建。代码基于 Electron，理论上可自行编译到其他平台，欢迎 PR。

**Q: 会员视频下载是否违规？**
> 本工具仅供个人存档、离线学习使用。请遵守各平台使用协议，**切勿用于商业传播**。

---

## 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的 feature 分支：`git checkout -b feature/your-feature`
3. 提交改动：`git commit -m 'feat: add some feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 发起 Pull Request

---

## License

[MIT](LICENSE) © 2024 goodguy123456789
