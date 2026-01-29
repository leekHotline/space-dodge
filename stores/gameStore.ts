import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover'
export type Language = 'zh' | 'en'

export interface ActiveItem {
  id: string
  name: { zh: string; en: string }
  type: 'permanent' | 'buff'
  expiresAt?: number
}

interface GameState {
  phase: GamePhase
  level: number
  score: number
  highScore: number
  kills: number
  timeSec: number
  bossPhase: number | null
  seed: string
  language: Language
  playerName: string
  activeItems: ActiveItem[]

  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  endGame: () => void
  setLevel: (level: number) => void
  setTimeSec: (timeSec: number) => void
  setBossPhase: (phase: number | null) => void
  addScore: (amount: number) => void
  addKill: () => void
  addItem: (item: ActiveItem) => void
  removeExpiredItems: (timeSec: number) => void
  setLanguage: (language: Language) => void
  setPlayerName: (playerName: string) => void
}

const randomSeed = () => Math.random().toString(36).slice(2, 10)

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      phase: 'menu',
      level: 1,
      score: 0,
      highScore: 0,
      kills: 0,
      timeSec: 0,
      bossPhase: null,
      seed: randomSeed(),
      language: 'zh',
      playerName: 'Pilot',
      activeItems: [],

      startGame: () => {
        set({
          phase: 'playing',
          level: 1,
          score: 0,
          kills: 0,
          timeSec: 0,
          bossPhase: null,
          seed: randomSeed(),
          activeItems: []
        })
      },

      pauseGame: () => set({ phase: 'paused' }),
      resumeGame: () => set({ phase: 'playing' }),

      endGame: () => {
        const state = get()
        set({
          phase: 'gameover',
          highScore: Math.max(state.highScore, state.score)
        })
      },

      setLevel: (level) => set({ level }),
      setTimeSec: (timeSec) => set({ timeSec }),
      setBossPhase: (phase) => set({ bossPhase: phase }),
      addScore: (amount) => set((state) => ({ score: state.score + amount })),
      addKill: () => set((state) => ({ kills: state.kills + 1 })),

      addItem: (item) =>
        set((state) => {
          const exists = state.activeItems.find((entry) => entry.id === item.id)
          if (exists) {
            return {
              activeItems: state.activeItems.map((entry) =>
                entry.id === item.id
                  ? { ...entry, expiresAt: item.expiresAt ?? entry.expiresAt }
                  : entry
              )
            }
          }
          return { activeItems: [...state.activeItems, item] }
        }),

      removeExpiredItems: (timeSec) =>
        set((state) => ({
          activeItems: state.activeItems.filter((item) => !item.expiresAt || item.expiresAt > timeSec)
        })),

      setLanguage: (language) => set({ language }),
      setPlayerName: (playerName) => set({ playerName })
    }),
    {
      name: 'space-dodge-storage',
      partialize: (state) => ({
        highScore: state.highScore,
        language: state.language,
        playerName: state.playerName
      })
    }
  )
)
