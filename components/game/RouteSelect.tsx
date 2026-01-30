'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import { t } from '@/lib/i18n'

export interface RouteOption {
  id: string
  name: { zh: string; en: string }
  difficulty: 'easy' | 'normal' | 'hard' | 'elite'
  enemyCount: number
  hasBoss: boolean
  rewardMultiplier: number
  description: { zh: string; en: string }
}

interface RouteSelectProps {
  routes: RouteOption[]
  onSelect: (route: RouteOption) => void
  currentLevel: number
}

const difficultyColors = {
  easy: { bg: 'from-green-500/20 to-green-600/10', border: 'border-green-500/40', text: 'text-green-400' },
  normal: { bg: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/40', text: 'text-cyan-400' },
  hard: { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/40', text: 'text-orange-400' },
  elite: { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/40', text: 'text-purple-400' }
}

export default function RouteSelect({ routes, onSelect, currentLevel }: RouteSelectProps) {
  const language = useGameStore((state) => state.language)

  const getDifficultyLabel = (diff: RouteOption['difficulty']) => {
    return t(`route.${diff}`, language)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl mx-4"
      >
        {/* 标题 */}
        <div className="text-center mb-8">
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200 mb-2"
          >
            {t('route.title', language)}
          </motion.h2>
          <p className="text-cyan-500/60 text-sm">
            {t('route.subtitle', language)} · {t('game.level', language)} {currentLevel + 1}
          </p>
        </div>

        {/* 路线卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {routes.map((route, index) => {
            const colors = difficultyColors[route.difficulty]
            
            return (
              <motion.button
                key={route.id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(route)}
                className={`relative p-6 rounded-2xl border ${colors.border} bg-gradient-to-b ${colors.bg} backdrop-blur-sm text-left transition-all hover:shadow-[0_0_30px_rgba(94,242,255,0.2)]`}
              >
                {/* Boss 标记 */}
                {route.hasBoss && (
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold">
                    {t('route.boss', language)}
                  </div>
                )}

                {/* 路线名称 */}
                <h3 className="text-xl font-bold text-white mb-2">
                  {route.name[language]}
                </h3>

                {/* 描述 */}
                <p className="text-cyan-400/60 text-sm mb-4 min-h-[40px]">
                  {route.description[language]}
                </p>

                {/* 属性 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-500/50 text-xs">{t('route.difficulty', language)}</span>
                    <span className={`text-sm font-semibold ${colors.text}`}>
                      {getDifficultyLabel(route.difficulty)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-500/50 text-xs">{t('route.enemies', language)}</span>
                    <span className="text-cyan-300 text-sm">{route.enemyCount}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-cyan-500/50 text-xs">{t('route.reward', language)}</span>
                    <span className="text-yellow-400 text-sm font-semibold">
                      ×{route.rewardMultiplier.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* 底部装饰线 */}
                <div className={`absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent ${colors.border} to-transparent`} />
              </motion.button>
            )
          })}
        </div>

        {/* 提示 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.5 }}
          className="text-center text-cyan-500/40 text-xs mt-6"
        >
          选择一条路线继续你的旅程
        </motion.p>
      </motion.div>
    </div>
  )
}

// 生成路线选项的工具函数
export function generateRoutes(currentLevel: number): RouteOption[] {
  const baseRoutes: RouteOption[] = [
    {
      id: 'route_easy',
      name: { zh: '安全航道', en: 'Safe Passage' },
      difficulty: 'easy',
      enemyCount: 15 + currentLevel * 2,
      hasBoss: false,
      rewardMultiplier: 1.0,
      description: { zh: '敌人较少，适合恢复', en: 'Fewer enemies, good for recovery' }
    },
    {
      id: 'route_normal',
      name: { zh: '标准航线', en: 'Standard Route' },
      difficulty: 'normal',
      enemyCount: 25 + currentLevel * 3,
      hasBoss: currentLevel >= 2 && Math.random() > 0.5,
      rewardMultiplier: 1.5,
      description: { zh: '平衡的挑战与奖励', en: 'Balanced challenge and rewards' }
    },
    {
      id: 'route_hard',
      name: { zh: '危险区域', en: 'Danger Zone' },
      difficulty: currentLevel >= 3 ? 'elite' : 'hard',
      enemyCount: 35 + currentLevel * 4,
      hasBoss: currentLevel >= 1,
      rewardMultiplier: currentLevel >= 3 ? 2.5 : 2.0,
      description: { 
        zh: currentLevel >= 3 ? '精英敌人出没，高风险高回报' : '更多敌人，更好的奖励', 
        en: currentLevel >= 3 ? 'Elite enemies, high risk high reward' : 'More enemies, better rewards' 
      }
    }
  ]

  // 随机打乱顺序
  return baseRoutes.sort(() => Math.random() - 0.5)
}
