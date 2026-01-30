import type { DropConfig, EnemyDefinition, ItemDefinition, LevelConfig } from '@/lib/schema'

export const items: ItemDefinition[] = [
  {
    id: 'I01',
    name: { zh: '星核电容', en: 'Star Capacitor' },
    type: 'permanent',
    tags: ['energy', 'crit'],
    description: { zh: '能量伤害+12%，暴击+3%', en: 'Energy damage +12%, crit +3%' },
    stats: { energyDamagePct: 12, critPct: 3 }
  },
  {
    id: 'I02',
    name: { zh: '裂隙喷口', en: 'Rift Thruster' },
    type: 'permanent',
    tags: ['mobility'],
    description: { zh: '移速+12%，闪避窗口+0.08s', en: 'Move speed +12%, dodge window +0.08s' },
    stats: { moveSpeedPct: 12, dodgeWindowMs: 80 }
  },
  {
    id: 'I03',
    name: { zh: '星图陀螺', en: 'Star Gyro' },
    type: 'permanent',
    tags: ['precision'],
    description: { zh: '子弹扩散-20%，精准+15%', en: 'Spread -20%, accuracy +15%' },
    stats: { spreadPct: -20, accuracyPct: 15 }
  },
  {
    id: 'I04',
    name: { zh: '量子镜像', en: 'Quantum Mirror' },
    type: 'permanent',
    tags: ['clone'],
    description: { zh: '10% 概率复制子弹', en: '10% chance to clone bullets' },
    stats: { cloneChancePct: 10 }
  },
  {
    id: 'I05',
    name: { zh: '破城楔', en: 'Siege Spike' },
    type: 'permanent',
    tags: ['burst'],
    description: { zh: '对精英/首领伤害+20%', en: 'Elite/Boss damage +20%' },
    stats: { eliteBossDamagePct: 20 }
  },
  {
    id: 'I06',
    name: { zh: '陨铁铠', en: 'Meteor Armor' },
    type: 'permanent',
    tags: ['defense'],
    description: { zh: '护盾上限+30%', en: 'Shield cap +30%' },
    stats: { shieldCapPct: 30 }
  },
  {
    id: 'I07',
    name: { zh: '幽蓝核心', en: 'Azure Core' },
    type: 'permanent',
    tags: ['crit'],
    description: { zh: '暴击伤害+35%', en: 'Crit damage +35%' },
    stats: { critDamagePct: 35 }
  },
  {
    id: 'I08',
    name: { zh: '残响线圈', en: 'Echo Coil' },
    type: 'permanent',
    tags: ['echo'],
    description: { zh: '击杀后 1.2s 释放回声弹', en: 'On kill, fire an echo shot after 1.2s' },
    stats: { echoDelayMs: 1200 }
  },
  {
    id: 'I09',
    name: { zh: '生命回路', en: 'Life Circuit' },
    type: 'permanent',
    tags: ['life'],
    description: { zh: '伤害 2% 转化为治疗', en: 'Convert 2% of damage to healing' },
    stats: { lifeStealPct: 2 }
  },
  {
    id: 'I10',
    name: { zh: '光滑石', en: 'Polished Stone' },
    type: 'permanent',
    tags: ['mobility', 'defense'],
    description: { zh: '移动时受到伤害-10%', en: 'Take 10% less damage while moving' },
    stats: { movingDamageReducePct: 10 }
  },
  {
    id: 'I11',
    name: { zh: '过载脉冲', en: 'Overload Pulse' },
    type: 'buff',
    tags: ['overload'],
    description: { zh: '12s 射速+40%，后继 3s 过热-15%', en: '12s fire rate +40%, then 3s overheat -15%' },
    durationSec: 12,
    stats: { fireRatePct: 40, overheatPct: -15 }
  },
  {
    id: 'I12',
    name: { zh: '星疫', en: 'Star Blight' },
    type: 'buff',
    tags: ['corrosion'],
    description: { zh: '10s 命中使敌人腐蚀(DoT)', en: '10s corrosion on hit (DoT)' },
    durationSec: 10,
    stats: { dotDamagePct: 8 }
  }
]

export const enemies: EnemyDefinition[] = [
  {
    id: 'E01',
    name: { zh: '轨道撕裂者', en: 'Orbital Ripper' },
    family: 'space',
    baseHp: 40,
    baseSpeed: 2.2,
    baseDamage: 10,
    behavior: 'charge',
    weight: 1.2
  },
  {
    id: 'E02',
    name: { zh: '尘环蠕群', en: 'Dust Swarm' },
    family: 'space',
    baseHp: 24,
    baseSpeed: 2.6,
    baseDamage: 6,
    behavior: 'swarm',
    size: 14,
    weight: 1.4
  },
  {
    id: 'E03',
    name: { zh: '虚空鲨', en: 'Void Shark' },
    family: 'space',
    baseHp: 70,
    baseSpeed: 1.8,
    baseDamage: 14,
    behavior: 'dash',
    weight: 1
  },
  {
    id: 'E04',
    name: { zh: '黯星结节', en: 'Dark Node' },
    family: 'space',
    baseHp: 55,
    baseSpeed: 1.2,
    baseDamage: 8,
    behavior: 'summon',
    weight: 0.9
  },
  {
    id: 'E05',
    name: { zh: '利维坦胚', en: 'Leviathan Spawn' },
    family: 'old-testament',
    baseHp: 120,
    baseSpeed: 1.0,
    baseDamage: 16,
    behavior: 'bruiser',
    weight: 0.7
  },
  {
    id: 'E06',
    name: { zh: '审判之眼', en: 'Eye of Judgement' },
    family: 'old-testament',
    baseHp: 45,
    baseSpeed: 1.4,
    baseDamage: 12,
    behavior: 'shooter',
    weight: 1
  },
  {
    id: 'E07',
    name: { zh: '所多玛烟影', en: 'Sodom Wraith' },
    family: 'old-testament',
    baseHp: 50,
    baseSpeed: 2.0,
    baseDamage: 11,
    behavior: 'blink',
    weight: 0.8
  },
  {
    id: 'E08',
    name: { zh: '旧约司祭', en: 'Old Priest' },
    family: 'old-testament',
    baseHp: 65,
    baseSpeed: 1.1,
    baseDamage: 9,
    behavior: 'buffer',
    weight: 0.6
  }
]

export const levelConfig: LevelConfig = {
  baseHp: 120,
  baseShield: 60,
  baseFireRate: 0.18,
  baseMoveSpeed: 4.2,
  difficultyGrowthPct: 8,
  eliteMultiplier: 2.2,
  bossMultiplier: 40,
  waveDurationSec: 150,
  bossEvery: 3,
  enemyWeights: {
    space: 0.65,
    'old-testament': 0.35
  },
  eliteRatio: 0.12,
  bossChancePct: 100
}

export const dropConfig: DropConfig = {
  normalDropChance: 0.12,
  eliteDropChance: 0.35,
  bossGuaranteed: true,
  itemWeights: {
    permanent: 0.7,
    buff: 0.3
  }
}
