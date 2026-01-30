import { z } from 'zod'

export const itemTypeSchema = z.enum(['permanent', 'buff'])

export const itemTagSchema = z.enum([
  'energy',
  'crit',
  'mobility',
  'precision',
  'clone',
  'burst',
  'defense',
  'life',
  'echo',
  'overload',
  'corrosion'
])

export const localizedTextSchema = z.object({
  zh: z.string(),
  en: z.string()
})

export const itemDefinitionSchema = z.object({
  id: z.string(),
  name: localizedTextSchema,
  type: itemTypeSchema,
  tags: z.array(itemTagSchema),
  description: localizedTextSchema,
  durationSec: z.number().optional(),
  stats: z.record(z.string(), z.number())
})

export const enemyDefinitionSchema = z.object({
  id: z.string(),
  name: localizedTextSchema,
  family: z.enum(['space', 'old-testament']),
  baseHp: z.number(),
  baseSpeed: z.number(),
  baseDamage: z.number(),
  behavior: z.string(),
  size: z.number().optional(),
  weight: z.number().optional()
})

export const levelConfigSchema = z.object({
  baseHp: z.number(),
  baseShield: z.number(),
  baseFireRate: z.number(),
  baseMoveSpeed: z.number(),
  difficultyGrowthPct: z.number(),
  eliteMultiplier: z.number(),
  bossMultiplier: z.number(),
  waveDurationSec: z.number(),
  bossEvery: z.number(),
  enemyWeights: z.record(z.string(), z.number()).optional(),
  eliteRatio: z.number().optional(),
  bossChancePct: z.number().optional()
})

export const dropConfigSchema = z.object({
  normalDropChance: z.number(),
  eliteDropChance: z.number(),
  bossGuaranteed: z.boolean(),
  itemWeights: z.object({
    permanent: z.number(),
    buff: z.number()
  })
})

export const itemsResponseSchema = z.object({
  items: z.array(itemDefinitionSchema)
})

export const enemiesResponseSchema = z.object({
  enemies: z.array(enemyDefinitionSchema)
})

export const configResponseSchema = z.object({
  levelConfig: levelConfigSchema,
  dropConfig: dropConfigSchema
})

export type ItemDefinition = z.infer<typeof itemDefinitionSchema>
export type EnemyDefinition = z.infer<typeof enemyDefinitionSchema>
export type LevelConfig = z.infer<typeof levelConfigSchema>
export type DropConfig = z.infer<typeof dropConfigSchema>
