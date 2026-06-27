<template>
  <n-modal
    v-model:show="visible"
    :mask-closable="false"
    preset="card"
    :bordered="false"
    class="avatar-forge-modal"
    @after-leave="handleClose"
  >
    <template #header>
      <div class="avatar-forge__head">
        <span class="avatar-forge__head-icon"><WandSparklesIcon :size="16" /></span>
        <div class="avatar-forge__head-text">
          <span class="avatar-forge__head-title">头像工坊</span>
          <span class="avatar-forge__head-sub">挑选风格 · 微调部件 · 实时预览</span>
        </div>
      </div>
    </template>

    <div class="avatar-forge">
      <!-- 一区：风格库 -->
      <aside class="avatar-forge__library">
        <div class="avatar-forge__library-search">
          <n-input v-model:value="styleSearch" placeholder="搜索风格" size="small" clearable>
            <template #prefix>
              <n-icon :size="15">
                <SearchIcon />
              </n-icon>
            </template>
          </n-input>
        </div>
        <!-- 原生滚动 + 上下边缘 mask 渐隐：尚有内容时该侧淡出，滚动到边即恢复实心 -->
        <div
          :ref="libraryFade.setEl"
          :class="[
            'avatar-forge__library-scroll',
            'avatar-forge__scroll-y',
            { 'fade-top': !libraryFade.atStart.value, 'fade-bottom': !libraryFade.atEnd.value }
          ]"
        >
          <div v-for="(styles, category) in filteredStylesByCategory" :key="category" class="avatar-forge__group">
            <div class="avatar-forge__group-label">
              <span>{{ category }}</span>
              <span class="avatar-forge__group-count">{{ styles.length }}</span>
            </div>
            <div class="avatar-forge__style-grid">
              <button
                v-for="styleName in styles"
                :key="styleName"
                type="button"
                :class="['avatar-forge__style', { 'is-active': draftConfig.style === styleName }]"
                @click="selectStyle(styleName)"
              >
                <span class="avatar-forge__style-thumb" v-html="getStylePreview(styleName)" />
                <span class="avatar-forge__style-name">{{ STYLE_META[styleName]?.label ?? styleName }}</span>
              </button>
            </div>
          </div>
          <div v-if="!Object.keys(filteredStylesByCategory).length" class="avatar-forge__library-empty">无匹配风格</div>
        </div>
      </aside>

      <!-- 二区：展示舞台 -->
      <section class="avatar-forge__stage">
        <div class="avatar-forge__stage-display">
          <div class="avatar-forge__halo" aria-hidden="true" />
          <div class="avatar-forge__avatar" v-html="currentPreviewSvg" />
        </div>

        <div class="avatar-forge__stage-meta">
          <span class="avatar-forge__stage-style">{{ STYLE_META[draftConfig.style]?.label ?? draftConfig.style }}</span>
          <span class="avatar-forge__stage-category">{{ STYLE_META[draftConfig.style]?.category ?? '自定义' }}</span>
        </div>

        <div class="avatar-forge__stage-actions">
          <n-button size="small" secondary @click="randomizeSeed">
            <template #icon>
              <n-icon>
                <DicesIcon />
              </n-icon>
            </template>
            换个随机
          </n-button>
          <n-button size="small" quaternary @click="resetToDefault">
            <template #icon>
              <n-icon>
                <RotateCcwIcon />
              </n-icon>
            </template>
            重置
          </n-button>
        </div>

        <div class="avatar-forge__seed">
          <label class="avatar-forge__seed-label">身份种子</label>
          <n-input
            v-model:value="draftSeed"
            size="small"
            class="avatar-forge__seed-input"
            placeholder="留空则使用账户 ID"
            @update:value="updatePreview"
          />
          <p class="avatar-forge__seed-hint">相同种子始终生成相同形象</p>
        </div>
      </section>

      <!-- 三区：部件编辑器 -->
      <section class="avatar-forge__editor">
        <div v-if="!hasAnyOption" class="avatar-forge__empty">
          <span class="avatar-forge__empty-icon"><SparklesIcon :size="26" /></span>
          <p class="avatar-forge__empty-text">该风格无可调整的部件</p>
          <p class="avatar-forge__empty-sub">换个随机种子也能得到不同形象</p>
        </div>

        <template v-else>
          <!-- 自定义药丸导航（横向滚动 + 左右边缘 mask 渐隐） -->
          <div class="avatar-forge__nav">
            <div
              :ref="navFade.setEl"
              :class="[
                'avatar-forge__nav-track',
                'avatar-forge__scroll-x',
                { 'fade-left': !navFade.atStart.value, 'fade-right': !navFade.atEnd.value }
              ]"
            >
              <button
                v-for="t in partTabs"
                :key="t.name"
                type="button"
                :class="['avatar-forge__nav-pill', { 'is-active': activeTab === t.name }]"
                @click="activeTab = t.name"
              >
                <span class="avatar-forge__nav-text">{{ formatPropLabel(t.variantKey) }}</span>
                <span
                  v-if="getSelectedVariant(t.variantKey)"
                  :class="['avatar-forge__nav-dot', isHidden(t.variantKey) ? 'is-hidden' : 'is-set']"
                />
              </button>
              <button
                v-if="extraColorProps.length > 0"
                type="button"
                :class="['avatar-forge__nav-pill', { 'is-active': isColorTab }]"
                @click="activeTab = '__color__'"
              >
                配色
              </button>
            </div>
          </div>

          <!-- 内容区（原生滚动 + 上下边缘 mask 渐隐） -->
          <div class="avatar-forge__pane-wrap">
            <div
              :ref="paneFade.setEl"
              :class="[
                'avatar-forge__pane',
                'avatar-forge__scroll-y',
                { 'fade-top': !paneFade.atStart.value, 'fade-bottom': !paneFade.atEnd.value }
              ]"
            >
              <!-- 部位面板 -->
              <template v-if="activePartTab">
                <div class="avatar-forge__toolbar">
                  <!-- 自定义分段控件：预览范围 -->
                  <div class="avatar-forge__segmented" role="tablist">
                    <button
                      type="button"
                      :class="['avatar-forge__seg', { 'is-on': previewMode === 'full' }]"
                      @click="previewMode = 'full'"
                    >
                      整体
                    </button>
                    <button
                      type="button"
                      :class="['avatar-forge__seg', { 'is-on': previewMode === 'partial' }]"
                      @click="previewMode = 'partial'"
                    >
                      局部
                    </button>
                  </div>
                  <div class="avatar-forge__toolbar-actions">
                    <!-- 隐藏开关：仅装饰组件可隐藏（内置概率 <100），激活态持久化于 VARIANT_NONE -->
                    <button
                      v-if="isOptionalComponent(draftConfig.style, activePartTab.variantKey)"
                      type="button"
                      :class="['avatar-forge__act', { 'is-warning': isHidden(activePartTab.variantKey) }]"
                      @click="toggleHidden(activePartTab.variantKey)"
                    >
                      <EyeOffIcon :size="13" />
                      {{ isHidden(activePartTab.variantKey) ? '已隐藏' : '隐藏' }}
                    </button>
                    <button
                      v-if="getSelectedVariant(activePartTab.variantKey) && !isHidden(activePartTab.variantKey)"
                      type="button"
                      class="avatar-forge__act avatar-forge__act--ghost"
                      @click="updateOption(activePartTab.variantKey, undefined)"
                    >
                      <DicesIcon :size="13" />
                      恢复随机
                    </button>
                  </div>
                </div>

                <div
                  v-if="isHidden(activePartTab.variantKey)"
                  class="avatar-forge__callout avatar-forge__callout--warning"
                >
                  <EyeOffIcon :size="14" />
                  <span>该部位已隐藏，点选任意样式即可恢复显示</span>
                </div>

                <div class="avatar-forge__variant-grid">
                  <button
                    v-for="val in currentSchema[activePartTab.variantKey]?.values ?? []"
                    :key="val"
                    type="button"
                    :class="[
                      'avatar-forge__variant',
                      { 'is-selected': isVariantSelected(activePartTab.variantKey, val) }
                    ]"
                    @click="selectVariant(activePartTab.variantKey, val)"
                  >
                    <span
                      :class="['avatar-forge__variant-thumb', { 'is-partial': previewMode === 'partial' }]"
                      v-html="getOptionPreview(activePartTab.variantKey, val)"
                    />
                    <span class="avatar-forge__variant-label">{{ formatVariantLabel(val) }}</span>
                    <span v-if="isVariantSelected(activePartTab.variantKey, val)" class="avatar-forge__variant-check">
                      <CheckIcon :size="11" />
                    </span>
                  </button>
                </div>

                <!-- 同部位颜色 -->
                <template v-if="activePartTab.colorKey">
                  <div class="avatar-forge__sub-label">
                    <PaletteIcon :size="13" />
                    <span>{{ formatPropLabel(activePartTab.colorKey) }}</span>
                  </div>
                  <div class="avatar-forge__color">
                    <div v-if="getFreeColors(activePartTab.colorKey).length" class="avatar-forge__color-list">
                      <div
                        v-for="(clr, idx) in getFreeColors(activePartTab.colorKey)"
                        :key="idx"
                        class="avatar-forge__chip"
                      >
                        <span class="avatar-forge__chip-dot" :style="{ background: `#${clr}` }" />
                        <span class="avatar-forge__chip-hex">#{{ clr }}</span>
                        <button
                          type="button"
                          class="avatar-forge__chip-x"
                          @click="removeFreeColor(activePartTab!.colorKey!, idx)"
                        >
                          <XIcon :size="12" />
                        </button>
                      </div>
                    </div>
                    <div class="avatar-forge__color-add">
                      <div class="avatar-forge__picker">
                        <n-color-picker
                          :show-alpha="false"
                          :modes="['hex']"
                          :value="colorPickerTemp[activePartTab.colorKey] ?? '#b6e3f4'"
                          size="small"
                          @update:value="(v: string) => (colorPickerTemp[activePartTab!.colorKey!] = v)"
                        />
                      </div>
                      <button type="button" class="avatar-forge__act" @click="addFreeColor(activePartTab.colorKey)">
                        <PlusIcon :size="13" />
                        添加
                      </button>
                      <button
                        v-if="getFreeColors(activePartTab.colorKey).length"
                        type="button"
                        class="avatar-forge__act avatar-forge__act--ghost"
                        @click="updateOption(activePartTab.colorKey, undefined)"
                      >
                        清除
                      </button>
                    </div>
                    <p v-if="getFreeColors(activePartTab.colorKey).length === 0" class="avatar-forge__color-hint">
                      未设置时将从风格默认色板中随机选取
                    </p>
                  </div>
                </template>
              </template>

              <!-- 配色面板 -->
              <template v-else-if="isColorTab">
                <template v-for="(key, ki) in extraColorProps" :key="key">
                  <div :class="['avatar-forge__sub-label', { 'avatar-forge__sub-label--first': ki === 0 }]">
                    <PaletteIcon :size="13" />
                    <span>{{ formatPropLabel(key) }}</span>
                  </div>
                  <div class="avatar-forge__color">
                    <div v-if="getFreeColors(key).length" class="avatar-forge__color-list">
                      <div v-for="(clr, idx) in getFreeColors(key)" :key="idx" class="avatar-forge__chip">
                        <span class="avatar-forge__chip-dot" :style="{ background: `#${clr}` }" />
                        <span class="avatar-forge__chip-hex">#{{ clr }}</span>
                        <button type="button" class="avatar-forge__chip-x" @click="removeFreeColor(key, idx)">
                          <XIcon :size="12" />
                        </button>
                      </div>
                    </div>
                    <div class="avatar-forge__color-add">
                      <div class="avatar-forge__picker">
                        <n-color-picker
                          :show-alpha="false"
                          :modes="['hex']"
                          :value="colorPickerTemp[key] ?? '#b6e3f4'"
                          size="small"
                          @update:value="(v: string) => (colorPickerTemp[key] = v)"
                        />
                      </div>
                      <button type="button" class="avatar-forge__act" @click="addFreeColor(key)">
                        <PlusIcon :size="13" />
                        添加
                      </button>
                      <button
                        v-if="getFreeColors(key).length"
                        type="button"
                        class="avatar-forge__act avatar-forge__act--ghost"
                        @click="updateOption(key, undefined)"
                      >
                        清除
                      </button>
                    </div>
                    <p v-if="getFreeColors(key).length === 0" class="avatar-forge__color-hint">
                      未设置时将从风格默认色板中随机选取
                    </p>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </template>
      </section>
    </div>

    <template #footer>
      <div class="avatar-forge__footer">
        <span class="avatar-forge__footer-tip">配置将保存至你的个人形象</span>
        <n-flex :size="10">
          <n-button @click="visible = false">取消</n-button>
          <n-button type="primary" @click="handleConfirm">
            <template #icon>
              <n-icon>
                <CheckIcon />
              </n-icon>
            </template>
            保存头像
          </n-button>
        </n-flex>
      </div>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import {
  type AvatarConfig,
  generateAvatarSvg,
  generateOptionPreview,
  generateStylePreview,
  getStyleSchema,
  isColorField,
  isOptionalComponent,
  isVariantField,
  parseAvatarConfig,
  serializeAvatarConfig,
  STYLE_META,
  STYLE_NAMES,
  type StyleName,
  VARIANT_NONE
} from '@/utils/dicebear-util'
import {
  Check as CheckIcon,
  Dices as DicesIcon,
  EyeOff as EyeOffIcon,
  Palette as PaletteIcon,
  Plus as PlusIcon,
  RotateCcw as RotateCcwIcon,
  Search as SearchIcon,
  Sparkles as SparklesIcon,
  WandSparkles as WandSparklesIcon,
  X as XIcon
} from '@lucide/vue'

interface Props {
  show: boolean
  managerId: string
  currentConfig?: string | null
}

const props = withDefaults(defineProps<Props>(), { currentConfig: null })

const emit = defineEmits<{
  'update:show': [value: boolean]
  confirm: [configJson: string]
}>()

const visible = computed({
  get: () => props.show,
  set: (v) => emit('update:show', v)
})

// --- 草稿状态 ---
const draftConfig = ref<AvatarConfig>({ style: 'thumbs', options: {} })
const draftSeed = ref('')
const draftOptions = ref<Record<string, unknown>>({})

watch(
  () => props.show,
  (show) => {
    if (!show) return
    const parsed = parseAvatarConfig(props.currentConfig)
    draftConfig.value = parsed ?? { style: 'thumbs', options: {} }
    draftSeed.value = parsed?.seed ?? ''
    draftOptions.value = { ...parsed?.options }
  },
  { immediate: true }
)

// --- 样式搜索与分类 ---
const styleSearch = ref('')

const filteredStylesByCategory = computed(() => {
  const search = styleSearch.value.toLowerCase()
  const filtered = STYLE_NAMES.filter(
    (name) =>
      !search ||
      name.toLowerCase().includes(search) ||
      (STYLE_META[name]?.label ?? '').toLowerCase().includes(search) ||
      (STYLE_META[name]?.category ?? '').toLowerCase().includes(search)
  )
  const map: Record<string, StyleName[]> = {}
  for (const name of filtered) {
    const cat = STYLE_META[name]?.category ?? 'Other'
    if (!map[cat]) map[cat] = []
    map[cat].push(name)
  }
  return map
})

function selectStyle(styleName: StyleName) {
  draftConfig.value = { style: styleName, options: {} }
  draftOptions.value = {}
  optionPreviewCache.clear()
  updatePreview()
  activeTab.value = partTabs.value[0]?.name ?? (extraColorProps.value.length ? '__color__' : '')
}

// --- Schema & Tabs ---
const currentSchema = computed(() => getStyleSchema(draftConfig.value.style))

const featureProps = computed(() => Object.keys(currentSchema.value).filter((k) => isVariantField(k)))
const colorProps = computed(() => Object.keys(currentSchema.value).filter((k) => isColorField(k)))

/** 提取属性 key 的部位前缀（去掉 Variant/Color/Probability 后缀） */
function getPartName(key: string): string {
  return key.replace(/(Variant|Color|Probability)$/, '')
}

/**
 * 部位 Tab：以"含变体的部位"为主轴，把同前缀的颜色归并进同一 tab。
 * 例如 eyesVariant + eyesColor → 一个"眼睛"tab。
 *
 * 不暴露概率控制：本组件用于用户设置头像，渲染时所有组件强制 100% 显示，
 * 由用户直接选择组件即可（详见 dicebear-util 的 withAllComponentsVisible）。
 */
interface PartTab {
  name: string // tab name = 变体 key（如 eyesVariant）
  part: string // 部位前缀（如 eyes）
  variantKey: string
  colorKey?: string
}

const partTabs = computed<PartTab[]>(() =>
  featureProps.value.map((variantKey) => {
    const part = getPartName(variantKey)
    return {
      name: variantKey,
      part,
      variantKey,
      colorKey: colorProps.value.find((k) => getPartName(k) === part)
    }
  })
)

/** 已被部位 tab 归并的 key 集合 */
const groupedKeys = computed(() => {
  const set = new Set<string>()
  for (const t of partTabs.value) {
    set.add(t.variantKey)
    if (t.colorKey) set.add(t.colorKey)
  }
  return set
})

/** 未归入任何部位 tab 的孤立颜色（如背景色、形状色） */
const extraColorProps = computed(() => colorProps.value.filter((k) => !groupedKeys.value.has(k)))

const hasAnyOption = computed(() => partTabs.value.length > 0 || extraColorProps.value.length > 0)

const activeTab = ref('')
watch(
  [partTabs, extraColorProps],
  () => {
    const valid =
      partTabs.value.some((t) => t.name === activeTab.value) ||
      (activeTab.value === '__color__' && extraColorProps.value.length > 0)
    if (!valid) {
      activeTab.value = partTabs.value[0]?.name ?? (extraColorProps.value.length ? '__color__' : '')
    }
  },
  { immediate: true }
)

/** 当前激活的部位 tab（非配色 tab 时返回对应项，否则 null） */
const activePartTab = computed(() => partTabs.value.find((t) => t.name === activeTab.value) ?? null)
const isColorTab = computed(() => activeTab.value === '__color__')

// --- 滚动边缘渐隐 ---
// 原生滚动容器 + CSS mask 实现边缘渐隐：尚有未显示内容时该侧渐隐，
// 滚动到边即消失。axis='y' 控制上下，'x' 控制左右（导航条）。
function useEdgeFade(axis: 'x' | 'y' = 'y') {
  const el = ref<HTMLElement | null>(null)
  const atStart = ref(true)
  const atEnd = ref(true)

  function setEl(e: Element | ComponentPublicInstance | null) {
    el.value = e instanceof HTMLElement ? e : null
  }

  function update() {
    const n = el.value
    if (!n) return
    const pos = axis === 'y' ? n.scrollTop : n.scrollLeft
    const view = axis === 'y' ? n.clientHeight : n.clientWidth
    const total = axis === 'y' ? n.scrollHeight : n.scrollWidth
    const max = total - view
    atStart.value = pos <= 1
    atEnd.value = max <= 1 || pos >= max - 1
  }

  watch(el, (node, _prev, onCleanup) => {
    if (!node) return
    update()
    node.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(node)
    const mo = new MutationObserver(update)
    mo.observe(node, { childList: true, subtree: true })
    onCleanup(() => {
      node.removeEventListener('scroll', update)
      ro.disconnect()
      mo.disconnect()
    })
  })

  return { setEl, atStart, atEnd, update, el }
}

const libraryFade = useEdgeFade('y')
const paneFade = useEdgeFade('y')
const navFade = useEdgeFade('x')

// 切换 tab 时回到顶部并刷新渐隐状态
watch(activeTab, () => {
  nextTick(() => {
    if (paneFade.el.value) paneFade.el.value.scrollTop = 0
    paneFade.update()
  })
})

// --- 预览模式 ---
const previewMode = ref<'full' | 'partial'>('full')

// --- 预览 SVG ---
const currentPreviewSvg = ref('')

function updatePreview() {
  currentPreviewSvg.value = generateAvatarSvg(props.managerId, {
    style: draftConfig.value.style,
    seed: draftSeed.value || undefined,
    options: { ...draftOptions.value }
  })
}

watch([draftConfig, draftSeed, draftOptions], updatePreview, { deep: true, immediate: true })

// 样式缩略图
const stylePreviewCache = new Map<StyleName, string>()

function getStylePreview(styleName: StyleName): string {
  if (!stylePreviewCache.has(styleName)) {
    stylePreviewCache.set(styleName, generateStylePreview(styleName, props.managerId))
  }
  return stylePreviewCache.get(styleName)!
}

// 选项预览（按模式）
const optionPreviewCache = new Map<string, string>()

function getOptionPreview(propKey: string, propValue: string): string {
  const partial = previewMode.value === 'partial'
  const seed = draftSeed.value || props.managerId
  // 整体预览需叠加当前已选其它组件，故缓存键纳入 seed 与已选项快照；
  // 局部预览只与目标变体有关，缓存键无需 baseOptions。
  const baseKey = partial ? '' : JSON.stringify(draftOptions.value)
  const cacheKey = `${draftConfig.value.style}:${propKey}:${propValue}:${partial}:${seed}:${baseKey}`
  if (!optionPreviewCache.has(cacheKey)) {
    optionPreviewCache.set(
      cacheKey,
      generateOptionPreview(
        draftConfig.value.style,
        propKey,
        propValue,
        seed,
        partial,
        partial ? {} : draftOptions.value
      )
    )
  }
  return optionPreviewCache.get(cacheKey)!
}

// --- 变体选项操作 ---
function updateOption(key: string, value: unknown) {
  if (value === undefined || value === null) {
    const opts = { ...draftOptions.value }
    delete opts[key]
    draftOptions.value = opts
  } else {
    draftOptions.value = { ...draftOptions.value, [key]: value }
  }
}

/** 当前选中的变体值（单选）；未选中返回 undefined */
function getSelectedVariant(key: string): string | undefined {
  const val = draftOptions.value[key]
  if (Array.isArray(val)) return val[0] as string | undefined
  if (typeof val === 'string') return val
  return undefined
}

function isVariantSelected(key: string, val: string): boolean {
  return getSelectedVariant(key) === val
}

/** 单选：再次点击已选中项则取消（回到随机）。选真实变体会覆盖隐藏态。 */
function selectVariant(key: string, val: string) {
  if (getSelectedVariant(key) === val) {
    updateOption(key, undefined)
  } else {
    updateOption(key, [val])
  }
}

/** 该部位是否被用户显式隐藏（值为 VARIANT_NONE 哨兵） */
function isHidden(key: string): boolean {
  return getSelectedVariant(key) === VARIANT_NONE
}

/** 切换隐藏：隐藏时写入 VARIANT_NONE，取消隐藏则清空（回到随机） */
function toggleHidden(key: string) {
  if (isHidden(key)) {
    updateOption(key, undefined)
  } else {
    updateOption(key, [VARIANT_NONE])
  }
}

// --- 颜色操作 ---
const colorPickerTemp = ref<Record<string, string>>({})

function getFreeColors(key: string): string[] {
  const val = draftOptions.value[key]
  if (Array.isArray(val)) return val as string[]
  return []
}

function addFreeColor(key: string) {
  const raw = colorPickerTemp.value[key] ?? '#b6e3f4'
  const hex = raw.replace(/^#/, '').toLowerCase()
  const current = getFreeColors(key)
  if (!current.includes(hex)) updateOption(key, [...current, hex])
}

function removeFreeColor(key: string, idx: number) {
  const current = getFreeColors(key)
  const next = current.filter((_, i) => i !== idx)
  updateOption(key, next.length ? next : undefined)
}

// --- 标签名映射 ---
const PROP_LABELS: Record<string, string> = {
  // 变体
  eyesVariant: '眼睛',
  eyebrowsVariant: '眉毛',
  mouthVariant: '嘴巴',
  noseVariant: '鼻子',
  headVariant: '头部',
  hairVariant: '发型',
  topVariant: '头顶',
  clothingVariant: '服装',
  bodyVariant: '身体',
  accessoriesVariant: '配饰',
  facialHairVariant: '面部毛发',
  glassesVariant: '眼镜',
  earringsVariant: '耳环',
  baseVariant: '基础',
  detailsVariant: '细节',
  skinVariant: '肤色变体',
  faceVariant: '脸型',
  clothingGraphicVariant: '服装图案',
  // 颜色
  backgroundColor: '背景色',
  hairColor: '发色',
  skinColor: '肤色',
  accessoriesColor: '配饰颜色',
  clothesColor: '服装颜色',
  facialHairColor: '面部毛发颜色',
  hatColor: '帽子颜色',
  eyesColor: '眼睛颜色',
  mouthColor: '嘴巴颜色',
  shapeColor: '形状颜色',
  primaryColor: '主色',
  secondaryColor: '辅色',
  tertiaryColor: '第三色',
  bodyColor: '身体颜色',
  chestColor: '胸部颜色',
  featureColor: '特征颜色'
}

function formatPropLabel(key: string): string {
  if (PROP_LABELS[key]) return PROP_LABELS[key]
  // 尝试自动解析
  return key
    .replace(/Variant$/, '')
    .replace(/Color$/, '颜色')
    .replace(/Probability$/, '概率')
    .replace(/([A-Z])/g, ' $1')
    .trim()
}

function formatVariantLabel(val: string): string {
  if (val === 'default') return '默认'
  return val.replace(/^variant0*(\d+)$/, '样式 $1').replace(/-/g, ' ')
}

function randomizeSeed() {
  draftSeed.value = Math.random().toString(36).slice(2, 10)
}

function resetToDefault() {
  draftConfig.value = { style: 'thumbs', options: {} }
  draftSeed.value = ''
  draftOptions.value = {}
}

function handleConfirm() {
  const config: AvatarConfig = {
    style: draftConfig.value.style,
    seed: draftSeed.value || undefined,
    options: Object.keys(draftOptions.value).length ? draftOptions.value : undefined
  }
  emit('confirm', serializeAvatarConfig(config))
  visible.value = false
}

function handleClose() {
  styleSearch.value = ''
  optionPreviewCache.clear()
  colorPickerTemp.value = {}
}
</script>

<style lang="scss">
// 注册渐隐带宽度自定义属性, 使其可被 transition 平滑过渡（须为全局, 不能 scoped）
@property --fade-top {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

@property --fade-bottom {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

@property --fade-left {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

@property --fade-right {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}
</style>

<style lang="scss" scoped>
// ============================================================
// 头像工坊 — Nebula 风格
// 三区工作台：风格库 · 展示舞台 · 部件编辑器
// 颜色全部走 nebula CSS 变量, 自动适配 light/dark
// ============================================================

.avatar-forge-modal {
  :deep(.n-card) {
    max-width: 1040px;
    width: 94vw;
    overflow: hidden;
  }

  :deep(.n-card__content) {
    padding: $space-4 $space-5;
  }

  // 顶部一道极光辉光线, 呼应 nebula 面板
  :deep(.n-card-header) {
    position: relative;
    padding: $space-4 $space-5;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--strix-text-accent), transparent);
      opacity: 0.35;
    }
  }

  :deep(.n-card__footer) {
    padding: $space-3 $space-5;
    border-top: 1px solid var(--strix-border-subtle);
  }
}

// ---- 头部 ----
.avatar-forge__head {
  display: flex;
  align-items: center;
  gap: $space-3;

  &-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: $radius-md;
    color: var(--strix-text-accent);
    background: var(--strix-accent-glow-subtle);
    border: 1px solid var(--strix-border-accent);
    flex-shrink: 0;
  }

  &-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  &-title {
    font-family: $font-display;
    font-size: $text-lg;
    font-weight: $weight-semibold;
    letter-spacing: $tracking-tight;
    color: var(--strix-text-primary);
    line-height: $leading-tight;
  }

  &-sub {
    font-size: $text-2xs;
    color: var(--strix-text-tertiary);
    letter-spacing: $tracking-wide;
  }
}

// ---- 主体三栏 ----
.avatar-forge {
  display: grid;
  grid-template-columns: 208px 264px 1fr;
  height: 568px;
  // 整体圆角卡片：overflow hidden 裁切内部各栏, 形成统一圆角边界
  border: 1px solid var(--strix-border-default);
  border-radius: $radius-lg;
  overflow: hidden;

  // ============================================================
  // 一区：风格库
  // ============================================================
  &__library {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-right: 1px solid var(--strix-border-subtle);
    background: var(--strix-bg-surface);
  }

  &__library-search {
    flex-shrink: 0;
    padding: $space-3 $space-3 $space-2;

    // 搜索框圆角呼应 nebula 卡片语言
    :deep(.n-input) {
      border-radius: $radius-md;
    }

    :deep(.n-input .n-input__border),
    :deep(.n-input .n-input__state-border) {
      border-radius: $radius-md;
    }
  }

  // 边缘 mask 渐隐：尚有未显示内容时该侧淡出, 滚动到边即恢复实心。
  // 直接作用在滚动元素上, 与背景无关; --fade 为渐隐带宽度。
  &__scroll-y {
    --fade: 0px;
    overflow-y: auto;
    overflow-x: hidden;
    @include thin-scrollbar;
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0,
      #000 var(--fade-top, 0px),
      #000 calc(100% - var(--fade-bottom, 0px)),
      transparent 100%
    );
    mask-image: linear-gradient(
      to bottom,
      transparent 0,
      #000 var(--fade-top, 0px),
      #000 calc(100% - var(--fade-bottom, 0px)),
      transparent 100%
    );
    transition:
      --fade-top $duration-normal $ease-out-smooth,
      --fade-bottom $duration-normal $ease-out-smooth;

    &.fade-top {
      --fade-top: 40px;
    }

    &.fade-bottom {
      --fade-bottom: 48px;
    }
  }

  &__scroll-x {
    overflow-x: auto;
    @include hide-scrollbar;
    -webkit-mask-image: linear-gradient(
      to right,
      transparent 0,
      #000 var(--fade-left, 0px),
      #000 calc(100% - var(--fade-right, 0px)),
      transparent 100%
    );
    mask-image: linear-gradient(
      to right,
      transparent 0,
      #000 var(--fade-left, 0px),
      #000 calc(100% - var(--fade-right, 0px)),
      transparent 100%
    );
    transition:
      --fade-left $duration-normal $ease-out-smooth,
      --fade-right $duration-normal $ease-out-smooth;

    &.fade-left {
      --fade-left: 24px;
    }

    &.fade-right {
      --fade-right: 24px;
    }
  }

  &__library-scroll {
    flex: 1;
    min-height: 0;
    padding: $space-1 $space-2 $space-3;
  }

  &__library-empty {
    padding: $space-8 $space-2;
    text-align: center;
    font-size: $text-2xs;
    color: var(--strix-text-muted);
  }

  &__group {
    & + & {
      margin-top: $space-3;
    }
  }

  &__group-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-2 $space-2 $space-1;
    font-size: $text-2xs;
    font-weight: $weight-bold;
    letter-spacing: $tracking-wide;
    color: var(--strix-text-muted);
  }

  &__group-count {
    font-family: $font-mono;
    font-size: 10px;
    color: var(--strix-text-muted);
    opacity: 0.7;
  }

  &__style-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $space-1;
  }

  &__style {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-1;
    padding: $space-2 4px;
    border: 1px solid transparent;
    border-radius: $radius-md;
    background: transparent;
    cursor: pointer;
    transition:
      background $duration-fast,
      border-color $duration-fast,
      transform $duration-fast;

    &:hover {
      background: var(--strix-bg-surface-hover);
    }

    &:hover .avatar-forge__style-thumb {
      transform: scale(1.06);
    }

    &.is-active {
      border-color: var(--strix-border-accent-hover);
      background: var(--strix-accent-glow-subtle);
      box-shadow: $glow-accent-subtle;
    }

    &.is-active .avatar-forge__style-name {
      color: var(--strix-text-accent);
    }
  }

  &__style-thumb {
    width: 42px;
    height: 42px;
    border-radius: $radius-circle;
    overflow: hidden;
    background: var(--strix-bg-elevated);
    transition: transform $duration-fast $ease-out-expo;

    :deep(svg) {
      display: block;
      width: 100%;
      height: 100%;
    }
  }

  &__style-name {
    max-width: 56px;
    font-size: 10px;
    line-height: $leading-tight;
    text-align: center;
    color: var(--strix-text-tertiary);
    @include text-ellipsis;
  }

  // ============================================================
  // 二区：展示舞台
  // ============================================================
  &__stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 0;
    padding: $space-6 $space-5 $space-5;
    border-right: 1px solid var(--strix-border-subtle);
    background: var(--strix-bg-elevated);
  }

  // 签名元素：极光聚光环 + 呼吸光晕
  &__stage-display {
    position: relative;
    width: 188px;
    height: 188px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__halo {
    position: absolute;
    inset: -14px;
    border-radius: $radius-circle;
    background: conic-gradient(
      from 180deg,
      var(--strix-color-accent),
      var(--strix-color-accent-secondary),
      var(--strix-color-info),
      var(--strix-color-accent)
    );
    filter: blur(18px);
    opacity: 0.28;
    animation: avatar-forge-halo 7s ease-in-out infinite;
  }

  &__avatar {
    position: relative;
    width: 168px;
    height: 168px;
    border-radius: $radius-circle;
    overflow: hidden;
    background: var(--strix-bg-base);
    border: 1px solid var(--strix-border-accent);
    box-shadow:
      0 6px 28px rgba(0, 0, 0, 0.22),
      inset 0 0 0 3px var(--strix-bg-elevated);

    :deep(svg) {
      display: block;
      width: 100%;
      height: 100%;
    }
  }

  &__stage-meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    margin-top: $space-4;
    text-align: center;
  }

  &__stage-style {
    font-family: $font-display;
    font-size: $text-base;
    font-weight: $weight-semibold;
    color: var(--strix-text-primary);
  }

  &__stage-category {
    font-size: $text-2xs;
    letter-spacing: $tracking-wide;
    color: var(--strix-text-tertiary);
  }

  &__stage-actions {
    display: flex;
    gap: $space-2;
    margin-top: $space-4;
  }

  &__seed {
    width: 100%;
    margin-top: auto;
    padding-top: $space-4;
  }

  &__seed-label {
    display: block;
    margin-bottom: $space-1;
    font-size: $text-2xs;
    font-weight: $weight-semibold;
    letter-spacing: $tracking-wide;
    color: var(--strix-text-secondary);
  }

  &__seed-input {
    :deep(.n-input__input-el) {
      font-family: $font-mono;
      font-size: $text-2xs;
    }
  }

  &__seed-hint {
    margin: $space-1 0 0;
    font-size: 10px;
    color: var(--strix-text-muted);
  }

  // ============================================================
  // 三区：部件编辑器
  // ============================================================
  &__editor {
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    background: var(--strix-bg-elevated);
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-2;
    height: 100%;
    padding: $space-6;
    text-align: center;
  }

  &__empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    margin-bottom: $space-1;
    border-radius: $radius-lg;
    color: var(--strix-text-accent);
    background: var(--strix-accent-glow-subtle);
    border: 1px solid var(--strix-border-accent);
  }

  &__empty-text {
    margin: 0;
    font-size: $text-sm;
    font-weight: $weight-medium;
    color: var(--strix-text-secondary);
  }

  &__empty-sub {
    margin: 0;
    font-size: $text-2xs;
    color: var(--strix-text-muted);
  }

  // ---- 药丸导航 ----
  &__nav {
    flex-shrink: 0;
    padding: $space-3 $space-4 $space-2;
    border-bottom: 1px solid var(--strix-border-subtle);
  }

  &__nav-track {
    display: flex;
    gap: $space-1;
    scroll-behavior: smooth;
  }

  &__nav-pill {
    position: relative;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px $space-3;
    border: 1px solid transparent;
    border-radius: $radius-pill;
    background: transparent;
    color: var(--strix-text-tertiary);
    font-size: $text-xs;
    font-weight: $weight-medium;
    white-space: nowrap;
    cursor: pointer;
    transition:
      color $duration-fast,
      background $duration-fast,
      border-color $duration-fast;

    &:hover {
      color: var(--strix-text-secondary);
      background: var(--strix-bg-surface-hover);
    }

    &.is-active {
      color: var(--strix-text-accent);
      background: var(--strix-accent-glow-subtle);
      border-color: var(--strix-border-accent);
    }
  }

  // 部位状态点：已选样式=accent 绿, 已隐藏=warning 黄, 未选不渲染
  &__nav-dot {
    width: 6px;
    height: 6px;
    border-radius: $radius-circle;
    flex-shrink: 0;

    &.is-set {
      background: var(--strix-color-accent);
    }

    &.is-hidden {
      background: var(--strix-color-warning);
    }
  }

  // ---- 内容滚动区 ----
  // pane-wrap 作为 flex 容器, 让 pane 的 flex:1 + min-height:0 生效,
  // pane 据此获得确定高度, overflow-y 滚动与 mask 渐隐才能正常工作。
  &__pane-wrap {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  &__pane {
    flex: 1;
    min-height: 0;
    padding: $space-4 $space-4 $space-5;
  }

  // ---- 工具条 ----
  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-2;
    margin-bottom: $space-3;
  }

  // ---- 分段控件（预览范围）----
  &__segmented {
    display: inline-flex;
    padding: 3px;
    border-radius: $radius-md;
    background: var(--strix-bg-surface);
    border: 1px solid var(--strix-border-subtle);
  }

  &__seg {
    padding: 3px $space-3;
    border: none;
    border-radius: $radius-sm;
    background: transparent;
    color: var(--strix-text-tertiary);
    font-size: $text-2xs;
    font-weight: $weight-medium;
    cursor: pointer;
    transition:
      color $duration-fast,
      background $duration-fast;

    &:hover:not(.is-on) {
      color: var(--strix-text-secondary);
    }

    &.is-on {
      color: var(--strix-text-accent);
      background: var(--strix-accent-glow);
      box-shadow: $shadow-sm;
    }
  }

  &__toolbar-actions {
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  // ---- 工具条动作按钮 ----
  &__act {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    padding: 0 $space-2;
    border: 1px solid var(--strix-border-default);
    border-radius: $radius-sm;
    background: var(--strix-bg-surface);
    color: var(--strix-text-secondary);
    font-size: $text-2xs;
    cursor: pointer;
    transition:
      color $duration-fast,
      background $duration-fast,
      border-color $duration-fast;

    &:hover {
      background: var(--strix-bg-surface-hover);
      border-color: var(--strix-border-default);
    }

    &--ghost {
      border-color: transparent;
      background: transparent;
      color: var(--strix-text-tertiary);

      &:hover {
        color: var(--strix-text-secondary);
        background: var(--strix-bg-surface-hover);
      }
    }

    &.is-warning {
      color: var(--strix-color-warning);
      border-color: color-mix(in srgb, var(--strix-color-warning) 40%, transparent);
      background: color-mix(in srgb, var(--strix-color-warning) 12%, transparent);
    }
  }

  // ---- 提示 callout ----
  &__callout {
    display: flex;
    align-items: center;
    gap: $space-2;
    margin-bottom: $space-3;
    padding: $space-2 $space-3;
    border-radius: $radius-md;
    font-size: $text-2xs;
    line-height: $leading-snug;

    &--warning {
      color: var(--strix-color-warning);
      background: color-mix(in srgb, var(--strix-color-warning) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--strix-color-warning) 28%, transparent);
    }

    svg {
      flex-shrink: 0;
    }
  }

  // ---- 分节小标题 ----
  &__sub-label {
    display: flex;
    align-items: center;
    gap: $space-2;
    margin: $space-5 0 $space-3;
    padding-top: $space-4;
    font-size: $text-2xs;
    font-weight: $weight-semibold;
    letter-spacing: $tracking-wide;
    color: var(--strix-text-secondary);
    border-top: 1px solid var(--strix-border-subtle);

    svg {
      color: var(--strix-text-accent);
    }

    &--first {
      margin-top: 0;
      padding-top: 0;
      border-top: none;
    }
  }

  // ---- 提示文案 ----
  &__hint {
    margin: 0;
    font-size: 11px;
    color: var(--strix-text-muted);
  }

  // ---- 变体网格 ----
  &__variant-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(94px, 1fr));
    gap: $space-2;
  }

  &__variant {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-1;
    padding: $space-2 4px;
    border: 1px solid transparent;
    border-radius: $radius-md;
    background: transparent;
    cursor: pointer;
    transition:
      background $duration-fast,
      border-color $duration-fast;

    &:hover {
      background: var(--strix-bg-surface-hover);
    }

    &.is-selected {
      border-color: var(--strix-border-accent-hover);
      background: var(--strix-accent-glow-subtle);
      box-shadow: $glow-accent-subtle;
    }

    &.is-selected .avatar-forge__variant-label {
      color: var(--strix-text-accent);
    }
  }

  &__variant-thumb {
    width: 78px;
    height: 78px;
    border-radius: $radius-circle;
    overflow: hidden;
    background: var(--strix-bg-elevated);

    // 局部预览：组件多含透明区域, 叠加棋盘格底纹提升可视度。
    // 棋盘用固定浅色 (不随暗色主题变暗), 深色组件 (眉毛/眼睛等) 才能凸显,
    // 等同 Photoshop 透明底纹的视觉参照。
    &.is-partial {
      background-color: #d4d7dc;
      background-image:
        linear-gradient(45deg, #a8adb6 25%, transparent 25%), linear-gradient(-45deg, #a8adb6 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #a8adb6 75%), linear-gradient(-45deg, transparent 75%, #a8adb6 75%);
      background-size: 14px 14px;
      background-position:
        0 0,
        0 7px,
        7px -7px,
        -7px 0;
    }

    :deep(svg) {
      display: block;
      width: 100%;
      height: 100%;
    }
  }

  &__variant-label {
    max-width: 90px;
    font-size: 10px;
    line-height: $leading-tight;
    text-align: center;
    color: var(--strix-text-tertiary);
    @include text-ellipsis;
  }

  &__variant-check {
    position: absolute;
    top: 5px;
    right: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: $radius-circle;
    color: #fff;
    background: var(--strix-color-accent);
    box-shadow: 0 0 0 2px var(--strix-bg-elevated);
  }

  // ---- 配色区 ----
  &__color {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  &__color-list {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    padding: 3px $space-1 3px 5px;
    border-radius: $radius-pill;
    background: var(--strix-bg-surface);
    border: 1px solid var(--strix-border-default);
  }

  &__chip-dot {
    width: 16px;
    height: 16px;
    border-radius: $radius-circle;
    border: 1px solid rgba(128, 128, 128, 0.25);
    flex-shrink: 0;
  }

  &__chip-hex {
    font-family: $font-mono;
    font-size: 11px;
    color: var(--strix-text-secondary);
    text-transform: uppercase;
  }

  &__chip-x {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    border-radius: $radius-circle;
    background: transparent;
    color: var(--strix-text-muted);
    cursor: pointer;
    transition:
      color $duration-fast,
      background $duration-fast;

    &:hover {
      color: var(--strix-color-error);
      background: var(--strix-bg-surface-hover);
    }
  }

  &__color-add {
    display: flex;
    align-items: stretch;
    gap: $space-2;
    flex-wrap: wrap;

    // 颜色选择器与添加/清除按钮统一高度对齐
    .avatar-forge__act {
      height: 30px;
    }
  }

  &__picker {
    width: 116px;
    height: 30px;
    flex-shrink: 0;

    :deep(.n-color-picker) {
      width: 100%;
      height: 100%;
    }
  }

  &__color-hint {
    margin: 0;
    font-size: 11px;
    font-style: italic;
    color: var(--strix-text-muted);
  }
}

// ---- 底部 ----
.avatar-forge__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;

  &-tip {
    font-size: $text-2xs;
    color: var(--strix-text-tertiary);
  }
}

// ---- 签名动画：极光环呼吸 ----
@keyframes avatar-forge-halo {
  0%,
  100% {
    opacity: 0.22;
    transform: scale(0.97) rotate(0deg);
  }
  50% {
    opacity: 0.38;
    transform: scale(1.03) rotate(180deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .avatar-forge__halo {
    animation: none;
  }
}

// ---- 响应式：窄屏折叠为单列纵向滚动 ----
@include screen-md-down {
  .avatar-forge {
    grid-template-columns: 1fr;
    height: auto;
    max-height: 76vh;
    overflow-y: auto;
    @include thin-scrollbar;

    &__library {
      border-right: none;
      border-bottom: 1px solid var(--strix-border-subtle);
    }

    &__library-scroll {
      max-height: 220px;
    }

    &__stage {
      border-right: none;
      border-bottom: 1px solid var(--strix-border-subtle);
    }

    &__seed {
      margin-top: $space-4;
    }

    &__editor {
      min-height: 360px;
    }
  }
}
</style>
