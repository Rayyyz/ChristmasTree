import { create } from 'zustand'

export type GestureType = 'IDLE' | 'FIST' | 'OPEN'

interface AppState {
  started: boolean
  setStarted: (started: boolean) => void
  
  // Hand Tracking
  handDetected: boolean
  setHandDetected: (detected: boolean) => void
  gesture: GestureType
  setGesture: (gesture: GestureType) => void
  handPosition: { x: number, y: number }
  setHandPosition: (pos: { x: number, y: number }) => void
  handSize: number,
  setHandSize: (size: number) => void,
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
  handPosition: { x: 0, y: 0 },
  setHandPosition: (pos) => set({ handPosition: pos }),
  handSize: 0,
  setHandSize: (size) => set({ handSize: size }),
  
  mode: 'TREE',
  setMode: (mode) => set({ mode }),
}))
