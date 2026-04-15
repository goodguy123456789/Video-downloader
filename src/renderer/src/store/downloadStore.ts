import { create } from 'zustand'
import type { DownloadStatus } from '../../../../preload/types'

export interface DownloadItem {
  taskId: string
  title: string
  thumbnail: string
  formatLabel: string
  status: DownloadStatus
  percent: number
  speed: string
  eta: string
  filename: string
  filePath: string
  fileSize: number
  error?: string
}

interface DownloadStore {
  items: Map<string, DownloadItem>

  addItem: (item: Omit<DownloadItem, 'status' | 'percent' | 'speed' | 'eta' | 'filename' | 'filePath' | 'fileSize'>) => void
  updateProgress: (taskId: string, updates: Partial<DownloadItem>) => void
  setCompleted: (taskId: string, filePath: string, fileSize: number) => void
  setFailed: (taskId: string, error: string) => void
  removeItem: (taskId: string) => void
  clearCompleted: () => void
  getItems: () => DownloadItem[]
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  items: new Map(),

  addItem: (item) =>
    set((state) => {
      const newItems = new Map(state.items)
      newItems.set(item.taskId, {
        ...item,
        status: 'pending',
        percent: 0,
        speed: '',
        eta: '',
        filename: '',
        filePath: '',
        fileSize: 0
      })
      return { items: newItems }
    }),

  updateProgress: (taskId, updates) =>
    set((state) => {
      const existing = state.items.get(taskId)
      if (!existing) return state
      const newItems = new Map(state.items)
      newItems.set(taskId, { ...existing, ...updates, status: 'downloading' })
      return { items: newItems }
    }),

  setCompleted: (taskId, filePath, fileSize) =>
    set((state) => {
      const existing = state.items.get(taskId)
      if (!existing) return state
      const newItems = new Map(state.items)
      newItems.set(taskId, { ...existing, status: 'completed', percent: 100, filePath, fileSize })
      return { items: newItems }
    }),

  setFailed: (taskId, error) =>
    set((state) => {
      const existing = state.items.get(taskId)
      if (!existing) return state
      const newItems = new Map(state.items)
      newItems.set(taskId, { ...existing, status: 'failed', error })
      return { items: newItems }
    }),

  removeItem: (taskId) =>
    set((state) => {
      const newItems = new Map(state.items)
      newItems.delete(taskId)
      return { items: newItems }
    }),

  clearCompleted: () =>
    set((state) => {
      const newItems = new Map(state.items)
      newItems.forEach((item, key) => {
        if (item.status === 'completed' || item.status === 'failed') {
          newItems.delete(key)
        }
      })
      return { items: newItems }
    }),

  getItems: () => Array.from(get().items.values())
}))
