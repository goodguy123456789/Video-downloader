import fs from 'fs'
import path from 'path'

/** 确保目录存在，不存在则创建 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.promises.mkdir(dirPath, { recursive: true })
}

/** 检查文件是否存在 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

/** 获取文件大小（字节），文件不存在返回 0 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stat = await fs.promises.stat(filePath)
    return stat.size
  } catch {
    return 0
  }
}

/** 读取 JSON 文件，失败返回默认值 */
export async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch {
    return defaultValue
  }
}

/** 写入 JSON 文件 */
export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  const dir = path.dirname(filePath)
  await ensureDir(dir)
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}
