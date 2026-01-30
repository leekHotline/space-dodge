/**
 * Audio Manager - Web Audio API 音效管理器 (M3)
 * 使用合成音调，无需外部音频文件
 */

type SoundType = 
  | 'shoot'
  | 'shootCharged'
  | 'hit'
  | 'hitCrit'
  | 'kill'
  | 'killCombo'
  | 'pickup'
  | 'levelUp'
  | 'dodge'
  | 'damage'
  | 'shieldBreak'
  | 'bossSpawn'
  | 'bossPhase'
  | 'bossDeath'
  | 'gameOver'
  | 'ui'

interface AudioConfig {
  enabled: boolean
  volume: number
  musicVolume: number
  sfxVolume: number
}

class AudioManager {
  private ctx: AudioContext | null = null
  private config: AudioConfig = {
    enabled: true,
    volume: 0.5,
    musicVolume: 0.3,
    sfxVolume: 0.6
  }
  private lastPlayTime: Map<SoundType, number> = new Map()
  private minInterval = 50 // 最小播放间隔 ms

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  private canPlay(type: SoundType): boolean {
    const now = Date.now()
    const last = this.lastPlayTime.get(type) || 0
    if (now - last < this.minInterval) return false
    this.lastPlayTime.set(type, now)
    return this.config.enabled
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    options?: {
      attack?: number
      decay?: number
      volume?: number
      detune?: number
      filterFreq?: number
      filterType?: BiquadFilterType
    }
  ): void {
    const ctx = this.getContext()
    const {
      attack = 0.01,
      decay = 0.1,
      volume = 0.3,
      detune = 0,
      filterFreq,
      filterType = 'lowpass'
    } = options || {}

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = type
    osc.frequency.value = frequency
    osc.detune.value = detune

    const finalVolume = volume * this.config.sfxVolume * this.config.volume

    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(finalVolume, ctx.currentTime + attack)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    if (filterFreq) {
      const filter = ctx.createBiquadFilter()
      filter.type = filterType
      filter.frequency.value = filterFreq
      osc.connect(filter)
      filter.connect(gain)
    } else {
      osc.connect(gain)
    }

    gain.connect(ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration + decay)
  }

  private playNoise(
    duration: number,
    options?: {
      volume?: number
      filterFreq?: number
      filterType?: BiquadFilterType
    }
  ): void {
    const ctx = this.getContext()
    const { volume = 0.1, filterFreq = 2000, filterType = 'lowpass' } = options || {}

    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = filterType
    filter.frequency.value = filterFreq

    const gain = ctx.createGain()
    const finalVolume = volume * this.config.sfxVolume * this.config.volume
    gain.gain.setValueAtTime(finalVolume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    source.start()
    source.stop(ctx.currentTime + duration)
  }

  play(type: SoundType): void {
    if (!this.canPlay(type)) return

    switch (type) {
      case 'shoot':
        // 短促的激光音效
        this.playTone(880, 0.08, 'sawtooth', { volume: 0.15, filterFreq: 3000 })
        this.playTone(440, 0.05, 'square', { volume: 0.1, detune: 10 })
        break

      case 'shootCharged':
        // 蓄力发射
        this.playTone(220, 0.15, 'sawtooth', { volume: 0.25, filterFreq: 4000 })
        this.playTone(440, 0.2, 'sine', { volume: 0.2, attack: 0.05 })
        this.playTone(880, 0.1, 'square', { volume: 0.15, detune: -20 })
        break

      case 'hit':
        // 命中音效
        this.playTone(300, 0.05, 'square', { volume: 0.12, filterFreq: 2000 })
        break

      case 'hitCrit':
        // 暴击音效
        this.playTone(600, 0.08, 'sawtooth', { volume: 0.2, filterFreq: 4000 })
        this.playTone(900, 0.06, 'square', { volume: 0.15 })
        break

      case 'kill':
        // 击杀音效
        this.playTone(400, 0.1, 'sawtooth', { volume: 0.2 })
        this.playNoise(0.08, { volume: 0.15, filterFreq: 3000 })
        break

      case 'killCombo':
        // 连击击杀
        this.playTone(600, 0.08, 'sawtooth', { volume: 0.25 })
        this.playTone(800, 0.1, 'sine', { volume: 0.2, attack: 0.02 })
        this.playNoise(0.1, { volume: 0.12, filterFreq: 4000 })
        break

      case 'pickup':
        // 拾取道具
        this.playTone(523, 0.08, 'sine', { volume: 0.2 }) // C5
        this.playTone(659, 0.08, 'sine', { volume: 0.2, attack: 0.05 }) // E5
        this.playTone(784, 0.12, 'sine', { volume: 0.18, attack: 0.08 }) // G5
        break

      case 'levelUp':
        // 升级音效
        this.playTone(523, 0.1, 'sine', { volume: 0.25 })
        setTimeout(() => this.playTone(659, 0.1, 'sine', { volume: 0.25 }), 80)
        setTimeout(() => this.playTone(784, 0.1, 'sine', { volume: 0.25 }), 160)
        setTimeout(() => this.playTone(1047, 0.2, 'sine', { volume: 0.3 }), 240)
        break

      case 'dodge':
        // 闪避音效
        this.playTone(200, 0.15, 'sine', { volume: 0.15 })
        this.playNoise(0.1, { volume: 0.08, filterFreq: 1500 })
        break

      case 'damage':
        // 受伤音效
        this.playTone(150, 0.15, 'sawtooth', { volume: 0.25, filterFreq: 1000 })
        this.playNoise(0.1, { volume: 0.2, filterFreq: 800 })
        break

      case 'shieldBreak':
        // 护盾破碎
        this.playNoise(0.2, { volume: 0.3, filterFreq: 2000 })
        this.playTone(200, 0.2, 'sawtooth', { volume: 0.2 })
        break

      case 'bossSpawn':
        // Boss 出现
        this.playTone(100, 0.5, 'sawtooth', { volume: 0.3, attack: 0.1 })
        this.playTone(80, 0.6, 'sine', { volume: 0.25, attack: 0.15 })
        break

      case 'bossPhase':
        // Boss 阶段转换
        this.playTone(150, 0.3, 'sawtooth', { volume: 0.25 })
        this.playTone(200, 0.25, 'square', { volume: 0.2, attack: 0.1 })
        break

      case 'bossDeath':
        // Boss 死亡
        this.playNoise(0.5, { volume: 0.4, filterFreq: 3000 })
        this.playTone(300, 0.3, 'sawtooth', { volume: 0.3 })
        setTimeout(() => {
          this.playTone(400, 0.2, 'sine', { volume: 0.25 })
          this.playTone(500, 0.2, 'sine', { volume: 0.25 })
        }, 200)
        break

      case 'gameOver':
        // 游戏结束
        this.playTone(400, 0.2, 'sine', { volume: 0.25 })
        setTimeout(() => this.playTone(300, 0.2, 'sine', { volume: 0.25 }), 150)
        setTimeout(() => this.playTone(200, 0.3, 'sine', { volume: 0.3 }), 300)
        break

      case 'ui':
        // UI 点击
        this.playTone(800, 0.05, 'sine', { volume: 0.1 })
        break
    }
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }

  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume))
  }

  setSfxVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume))
  }

  getConfig(): AudioConfig {
    return { ...this.config }
  }

  // 初始化（需要用户交互后调用）
  init(): void {
    this.getContext()
  }
}

// 单例导出
export const audioManager = new AudioManager()

// 便捷方法
export const playSound = (type: SoundType) => audioManager.play(type)
