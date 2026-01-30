/**
 * 国际化文案字典 (M1f)
 * 支持中文 (zh) 和英文 (en)
 */

export type Language = 'zh' | 'en'

export const i18n = {
  // 通用
  common: {
    loading: { zh: '加载中...', en: 'Loading...' },
    start: { zh: '开始游戏', en: 'Start Game' },
    continue: { zh: '继续', en: 'Continue' },
    pause: { zh: '暂停', en: 'Paused' },
    resume: { zh: '继续', en: 'Resume' },
    quit: { zh: '退出', en: 'Quit' },
    retry: { zh: '重试', en: 'Retry' },
    back: { zh: '返回', en: 'Back' },
    confirm: { zh: '确认', en: 'Confirm' },
    cancel: { zh: '取消', en: 'Cancel' }
  },

  // 首页
  landing: {
    title: { zh: 'SPACE DODGE', en: 'SPACE DODGE' },
    subtitle: { zh: '太空闪避者', en: 'Space Dodger' },
    tagline: { zh: '在星际间闪避、射击、生存', en: 'Dodge, Shoot, Survive Among the Stars' },
    playNow: { zh: '立即起航', en: 'Launch Now' },
    leaderboard: { zh: '排行榜', en: 'Leaderboard' },
    controls: { zh: 'WASD 移动 · 鼠标射击 · 空格闪避', en: 'WASD Move · Mouse Shoot · Space Dodge' },
    features: {
      roguelike: { zh: '肉鸽式关卡', en: 'Roguelike Levels' },
      roguelikeDesc: { zh: '每局随机路线，探索不同可能', en: 'Random routes each run' },
      combat: { zh: '爽快战斗', en: 'Fast Combat' },
      combatDesc: { zh: '闪避、连击、技能组合', en: 'Dodge, combo, ability combos' },
      loot: { zh: '道具收集', en: 'Loot System' },
      lootDesc: { zh: '12种道具，无限组合', en: '12 items, infinite combos' }
    }
  },

  // 加载界面
  loading: {
    assets: { zh: '加载素材', en: 'Loading Assets' },
    engine: { zh: '初始化引擎', en: 'Initializing Engine' },
    ready: { zh: '准备就绪', en: 'Ready' },
    starting: { zh: '正在启动...', en: 'Starting...' },
    tips: { zh: 'WASD 移动 · 鼠标射击 · 空格闪避', en: 'WASD Move · Mouse Shoot · Space Dodge' }
  },

  // 游戏内
  game: {
    score: { zh: '分数', en: 'Score' },
    level: { zh: '关卡', en: 'Level' },
    wave: { zh: '波次', en: 'Wave' },
    time: { zh: '时间', en: 'Time' },
    hp: { zh: '生命', en: 'HP' },
    shield: { zh: '护盾', en: 'Shield' },
    stamina: { zh: '体力', en: 'Stamina' },
    combo: { zh: '连击', en: 'Combo' },
    kills: { zh: '击杀', en: 'Kills' },
    boss: { zh: 'BOSS', en: 'BOSS' },
    bossPhase: { zh: '阶段', en: 'Phase' },
    paused: { zh: '游戏暂停', en: 'Game Paused' },
    pressEsc: { zh: '按 ESC 继续', en: 'Press ESC to Resume' }
  },

  // 游戏结束
  gameover: {
    title: { zh: '任务结束', en: 'Mission Over' },
    finalScore: { zh: '最终得分', en: 'Final Score' },
    highScore: { zh: '最高纪录', en: 'High Score' },
    newRecord: { zh: '新纪录！', en: 'New Record!' },
    stats: { zh: '战斗统计', en: 'Battle Stats' },
    totalKills: { zh: '总击杀', en: 'Total Kills' },
    levelReached: { zh: '到达关卡', en: 'Level Reached' },
    timeSurvived: { zh: '生存时间', en: 'Time Survived' },
    itemsCollected: { zh: '收集道具', en: 'Items Collected' },
    playAgain: { zh: '再来一局', en: 'Play Again' },
    mainMenu: { zh: '返回主页', en: 'Main Menu' },
    submitScore: { zh: '提交分数', en: 'Submit Score' },
    submitting: { zh: '提交中...', en: 'Submitting...' },
    submitted: { zh: '已提交', en: 'Submitted' }
  },

  // 路线选择
  route: {
    title: { zh: '选择路线', en: 'Choose Route' },
    subtitle: { zh: '不同的路线，不同的挑战', en: 'Different paths, different challenges' },
    difficulty: { zh: '难度', en: 'Difficulty' },
    reward: { zh: '奖励', en: 'Reward' },
    enemies: { zh: '敌人', en: 'Enemies' },
    boss: { zh: '包含BOSS', en: 'Contains Boss' },
    easy: { zh: '简单', en: 'Easy' },
    normal: { zh: '普通', en: 'Normal' },
    hard: { zh: '困难', en: 'Hard' },
    elite: { zh: '精英', en: 'Elite' }
  },

  // 排行榜
  leaderboard: {
    title: { zh: '排行榜', en: 'Leaderboard' },
    subtitle: { zh: '太空闪避者 · 全球榜单', en: 'Space Dodge · Global Rankings' },
    rank: { zh: '排名', en: 'Rank' },
    player: { zh: '玩家', en: 'Player' },
    score: { zh: '分数', en: 'Score' },
    level: { zh: '关卡', en: 'Level' },
    kills: { zh: '击杀', en: 'Kills' },
    time: { zh: '时间', en: 'Time' },
    date: { zh: '日期', en: 'Date' },
    empty: { zh: '暂无记录', en: 'No records yet' },
    yourBest: { zh: '你的最佳', en: 'Your Best' },
    top50: { zh: 'TOP 50', en: 'TOP 50' },
    refresh: { zh: '刷新', en: 'Refresh' },
    loading: { zh: '加载中...', en: 'Loading...' }
  },

  // 道具名称
  items: {
    I01: { zh: '星能电容', en: 'Star Capacitor' },
    I02: { zh: '裂隙推进器', en: 'Rift Thruster' },
    I03: { zh: '恒星陀螺', en: 'Star Gyro' },
    I04: { zh: '量子镜像', en: 'Quantum Mirror' },
    I05: { zh: '攻城尖刺', en: 'Siege Spike' },
    I06: { zh: '陨石护甲', en: 'Meteor Armor' },
    I07: { zh: '蔚蓝核心', en: 'Azure Core' },
    I08: { zh: '回声线圈', en: 'Echo Coil' },
    I09: { zh: '生命电路', en: 'Life Circuit' },
    I10: { zh: '抛光宝石', en: 'Polished Stone' },
    I11: { zh: '过载脉冲', en: 'Overload Pulse' },
    I12: { zh: '星辉枯萎', en: 'Star Blight' }
  },

  // 道具描述
  itemDesc: {
    I01: { zh: '提升暴击率 +8%', en: '+8% Crit Chance' },
    I02: { zh: '提升移动速度 +15%', en: '+15% Move Speed' },
    I03: { zh: '提升射速 +12%', en: '+12% Fire Rate' },
    I04: { zh: '子弹有 25% 概率复制', en: '25% bullet clone chance' },
    I05: { zh: '对精英/Boss 伤害 +20%', en: '+20% Elite/Boss damage' },
    I06: { zh: '移动时减伤 15%', en: '15% damage reduction while moving' },
    I07: { zh: '暴击伤害 +50%', en: '+50% Crit Damage' },
    I08: { zh: '击杀后延迟发射回声弹', en: 'Echo shot after kill' },
    I09: { zh: '击杀回复生命 2%', en: '2% lifesteal on kill' },
    I10: { zh: '提升命中率 +10%', en: '+10% Accuracy' },
    I11: { zh: '过热时伤害翻倍', en: 'Double damage when overheated' },
    I12: { zh: '攻击附加持续伤害', en: 'Attacks apply DoT' }
  },

  // 组合效果
  combos: {
    energyCrit: { zh: '能量暴击：暴击率额外 +5%', en: 'Energy Crit: +5% extra crit' },
    echoClone: { zh: '回声镜像：回声弹可复制 50%', en: 'Echo Clone: 50% echo clone' }
  },

  // Boss 名称
  bosses: {
    B01: { zh: '裂隙主宰', en: 'Rift Sovereign' }
  },

  // Boss 阶段
  bossPhases: {
    phase1: { zh: '护盾阶段', en: 'Shield Phase' },
    phase2: { zh: '狂暴阶段', en: 'Frenzy Phase' },
    phase3: { zh: '终结阶段', en: 'Final Phase' }
  }
} as const

/**
 * 获取本地化文本
 */
export function t(
  path: string,
  lang: Language = 'zh'
): string {
  const keys = path.split('.')
  let current: Record<string, unknown> = i18n
  
  for (const key of keys) {
    if (current[key] === undefined) {
      console.warn(`i18n key not found: ${path}`)
      return path
    }
    current = current[key] as Record<string, unknown>
  }

  if (typeof current === 'object' && current !== null && lang in current) {
    return (current as Record<Language, string>)[lang]
  }

  return path
}

/**
 * 创建带语言绑定的翻译函数
 */
export function createT(lang: Language) {
  return (path: string) => t(path, lang)
}
