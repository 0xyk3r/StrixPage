/**
 * DiceBear v10.x 工具函数
 *
 * 基于 @dicebear/core v10 + @dicebear/styles v10 构建
 * - Style 实例懒加载、复用
 * - idRandomization: true 解决多实例 SVG ID 冲突
 * - OptionsDescriptor 自动提取样式 Schema
 * - 局部预览：构造"合成 Style"将目标组件提到 canvas 顶层单独渲染
 *   （官方 docs 做法，绕开"耳环嵌套在 head 内部"导致概率隔离失效的问题）
 */

import { Avatar, OptionsDescriptor, Style, type StyleDefinition } from '@dicebear/core'
// ── 样式 JSON 静态导入 ──────────────────────────────────────────────────────
import adventurerDef from '@dicebear/styles/adventurer.json'
import adventurerNeutralDef from '@dicebear/styles/adventurer-neutral.json'
import avataaaarsDef from '@dicebear/styles/avataaars.json'
import avataaarsNeutralDef from '@dicebear/styles/avataaars-neutral.json'
import bigEarsDef from '@dicebear/styles/big-ears.json'
import bigEarsNeutralDef from '@dicebear/styles/big-ears-neutral.json'
import bigSmileDef from '@dicebear/styles/big-smile.json'
import botttsDef from '@dicebear/styles/bottts.json'
import botttsNeutralDef from '@dicebear/styles/bottts-neutral.json'
import croodlesDef from '@dicebear/styles/croodles.json'
import croodlesNeutralDef from '@dicebear/styles/croodles-neutral.json'
import discoDef from '@dicebear/styles/disco.json'
import dylanDef from '@dicebear/styles/dylan.json'
import funEmojiDef from '@dicebear/styles/fun-emoji.json'
import glassDef from '@dicebear/styles/glass.json'
import glyphsDef from '@dicebear/styles/glyphs.json'
import iconsDef from '@dicebear/styles/icons.json'
import identiconDef from '@dicebear/styles/identicon.json'
import initialFaceDef from '@dicebear/styles/initial-face.json'
import initialsDef from '@dicebear/styles/initials.json'
import loreleiDef from '@dicebear/styles/lorelei.json'
import loreleiNeutralDef from '@dicebear/styles/lorelei-neutral.json'
import micahDef from '@dicebear/styles/micah.json'
import miniavsDef from '@dicebear/styles/miniavs.json'
import notionistsDef from '@dicebear/styles/notionists.json'
import notionistsNeutralDef from '@dicebear/styles/notionists-neutral.json'
import openPeepsDef from '@dicebear/styles/open-peeps.json'
import personasDef from '@dicebear/styles/personas.json'
import pixelArtDef from '@dicebear/styles/pixel-art.json'
import pixelArtNeutralDef from '@dicebear/styles/pixel-art-neutral.json'
import ringsDef from '@dicebear/styles/rings.json'
import shapeGridDef from '@dicebear/styles/shape-grid.json'
import shapesDef from '@dicebear/styles/shapes.json'
import stripesDef from '@dicebear/styles/stripes.json'
import thumbsDef from '@dicebear/styles/thumbs.json'
import toonHeadDef from '@dicebear/styles/toon-head.json'
import trianglesDef from '@dicebear/styles/triangles.json'

/**
 * "无"哨兵值：作为 {component}Variant 的取值，表示用户主动选择"不显示该组件"。
 * 渲染时翻译为 {component}Probability=0，用于覆盖装饰组件（细节/耳环等）的内置随机概率。
 */
export const VARIANT_NONE = '__none__'

// ── 样式原始定义表 ────────────────────────────────────────────────────────────
const STYLE_DEFS: Record<string, unknown> = {
  adventurer: adventurerDef,
  'adventurer-neutral': adventurerNeutralDef,
  avataaars: avataaaarsDef,
  'avataaars-neutral': avataaarsNeutralDef,
  'big-ears': bigEarsDef,
  'big-ears-neutral': bigEarsNeutralDef,
  'big-smile': bigSmileDef,
  bottts: botttsDef,
  'bottts-neutral': botttsNeutralDef,
  croodles: croodlesDef,
  'croodles-neutral': croodlesNeutralDef,
  disco: discoDef,
  dylan: dylanDef,
  'fun-emoji': funEmojiDef,
  glass: glassDef,
  glyphs: glyphsDef,
  icons: iconsDef,
  identicon: identiconDef,
  'initial-face': initialFaceDef,
  initials: initialsDef,
  lorelei: loreleiDef,
  'lorelei-neutral': loreleiNeutralDef,
  micah: micahDef,
  miniavs: miniavsDef,
  notionists: notionistsDef,
  'notionists-neutral': notionistsNeutralDef,
  'open-peeps': openPeepsDef,
  personas: personasDef,
  'pixel-art': pixelArtDef,
  'pixel-art-neutral': pixelArtNeutralDef,
  rings: ringsDef,
  'shape-grid': shapeGridDef,
  shapes: shapesDef,
  stripes: stripesDef,
  thumbs: thumbsDef,
  'toon-head': toonHeadDef,
  triangles: trianglesDef
}

export type StyleName = keyof typeof STYLE_DEFS

// ── 样式元数据 ────────────────────────────────────────────────────────────────
export const STYLE_META: Record<StyleName, { label: string; category: string }> = {
  adventurer: { label: 'Adventurer', category: '插画风' },
  'adventurer-neutral': { label: 'Adventurer 中性', category: '插画风' },
  avataaars: { label: 'Avataaars', category: '卡通风' },
  'avataaars-neutral': { label: 'Avataaars 中性', category: '卡通风' },
  'big-ears': { label: 'Big Ears', category: '卡通风' },
  'big-ears-neutral': { label: 'Big Ears 中性', category: '卡通风' },
  'big-smile': { label: 'Big Smile', category: '卡通风' },
  bottts: { label: 'Bottts', category: '机器人' },
  'bottts-neutral': { label: 'Bottts 中性', category: '机器人' },
  croodles: { label: 'Croodles', category: '涂鸦风' },
  'croodles-neutral': { label: 'Croodles 中性', category: '涂鸦风' },
  disco: { label: 'Disco', category: '抽象风' },
  dylan: { label: 'Dylan', category: '插画风' },
  'fun-emoji': { label: 'Fun Emoji', category: '表情风' },
  glass: { label: 'Glass', category: '抽象风' },
  glyphs: { label: 'Glyphs', category: '图标风' },
  icons: { label: 'Icons', category: '图标风' },
  identicon: { label: 'Identicon', category: '几何风' },
  'initial-face': { label: 'Initial Face', category: '文字风' },
  initials: { label: 'Initials', category: '文字风' },
  lorelei: { label: 'Lorelei', category: '插画风' },
  'lorelei-neutral': { label: 'Lorelei 中性', category: '插画风' },
  micah: { label: 'Micah', category: '插画风' },
  miniavs: { label: 'Miniavs', category: '迷你风' },
  notionists: { label: 'Notionists', category: '插画风' },
  'notionists-neutral': { label: 'Notionists 中性', category: '插画风' },
  'open-peeps': { label: 'Open Peeps', category: '插画风' },
  personas: { label: 'Personas', category: '插画风' },
  'pixel-art': { label: 'Pixel Art', category: '像素风' },
  'pixel-art-neutral': { label: 'Pixel Art 中性', category: '像素风' },
  rings: { label: 'Rings', category: '抽象风' },
  'shape-grid': { label: 'Shape Grid', category: '抽象风' },
  shapes: { label: 'Shapes', category: '抽象风' },
  stripes: { label: 'Stripes', category: '抽象风' },
  thumbs: { label: 'Thumbs', category: '卡通风' },
  'toon-head': { label: 'Toon Head', category: '卡通风' },
  triangles: { label: 'Triangles', category: '抽象风' }
}

export const STYLE_NAMES = Object.keys(STYLE_META) as StyleName[]

// ── Style 实例缓存 ────────────────────────────────────────────────────────────
const styleInstanceCache = new Map<StyleName, Style>()

function getStyle(name: StyleName): Style {
  if (styleInstanceCache.has(name)) return styleInstanceCache.get(name)!
  const def = STYLE_DEFS[name]
  if (!def) throw new Error(`Unknown DiceBear style: ${name}`)
  const style = new Style(def)
  styleInstanceCache.set(name, style)
  return style
}

// ── DiceBear 头像配置 ─────────────────────────────────────────────────────────
export interface AvatarConfig {
  style: StyleName
  seed?: string
  options?: Record<string, unknown>
}

// ── 解析 / 序列化 ─────────────────────────────────────────────────────────────
export function parseAvatarConfig(config: string | AvatarConfig | null | undefined): AvatarConfig | null {
  if (!config) return null
  if (typeof config === 'string') {
    try {
      return JSON.parse(config) as AvatarConfig
    } catch {
      return null
    }
  }
  return config
}

export function serializeAvatarConfig(config: AvatarConfig): string {
  return JSON.stringify(config)
}

// ── "无"哨兵 ──────────────────────────────────────────────────────────────────
// ── SVG 响应式处理 ────────────────────────────────────────────────────────────
/** 将根 SVG 设为 100% 响应式（不依赖 idRandomization，因为 viewBox 变换后 ID 已唯一） */
function makeResponsive(svg: string): string {
  return svg.replace(/^<svg /, '<svg style="display:block;width:100%;height:100%;" width="100%" height="100%" ')
}

// ── Vue Proxy 剥离 ────────────────────────────────────────────────────────────
/**
 * 深度剥离 Vue 的响应式 Proxy，转成纯 JS 对象。
 *
 * DiceBear v10 的 Options 构造函数内部会对传入的 options 调用 structuredClone，
 * 而 Vue 的 reactive Proxy（含嵌套数组，如 eyesVariant: ['variant04']）无法被
 * structuredClone 克隆，会抛 DataCloneError。options 均为 JSON 安全的纯数据
 * （字符串/数字/数组），JSON round-trip 可彻底剥离 Proxy，并顺带丢弃 undefined 值。
 */
function toPlainOptions(options: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!options) return {}
  return JSON.parse(JSON.stringify(options)) as Record<string, unknown>
}

// ── 组件可见性 ────────────────────────────────────────────────────────────────
/**
 * 按用户选择处理组件可见性，并解析"无"哨兵。
 *
 * 对每个 {component}Variant 选项：
 * - 值为 [VARIANT_NONE]（用户选了"无"）→ 删除该 Variant，设 {component}Probability=0
 *   （覆盖装饰组件如 details/earrings 的内置随机概率，确保不显示）
 * - 值为真实变体 → 设 {component}Probability=100（覆盖内置低概率，确保选中即显示）
 * - 未设置 → 不干预，沿用样式内置概率（保证首次进入头像完整、装饰组件按设计随机）
 */
function withComponentVisibility(options: Record<string, unknown>): Record<string, unknown> {
  const result = { ...options }
  for (const key of Object.keys(options)) {
    if (!key.endsWith('Variant')) continue
    const componentName = key.slice(0, -'Variant'.length)
    const val = options[key]
    const picked = Array.isArray(val) ? val[0] : val
    if (picked === VARIANT_NONE) {
      delete result[key]
      result[`${componentName}Probability`] = 0
    } else if (picked !== undefined && picked !== null) {
      result[`${componentName}Probability`] = 100
    }
  }
  return result
}

// ── 生成头像 SVG ──────────────────────────────────────────────────────────────
export function generateAvatarSvg(managerId: string, config: AvatarConfig | null): string {
  const styleName = (config?.style ?? 'thumbs') as StyleName
  const style = getStyle(styleName)
  try {
    const svg = new Avatar(style, {
      seed: config?.seed ?? managerId,
      idRandomization: true,
      ...withComponentVisibility(toPlainOptions(config?.options))
    }).toString()
    return makeResponsive(svg)
  } catch (error) {
    // 选项格式不兼容时（如旧版 v9 格式配置）退回到默认种子生成
    console.error('生成头像失败', error)
    const svg = new Avatar(style, { seed: managerId, idRandomization: true }).toString()
    return makeResponsive(svg)
  }
}

/** 生成样式预览 SVG（固定 seed，懒加载缓存） */
const previewCache = new Map<string, string>()

export function generateStylePreview(styleName: StyleName, seed = 'preview-demo'): string {
  const cacheKey = `${styleName}:${seed}`
  if (previewCache.has(cacheKey)) return previewCache.get(cacheKey)!
  const style = getStyle(styleName)
  const svg = makeResponsive(new Avatar(style, { seed, idRandomization: true }).toString())
  previewCache.set(cacheKey, svg)
  return svg
}

/**
 * 合成 Style 缓存：按"样式:组件名"缓存只含目标组件的精简 Style。
 * 局部预览复用，避免重复构造与校验。
 */
const syntheticStyleCache = new Map<string, Style>()

/**
 * 构造"合成 Style"——只含目标组件，并将其提到 canvas 顶层单独渲染。
 *
 * 参照官方 docs（componentPreview.ts）实现：
 * - canvas 尺寸取组件自身 width/height，元素仅一个指向目标组件的引用
 * - 目标组件定义只保留 width/height/probability/variants，剥离 scale/translate/rotate
 *   （否则组件会按完整头像画布的布局偏移，无法在预览画布居中）
 * - 处理别名：用 sourceName 定位真实组件定义
 *
 * 这样能干净地单独渲染任意组件（含嵌套在 head 内的 earrings/glasses 等），
 * 不受"父容器被概率隐藏导致子组件一起消失"的影响。
 */
function getSyntheticStyle(styleName: StyleName, componentName: string): Style {
  const cacheKey = `${styleName}:${componentName}`
  const cached = syntheticStyleCache.get(cacheKey)
  if (cached) return cached

  const style = getStyle(styleName)
  const component = style.components().get(componentName)
  if (!component) throw new Error(`Unknown component "${componentName}" in style "${styleName}"`)

  const def = style.definition() as StyleDefinition & { components: Record<string, any> }
  const sourceName = component.extendsName() ?? componentName
  const target = def.components[sourceName]

  const syntheticDef = {
    attributes: def.attributes,
    canvas: {
      width: component.width(),
      height: component.height(),
      elements: [{ type: 'component' as const, name: componentName }]
    },
    components: {
      ...def.components,
      [sourceName]: {
        width: target.width,
        height: target.height,
        probability: target.probability,
        variants: target.variants
      }
    },
    colors: def.colors
  } as unknown as StyleDefinition

  const synthetic = new Style(syntheticDef)
  syntheticStyleCache.set(cacheKey, synthetic)
  return synthetic
}

/** 生成单个组件选项的预览 SVG
 *
 * @param baseOptions 当前已选的其它组件选项（用于"整体预览"叠加上下文）
 * @param seed        预览 seed（与主预览一致，保证视觉连贯）
 * @param partial     局部预览模式：只渲染目标组件本身
 *
 * - partial=false（整体预览）：在已选其它组件的基础上，叠加目标组件的候选变体，
 *   生成完整头像，让用户看到该变体放进当前头像后的真实效果。
 * - partial=true（局部预览）：用合成 Style 将目标组件单独提取渲染（官方做法）。
 */
export function generateOptionPreview(
  styleName: StyleName,
  propKey: string, // e.g., 'eyesVariant' (带 Variant 后缀)
  propValue: string,
  seed = 'option-preview',
  partial = false,
  baseOptions: Record<string, unknown> = {}
): string {
  // 目标组件名（去掉 'Variant' 后缀）
  const componentName = propKey.replace(/Variant$/, '')

  if (partial) {
    // 局部预览：合成 Style 单独渲染目标组件
    try {
      const synthetic = getSyntheticStyle(styleName, componentName)
      const svg = new Avatar(synthetic, {
        seed,
        idRandomization: true,
        backgroundColor: [],
        [`${componentName}Probability`]: 100,
        [propKey]: [propValue]
      }).toString()
      return makeResponsive(svg)
    } catch {
      // 合成失败时退回整体预览
    }
  }

  // 整体预览：叠加已选其它组件 + 目标变体，强制相关组件可见
  const style = getStyle(styleName)
  const options: Record<string, unknown> = {
    seed,
    idRandomization: true,
    ...withComponentVisibility(toPlainOptions(baseOptions)),
    [propKey]: [propValue],
    [`${componentName}Probability`]: 100
  }

  try {
    return makeResponsive(new Avatar(style, options).toString())
  } catch {
    return makeResponsive(new Avatar(style, { seed, idRandomization: true }).toString())
  }
}

// ── 样式属性定义 ──────────────────────────────────────────────────────────────
export interface StylePropertyDef {
  type: 'variantEnum' | 'number' | 'color' | 'boolean' | 'enumList'
  values?: string[]
  min?: number
  max?: number
  list?: boolean
  weighted?: boolean
  default?: unknown
}

/** 内置公共属性，不暴露给用户 */
const BUILTIN_OPTION_KEYS = new Set([
  'seed',
  'size',
  'idRandomization',
  'title',
  'flip',
  'fontFamily',
  'fontWeight',
  'scale',
  'borderRadius',
  'rotate',
  'translateX',
  'translateY'
])

const COLOR_FILL_SUFFIXES = ['ColorFill', 'ColorFillStops', 'ColorAngle']

/** 从 OptionsDescriptor 提取样式 Schema（过滤内置选项和渐变辅助属性） */
export function getStyleSchema(styleName: StyleName): Record<string, StylePropertyDef> {
  const style = getStyle(styleName)
  const descriptor = new OptionsDescriptor(style).toJSON() as Record<string, any>
  const result: Record<string, StylePropertyDef> = {}

  for (const [key, desc] of Object.entries(descriptor)) {
    if (BUILTIN_OPTION_KEYS.has(key)) continue
    // 过滤渐变辅助属性（ColorFill / ColorFillStops / ColorAngle）
    if (COLOR_FILL_SUFFIXES.some((suffix) => key.endsWith(suffix))) continue

    if (desc.type === 'enum' && desc.list && desc.weighted) {
      // 组件变体选择
      result[key] = { type: 'variantEnum', values: desc.values, list: true, weighted: true }
    } else if (desc.type === 'number') {
      result[key] = { type: 'number', min: desc.min ?? 0, max: desc.max ?? 100 }
    } else if (desc.type === 'color') {
      result[key] = { type: 'color', list: true }
    } else if (desc.type === 'boolean') {
      result[key] = { type: 'boolean' }
    } else if (desc.type === 'enum' && desc.list) {
      result[key] = { type: 'enumList', values: desc.values }
    }
  }

  return result
}

/** 属性 key 是否为概率控制字段 */
export function isProbabilityField(key: string): boolean {
  return key.toLowerCase().endsWith('probability')
}

/** 属性 key 是否为组件变体字段 */
export function isVariantField(key: string): boolean {
  return key.endsWith('Variant')
}

/** 属性 key 是否为颜色字段 */
export function isColorField(key: string): boolean {
  return key.endsWith('Color')
}

/** 获取组件变体字段对应的组件名（去掉 Variant 后缀） */
export function getComponentName(variantKey: string): string {
  return variantKey.replace(/Variant$/, '')
}

/**
 * 判定某变体组件是否为"装饰组件"（可隐藏）。
 *
 * DiceBear 样式定义中，必需组件（eyes/mouth/face 等）内置 probability=100（总是显示），
 * 装饰组件（details/earrings/glasses/freckles 等）内置 probability<100（按概率随机出现）。
 * 据此判定：内置概率 < 100 的组件即装饰组件，向用户提供"隐藏"开关。
 */
export function isOptionalComponent(styleName: StyleName, variantKey: string): boolean {
  const componentName = getComponentName(variantKey)
  const component = getStyle(styleName).components().get(componentName)
  if (!component) return false
  return component.probability() < 100
}
