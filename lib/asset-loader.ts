/**
 * Asset Loader - 预加载 SVG 素材并解析为 Path2D
 * 支持进度回调和缓存
 */

export type AssetCategory = 'player' | 'enemy' | 'bullet' | 'pickup' | 'boss'

export interface SVGAsset {
  id: string
  category: AssetCategory
  paths: Path2D[]
  colors: string[]
  viewBox: { width: number; height: number }
}

export interface LoadProgress {
  loaded: number
  total: number
  percent: number
  phase: 'loading' | 'parsing' | 'ready'
  currentAsset?: string
}

// 所有 SVG 素材路径
const ASSET_MANIFEST: Record<AssetCategory, string[]> = {
  player: ['player-01'],
  boss: ['rift-sovereign-01'],
  bullet: [
    'bomb-01', 'boss-01', 'charged-01', 'echo-01', 'enemy-01',
    'normal-01', 'orb-01', 'rapid-01', 'shrapnel-01', 'sniper-01', 'spray-01'
  ],
  enemy: [
    'blink-01', 'bomber-01', 'bruiser-01', 'buffer-01', 'charge-01',
    'dash-01', 'leap-01', 'orbit-01', 'shielded-01', 'shooter-01',
    'sniper-01', 'sprayer-01', 'summon-01', 'swarm-01'
  ],
  pickup: [
    'I01-star-capacitor', 'I02-rift-thruster', 'I03-star-gyro', 'I04-quantum-mirror',
    'I05-siege-spike', 'I06-meteor-armor', 'I07-azure-core', 'I08-echo-coil',
    'I09-life-circuit', 'I10-polished-stone', 'I11-overload-pulse', 'I12-star-blight'
  ]
}

// 全局素材缓存
const assetCache = new Map<string, SVGAsset>()
let isLoaded = false

/**
 * 解析 SVG 字符串为 Path2D 数组
 */
function parseSVGToPaths(svgText: string, id: string, category: AssetCategory): SVGAsset {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  const svg = doc.querySelector('svg')
  
  if (!svg) {
    console.warn(`Invalid SVG: ${id}`)
    return { id, category, paths: [], colors: [], viewBox: { width: 64, height: 64 } }
  }

  // 解析 viewBox
  const viewBoxAttr = svg.getAttribute('viewBox') || '0 0 64 64'
  const [, , vbWidth, vbHeight] = viewBoxAttr.split(' ').map(Number)
  const viewBox = { width: vbWidth || 64, height: vbHeight || 64 }

  const paths: Path2D[] = []
  const colors: string[] = []

  // 解析所有可绘制元素
  const elements = svg.querySelectorAll('polygon, rect, path, circle, ellipse, line')
  
  elements.forEach((el) => {
    const path = new Path2D()
    const tag = el.tagName.toLowerCase()

    try {
      if (tag === 'polygon') {
        const points = el.getAttribute('points') || ''
        const coords = points.trim().split(/\s+/).map((p) => {
          const [x, y] = p.split(',').map(Number)
          return { x: x || 0, y: y || 0 }
        })
        if (coords.length > 0) {
          path.moveTo(coords[0].x, coords[0].y)
          coords.slice(1).forEach((c) => path.lineTo(c.x, c.y))
          path.closePath()
        }
      } else if (tag === 'rect') {
        const x = parseFloat(el.getAttribute('x') || '0')
        const y = parseFloat(el.getAttribute('y') || '0')
        const w = parseFloat(el.getAttribute('width') || '0')
        const h = parseFloat(el.getAttribute('height') || '0')
        const rx = parseFloat(el.getAttribute('rx') || '0')
        if (rx > 0) {
          path.roundRect(x, y, w, h, rx)
        } else {
          path.rect(x, y, w, h)
        }
      } else if (tag === 'path') {
        const d = el.getAttribute('d') || ''
        if (d) {
          const subPath = new Path2D(d)
          path.addPath(subPath)
        }
      } else if (tag === 'circle') {
        const cx = parseFloat(el.getAttribute('cx') || '0')
        const cy = parseFloat(el.getAttribute('cy') || '0')
        const r = parseFloat(el.getAttribute('r') || '0')
        path.arc(cx, cy, r, 0, Math.PI * 2)
      } else if (tag === 'ellipse') {
        const cx = parseFloat(el.getAttribute('cx') || '0')
        const cy = parseFloat(el.getAttribute('cy') || '0')
        const rx = parseFloat(el.getAttribute('rx') || '0')
        const ry = parseFloat(el.getAttribute('ry') || '0')
        path.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      } else if (tag === 'line') {
        const x1 = parseFloat(el.getAttribute('x1') || '0')
        const y1 = parseFloat(el.getAttribute('y1') || '0')
        const x2 = parseFloat(el.getAttribute('x2') || '0')
        const y2 = parseFloat(el.getAttribute('y2') || '0')
        path.moveTo(x1, y1)
        path.lineTo(x2, y2)
      }

      paths.push(path)

      // 提取颜色（优先 fill，否则 stroke）
      let fill = el.getAttribute('fill') || ''
      const stroke = el.getAttribute('stroke') || ''
      
      // 解析 CSS 变量默认值
      const parseVarColor = (c: string): string => {
        const match = c.match(/var\([^,]+,\s*([^)]+)\)/)
        return match ? match[1].trim() : c
      }

      fill = parseVarColor(fill)
      const strokeColor = parseVarColor(stroke)

      if (fill && fill !== 'none') {
        colors.push(fill)
      } else if (strokeColor && strokeColor !== 'none') {
        colors.push(strokeColor)
      } else {
        colors.push('#5ef2ff') // 默认青色
      }
    } catch (e) {
      console.warn(`Failed to parse element in ${id}:`, e)
    }
  })

  return { id, category, paths, colors, viewBox }
}

/**
 * 加载单个 SVG 文件
 */
async function loadSVG(category: AssetCategory, name: string): Promise<SVGAsset> {
  const cacheKey = `${category}/${name}`
  
  if (assetCache.has(cacheKey)) {
    return assetCache.get(cacheKey)!
  }

  const url = `/assets/svg/${category}/${name}.svg`
  const response = await fetch(url)
  
  if (!response.ok) {
    console.warn(`Failed to load SVG: ${url}`)
    return { id: name, category, paths: [], colors: [], viewBox: { width: 64, height: 64 } }
  }

  const svgText = await response.text()
  const asset = parseSVGToPaths(svgText, name, category)
  assetCache.set(cacheKey, asset)
  
  return asset
}

/**
 * 预加载所有游戏素材
 */
export async function preloadAllAssets(
  onProgress?: (progress: LoadProgress) => void
): Promise<Map<string, SVGAsset>> {
  if (isLoaded) {
    onProgress?.({ loaded: 1, total: 1, percent: 100, phase: 'ready' })
    return assetCache
  }

  const allAssets: Array<{ category: AssetCategory; name: string }> = []
  
  for (const [category, names] of Object.entries(ASSET_MANIFEST)) {
    for (const name of names) {
      allAssets.push({ category: category as AssetCategory, name })
    }
  }

  const total = allAssets.length
  let loaded = 0

  onProgress?.({ loaded: 0, total, percent: 0, phase: 'loading' })

  // 批量加载，每批 5 个
  const batchSize = 5
  for (let i = 0; i < allAssets.length; i += batchSize) {
    const batch = allAssets.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(async ({ category, name }) => {
        await loadSVG(category, name)
        loaded++
        onProgress?.({
          loaded,
          total,
          percent: Math.round((loaded / total) * 100),
          phase: loaded === total ? 'parsing' : 'loading',
          currentAsset: `${category}/${name}`
        })
      })
    )
  }

  isLoaded = true
  onProgress?.({ loaded: total, total, percent: 100, phase: 'ready' })
  
  return assetCache
}

/**
 * 获取已加载的素材
 */
export function getAsset(category: AssetCategory, name: string): SVGAsset | undefined {
  return assetCache.get(`${category}/${name}`)
}

/**
 * 获取敌人素材（根据 behavior 映射）
 */
export function getEnemyAsset(behavior: string): SVGAsset | undefined {
  const behaviorMap: Record<string, string> = {
    'shooter': 'shooter-01',
    'sniper': 'sniper-01',
    'sprayer': 'sprayer-01',
    'dash': 'dash-01',
    'orbit': 'orbit-01',
    'swarm': 'swarm-01',
    'leap': 'leap-01',
    'charge': 'charge-01',
    'bomber': 'bomber-01',
    'buffer': 'buffer-01',
    'shielded': 'shielded-01',
    'summon': 'summon-01',
    'blink': 'blink-01',
    'bruiser': 'bruiser-01'
  }
  const assetName = behaviorMap[behavior] || 'shooter-01'
  return getAsset('enemy', assetName)
}

/**
 * 获取子弹素材（根据 kind 映射）
 */
export function getBulletAsset(kind: string): SVGAsset | undefined {
  const kindMap: Record<string, string> = {
    'normal': 'normal-01',
    'rapid': 'rapid-01',
    'charged': 'charged-01',
    'echo': 'echo-01',
    'enemy': 'enemy-01',
    'sniper': 'sniper-01',
    'spray': 'spray-01',
    'orb': 'orb-01',
    'shrapnel': 'shrapnel-01',
    'boss': 'boss-01',
    'bomb': 'bomb-01'
  }
  const assetName = kindMap[kind] || 'normal-01'
  return getAsset('bullet', assetName)
}

/**
 * 获取道具素材（根据 itemId 映射）
 */
export function getPickupAsset(itemId: string): SVGAsset | undefined {
  const itemMap: Record<string, string> = {
    'I01': 'I01-star-capacitor',
    'I02': 'I02-rift-thruster',
    'I03': 'I03-star-gyro',
    'I04': 'I04-quantum-mirror',
    'I05': 'I05-siege-spike',
    'I06': 'I06-meteor-armor',
    'I07': 'I07-azure-core',
    'I08': 'I08-echo-coil',
    'I09': 'I09-life-circuit',
    'I10': 'I10-polished-stone',
    'I11': 'I11-overload-pulse',
    'I12': 'I12-star-blight'
  }
  const assetName = itemMap[itemId]
  return assetName ? getAsset('pickup', assetName) : undefined
}

/**
 * 在 Canvas 上绘制 SVG 素材
 */
export function drawAsset(
  ctx: CanvasRenderingContext2D,
  asset: SVGAsset,
  x: number,
  y: number,
  size: number,
  options?: {
    rotation?: number
    alpha?: number
    tint?: string
    glow?: number
    strokeOnly?: boolean
  }
): void {
  if (!asset || asset.paths.length === 0) return

  const scale = size / Math.max(asset.viewBox.width, asset.viewBox.height)
  const { rotation = 0, alpha = 1, tint, glow = 0, strokeOnly = false } = options || {}

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.scale(scale, scale)
  ctx.translate(-asset.viewBox.width / 2, -asset.viewBox.height / 2)
  ctx.globalAlpha = alpha

  // 发光效果
  if (glow > 0) {
    ctx.shadowColor = tint || asset.colors[0] || '#5ef2ff'
    ctx.shadowBlur = glow
  }

  asset.paths.forEach((path, i) => {
    const color = tint || asset.colors[i] || '#5ef2ff'
    
    if (strokeOnly) {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke(path)
    } else {
      ctx.fillStyle = color
      ctx.fill(path)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.stroke(path)
    }
  })

  ctx.restore()
}

/**
 * 检查素材是否已加载
 */
export function isAssetsLoaded(): boolean {
  return isLoaded
}

/**
 * 获取加载进度（用于轮询）
 */
export function getLoadedCount(): number {
  return assetCache.size
}

/**
 * 获取总素材数量
 */
export function getTotalAssetCount(): number {
  return Object.values(ASSET_MANIFEST).reduce((sum, arr) => sum + arr.length, 0)
}
