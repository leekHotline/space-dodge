'use client'

import { useEffect, useState } from 'react'
import {
  configResponseSchema,
  enemiesResponseSchema,
  itemsResponseSchema,
  type DropConfig,
  type EnemyDefinition,
  type ItemDefinition,
  type LevelConfig
} from '@/lib/schema'

type DebugPanelProps = {
  open: boolean
  onClose: () => void
}

type ConfigPayload = {
  levelConfig: LevelConfig
  dropConfig: DropConfig
}

export default function DebugPanel({ open, onClose }: DebugPanelProps) {
  const [items, setItems] = useState<ItemDefinition[]>([])
  const [enemies, setEnemies] = useState<EnemyDefinition[]>([])
  const [config, setConfig] = useState<ConfigPayload | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    let isMounted = true

    const load = async () => {
      setStatus('loading')
      setErrors([])
      try {
        const [itemsRes, enemiesRes, configRes] = await Promise.all([
          fetch('/api/items'),
          fetch('/api/enemies'),
          fetch('/api/config')
        ])
        const [itemsJson, enemiesJson, configJson] = await Promise.all([
          itemsRes.json(),
          enemiesRes.json(),
          configRes.json()
        ])

        const nextErrors: string[] = []
        const parsedItems = itemsResponseSchema.safeParse(itemsJson)
        const parsedEnemies = enemiesResponseSchema.safeParse(enemiesJson)
        const parsedConfig = configResponseSchema.safeParse(configJson)

        if (!parsedItems.success) {
          nextErrors.push('items schema mismatch')
        }
        if (!parsedEnemies.success) {
          nextErrors.push('enemies schema mismatch')
        }
        if (!parsedConfig.success) {
          nextErrors.push('config schema mismatch')
        }

        if (!isMounted) return
        if (parsedItems.success) setItems(parsedItems.data.items)
        if (parsedEnemies.success) setEnemies(parsedEnemies.data.enemies)
        if (parsedConfig.success) setConfig(parsedConfig.data)

        setErrors(nextErrors)
        setStatus(nextErrors.length > 0 ? 'error' : 'ready')
      } catch (error) {
        if (!isMounted) return
        setErrors([error instanceof Error ? error.message : 'unknown error'])
        setStatus('error')
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [open])

  if (!open) return null

  return (
    <div className="absolute right-6 top-24 z-40 w-[360px] max-w-[90vw] rounded-2xl border border-cyan-500/30 bg-black/85 p-4 text-xs text-gray-200 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between">
        <span className="text-cyan-300 uppercase tracking-[0.24em]">Debug Panel</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
          Close
        </button>
      </div>

      <div className="mt-2 rounded-lg border border-cyan-400/20 bg-black/40 px-3 py-2 text-[11px] text-gray-300">
        Status: <span className="text-cyan-200">{status}</span>
      </div>

      {errors.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-[11px] text-red-200">
          {errors.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-4">
        <section>
          <h3 className="text-[11px] uppercase tracking-[0.24em] text-gray-400">
            Items ({items.length})
          </h3>
          <div className="mt-2 space-y-1">
            {items.length === 0 && <div className="text-gray-500">--</div>}
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-2">
                <span className="text-gray-200">
                  {item.id} {item.name.en}
                </span>
                <span className="text-gray-500">{item.type}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[11px] uppercase tracking-[0.24em] text-gray-400">
            Enemies ({enemies.length})
          </h3>
          <div className="mt-2 space-y-1">
            {enemies.length === 0 && <div className="text-gray-500">--</div>}
            {enemies.map((enemy) => (
              <div key={enemy.id} className="flex items-start justify-between gap-2">
                <span className="text-gray-200">
                  {enemy.id} {enemy.name.en}
                </span>
                <span className="text-gray-500">{enemy.behavior}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[11px] uppercase tracking-[0.24em] text-gray-400">Config</h3>
          {!config && <div className="mt-2 text-gray-500">--</div>}
          {config && (
            <div className="mt-2 space-y-1 text-[11px] text-gray-300">
              <div>Wave Duration: {config.levelConfig.waveDurationSec}s</div>
              <div>Boss Every: {config.levelConfig.bossEvery} levels</div>
              <div>Normal Drop: {Math.round(config.dropConfig.normalDropChance * 100)}%</div>
              <div>Elite Drop: {Math.round(config.dropConfig.eliteDropChance * 100)}%</div>
              <div>Boss Guaranteed: {config.dropConfig.bossGuaranteed ? 'yes' : 'no'}</div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
