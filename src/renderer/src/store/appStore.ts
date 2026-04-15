import { create } from 'zustand'

export type YtdlpStatus = 'idle' | 'checking' | 'downloading' | 'ready' | 'error'

interface AppState {
  ytdlpStatus: YtdlpStatus
  ytdlpVersion: string
  ytdlpInitPercent: number
  ytdlpInitMessage: string
  ytdlpError: string

  setYtdlpStatus: (status: YtdlpStatus) => void
  setYtdlpVersion: (version: string) => void
  setYtdlpInitProgress: (percent: number, message: string) => void
  setYtdlpError: (error: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  ytdlpStatus: 'idle',
  ytdlpVersion: '',
  ytdlpInitPercent: 0,
  ytdlpInitMessage: '',
  ytdlpError: '',

  setYtdlpStatus: (status) => set({ ytdlpStatus: status }),
  setYtdlpVersion: (version) => set({ ytdlpVersion: version }),
  setYtdlpInitProgress: (percent, message) =>
    set({ ytdlpInitPercent: percent, ytdlpInitMessage: message }),
  setYtdlpError: (error) => set({ ytdlpError: error })
}))
