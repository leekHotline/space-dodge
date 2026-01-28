// stores/gameStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover' | 'levelup'
type WeaponType = 'basic' | 'double' | 'triple' | 'laser' | 'missile'
type PowerupType = 'health' | 'shield' | 'weapon' | 'speed' | 'magnet' | 'bomb' | 'score'

interface Achievement {
  id: string
  name: string
  description: string
  unlocked: boolean
  progress: number
  target: number
}

interface GameStats {
  totalGamesPlayed: number
  totalScore: number
  totalKills: number
  totalPlayTime: number
  highestLevel: number
  achievementsUnlocked: number
}

interface GameState {
  // 游戏状态
  phase: GamePhase
  level: number
  score: number
  highScore: number
  combo: number
  maxCombo: number
  
  // 玩家状态
  health: number
  maxHealth: number
  shield: number
  maxShield: number
  weaponType: WeaponType
  weaponLevel: number
  fireRate: number
  moveSpeed: number
  
  // 游戏统计
  kills: number
  totalDodged: number
  playTime: number
  coinsCollected: number
  
  // 持久化数据
  coins: number
  stats: GameStats
  achievements: Achievement[]
  unlockedWeapons: WeaponType[]
  
  // 操作方法
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  endGame: () => void
  nextLevel: () => void
  
  // 玩家操作
  addScore: (points: number) => void
  addKill: () => void
  incrementCombo: () => void
  resetCombo: () => void
  takeDamage: (damage: number) => void
  heal: (amount: number) => void
  addShield: (amount: number) => void
  
  // 武器和道具
  upgradeWeapon: (type: WeaponType) => void
  collectPowerup: (type: PowerupType) => void
  addCoins: (amount: number) => void
  
  // 成就
  checkAchievements: () => void
  unlockAchievement: (id: string) => void
  
  // 其他
  incrementPlayTime: () => void
  incrementDodged: () => void
}

const initialAchievements: Achievement[] = [
  { id: 'first_blood', name: '首杀', description: '摧毁第一个敌人', unlocked: false, progress: 0, target: 1 },
  { id: 'combo_master', name: '连击大师', description: '达成50连击', unlocked: false, progress: 0, target: 50 },
  { id: 'survivor', name: '生存者', description: '存活5分钟', unlocked: false, progress: 0, target: 300 },
  { id: 'rich', name: '富豪', description: '收集1000金币', unlocked: false, progress: 0, target: 1000 },
  { id: 'destroyer', name: '毁灭者', description: '摧毁100个敌人', unlocked: false, progress: 0, target: 100 },
  { id: 'level_10', name: '十级战士', description: '达到第10关', unlocked: false, progress: 0, target: 10 },
  { id: 'perfect', name: '完美', description: '一局不受伤通过5关', unlocked: false, progress: 0, target: 5 },
  { id: 'millionaire', name: '百万富翁', description: '单局得分超过100万', unlocked: false, progress: 0, target: 1000000 },
]

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // 游戏状态
      phase: 'menu',
      level: 1,
      score: 0,
      highScore: 0,
      combo: 0,
      maxCombo: 0,
      
      // 玩家状态
      health: 100,
      maxHealth: 100,
      shield: 0,
      maxShield: 100,
      weaponType: 'basic',
      weaponLevel: 1,
      fireRate: 1,
      moveSpeed: 1,
      
      // 游戏统计
      kills: 0,
      totalDodged: 0,
      playTime: 0,
      coinsCollected: 0,
      
      // 持久化数据
      coins: 0,
      stats: {
        totalGamesPlayed: 0,
        totalScore: 0,
        totalKills: 0,
        totalPlayTime: 0,
        highestLevel: 0,
        achievementsUnlocked: 0,
      },
      achievements: initialAchievements,
      unlockedWeapons: ['basic'],

      startGame: () => {
        const state = get()
        set({
          phase: 'playing',
          level: 1,
          score: 0,
          combo: 0,
          maxCombo: 0,
          health: 100,
          maxHealth: 100,
          shield: 0,
          weaponType: 'basic',
          weaponLevel: 1,
          fireRate: 1,
          moveSpeed: 1,
          kills: 0,
          totalDodged: 0,
          playTime: 0,
          coinsCollected: 0,
          stats: {
            ...state.stats,
            totalGamesPlayed: state.stats.totalGamesPlayed + 1,
          }
        })
      },

      pauseGame: () => set({ phase: 'paused' }),
      resumeGame: () => set({ phase: 'playing' }),

      endGame: () => {
        const state = get()
        const newHighScore = Math.max(state.score, state.highScore)
        set({
          phase: 'gameover',
          highScore: newHighScore,
          stats: {
            ...state.stats,
            totalScore: state.stats.totalScore + state.score,
            totalKills: state.stats.totalKills + state.kills,
            totalPlayTime: state.stats.totalPlayTime + state.playTime,
            highestLevel: Math.max(state.stats.highestLevel, state.level),
          }
        })
        get().checkAchievements()
      },

      nextLevel: () => {
        const state = get()
        set({
          phase: 'levelup',
          level: state.level + 1,
          health: Math.min(state.health + 20, state.maxHealth),
          shield: Math.min(state.shield + 50, state.maxShield),
        })
        setTimeout(() => {
          if (get().phase === 'levelup') {
            set({ phase: 'playing' })
          }
        }, 3000)
      },

      addScore: (points) => {
        const state = get()
        const multiplier = 1 + (state.combo * 0.1) + (state.level * 0.05)
        const finalPoints = Math.floor(points * multiplier)
        set({ score: state.score + finalPoints })
      },

      addKill: () => {
        const state = get()
        set({ kills: state.kills + 1 })
        get().incrementCombo()
        get().addScore(100)
      },

      incrementCombo: () => set((state) => {
        const newCombo = state.combo + 1
        return {
          combo: newCombo,
          maxCombo: Math.max(state.maxCombo, newCombo)
        }
      }),

      resetCombo: () => set({ combo: 0 }),

      takeDamage: (damage) => {
        const state = get()
        let remainingDamage = damage
        
        // 先扣护盾
        if (state.shield > 0) {
          const shieldDamage = Math.min(state.shield, remainingDamage)
          remainingDamage -= shieldDamage
          set({ shield: state.shield - shieldDamage })
        }
        
        // 再扣血量
        if (remainingDamage > 0) {
          const newHealth = Math.max(0, state.health - remainingDamage)
          set({ health: newHealth })
          get().resetCombo()
          
          if (newHealth <= 0) {
            get().endGame()
          }
        }
      },

      heal: (amount) => set((state) => ({
        health: Math.min(state.health + amount, state.maxHealth)
      })),

      addShield: (amount) => set((state) => ({
        shield: Math.min(state.shield + amount, state.maxShield)
      })),

      upgradeWeapon: (type) => set({ weaponType: type, weaponLevel: 1 }),

      collectPowerup: (type) => {
        const state = get()
        switch (type) {
          case 'health':
            get().heal(30)
            break
          case 'shield':
            get().addShield(50)
            break
          case 'weapon':
            const weapons: WeaponType[] = ['double', 'triple', 'laser', 'missile']
            const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)]
            get().upgradeWeapon(randomWeapon)
            break
          case 'speed':
            set({ moveSpeed: Math.min(state.moveSpeed + 0.2, 2) })
            break
          case 'magnet':
            // 磁铁效果在游戏逻辑中处理
            break
          case 'bomb':
            // 炸弹效果在游戏逻辑中处理
            break
          case 'score':
            get().addScore(500)
            break
        }
      },

      addCoins: (amount) => set((state) => ({
        coins: state.coins + amount,
        coinsCollected: state.coinsCollected + amount
      })),

      checkAchievements: () => {
        const state = get()
        const achievements = [...state.achievements]
        let updated = false

        achievements.forEach(achievement => {
          if (achievement.unlocked) return

          let progress = 0
          switch (achievement.id) {
            case 'first_blood':
              progress = state.kills
              break
            case 'combo_master':
              progress = state.maxCombo
              break
            case 'survivor':
              progress = state.playTime
              break
            case 'rich':
              progress = state.coins
              break
            case 'destroyer':
              progress = state.stats.totalKills
              break
            case 'level_10':
              progress = state.level
              break
            case 'millionaire':
              progress = state.score
              break
          }

          achievement.progress = progress
          if (progress >= achievement.target && !achievement.unlocked) {
            achievement.unlocked = true
            updated = true
          }
        })

        if (updated) {
          const unlockedCount = achievements.filter(a => a.unlocked).length
          set({
            achievements,
            stats: {
              ...state.stats,
              achievementsUnlocked: unlockedCount
            }
          })
        }
      },

      unlockAchievement: (id) => {
        const state = get()
        const achievements = state.achievements.map(a =>
          a.id === id ? { ...a, unlocked: true } : a
        )
        set({ achievements })
      },

      incrementPlayTime: () => set((state) => ({
        playTime: state.playTime + 1
      })),

      incrementDodged: () => set((state) => ({
        totalDodged: state.totalDodged + 1
      })),
    }),
    {
      name: 'space-shooter-storage',
      partialize: (state) => ({
        highScore: state.highScore,
        coins: state.coins,
        stats: state.stats,
        achievements: state.achievements,
        unlockedWeapons: state.unlockedWeapons,
      }),
    }
  )
)
