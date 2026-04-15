import { getHistoryFilePath } from '../../utils/pathUtils'
import { readJsonFile, writeJsonFile } from '../../utils/fileUtils'
import type { HistoryItem } from '../../../preload/types'

/** 读取全部历史记录 */
export async function getAllHistory(): Promise<HistoryItem[]> {
  return readJsonFile<HistoryItem[]>(getHistoryFilePath(), [])
}

/** 添加一条历史记录 */
export async function addHistory(item: Omit<HistoryItem, 'id' | 'downloadedAt'>): Promise<void> {
  const history = await getAllHistory()
  const newItem: HistoryItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    downloadedAt: new Date().toISOString()
  }
  // 最多保留 200 条，按时间倒序插入
  const updated = [newItem, ...history].slice(0, 200)
  await writeJsonFile(getHistoryFilePath(), updated)
}

/** 清空历史记录 */
export async function clearHistory(): Promise<void> {
  await writeJsonFile(getHistoryFilePath(), [])
}
