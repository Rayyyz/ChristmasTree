import { create } from 'zustand'

export type GestureType = 'IDLE' | 'PINCH' | 'OPEN'

interface AppState {
  started: boolean
  setStarted: (started: boolean) => void
  
  // Hand Tracking
  handDetected: boolean
  setHandDetected: (detected: boolean) => void
  gesture: GestureType
  setGesture: (gesture: GestureType) => void
  
  // Scene State
  mode: 'TREE' | 'CHAOS'
  setMode: (mode: 'TREE' | 'CHAOS') => void
}

export const useStore = create<AppState>((set) => ({
  started: false,
  setStarted: (started) => set({ started }),
  
  handDetected: false,
  setHandDetected: (detected) => set({ handDetected: detected }),
  gesture: 'IDLE',
  setGesture: (gesture) => set({ gesture }),
  
  mode: 'TREE',
  setMode: (mode) => set({ mode }),
}))
