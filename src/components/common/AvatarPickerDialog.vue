<template>
  <n-modal
    v-model:show="visible"
    :mask-closable="false"
    preset="card"
    title="配置头像"
    class="avatar-picker-modal"
    @after-leave="handleClose"
  >
    <div class="avatar-picker">
      <!-- 左栏：样式选择 -->
      <div class="avatar-picker__styles">
        <div class="avatar-picker__styles-header">
          <n-input v-model:value="styleSearch" placeholder="搜索样式..." size="small" clearable>
            <template #prefix>
              <n-icon>
                <SearchIcon />
              </n-icon>
            </template>
          </n-input>
        </div>
        <n-scrollbar class="avatar-picker__styles-scroll">
          <div v-for="(styles, category) in filteredStylesByCategory" :key="category" class="avatar-picker__category">
            <div class="avatar-picker__category-label">{{ category }}</div>
            <div class="avatar-picker__style-grid">
              <div
                v-for="styleName in styles"
                :key="styleName"
                :class="['avatar-picker__style-card', { active: draftConfig.style === styleName }]"
                @click="selectStyle(styleName)"
              >
                <div class="avatar-picker__style-preview" v-html="getStylePreview(styleName)" />
                <span class="avatar-picker__style-name">{{ STYLE_META[styleName]?.label ?? styleName }}</span>
              </div>
            </div>
          </div>
        </n-scrollbar>
      </div>

      <!-- 右栏：预览 + 选项 Tab -->
      <div class="avatar-picker__editor">
        <!-- 预览区 -->
        <div class="avatar-picker__preview-area">
          <div class="avatar-picker__preview-avatar" v-html="currentPreviewSvg" />
          <div class="avatar-picker__preview-actions">
            <n-button size="small" quaternary @click="randomizeSeed">
              <template #icon>
                <n-icon>
                  <ShuffleIcon />
                </n-icon>
              </template>
              随机
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
          <div class="avatar-picker__seed-row">
            <span class="avatar-picker__seed-label">Seed：</span>
            <n-input
              v-model:value="draftSeed"
              size="small"
              placeholder="自定义 seed（留空使用管理员 ID）"
              style="flex: 1"
              @update:value="updatePreview"
            />
          </div>
        </div>

        <!-- 选项区：横向 Tab 布局 -->
        <div class="avatar-picker__options-area">
          <div v-if="!hasAnyOption" class="avatar-picker__no-options">
            <n-empty description="此样式无可配置选项" size="small" />
          </div>

          <n-tabs
            v-else
            v-model:value="activeTab"
            type="card"
            size="small"
            :tab-style="{ padding: '4px 8px', fontSize: '11px' }"
            animated
            class="avatar-picker__tabs"
            pane-wrapper-class="avatar-picker__pane-wrapper"
          >
            <!-- 部位 Tab（变体 + 同部位颜色 + 同部位概率 合并） -->
            <n-tab-pane v-for="t in partTabs" :key="t.name" :name="t.name" :tab="formatPropLabel(t.variantKey)">
              <n-scrollbar class="avatar-picker__tab-content">
                <div class="avatar-picker__variant-toolbar">
                  <n-button-group size="tiny">
                    <n-button :type="previewMode === 'full' ? 'primary' : 'default'" @click="previewMode = 'full'"
                      >整体预览
                    </n-button>
                    <n-button :type="previewMode === 'partial' ? 'primary' : 'default'" @click="previewMode = 'partial'"
                      >局部预览
                    </n-button>
                  </n-button-group>
                  <n-flex :size="6" :wrap="false">
                    <!-- 隐藏开关：仅装饰组件可隐藏（内置概率 <100），激活态持久化于 VARIANT_NONE -->
                    <n-button
                      v-if="isOptionalComponent(draftConfig.style, t.variantKey)"
                      size="tiny"
                      :type="isHidden(t.variantKey) ? 'warning' : 'default'"
                      :ghost="isHidden(t.variantKey)"
                      @click="toggleHidden(t.variantKey)"
                    >
                      <template #icon>
                        <n-icon>
                          <EyeOffIcon />
                        </n-icon>
                      </template>
                      {{ isHidden(t.variantKey) ? '已隐藏' : '隐藏' }}
                    </n-button>
                    <n-button
                      v-if="getSelectedVariant(t.variantKey) && !isHidden(t.variantKey)"
                      size="tiny"
                      quaternary
                      type="error"
                      @click="updateOption(t.variantKey, undefined)"
                      >清除选择（随机）
                    </n-button>
                  </n-flex>
                </div>
                <div v-if="isHidden(t.variantKey)" class="avatar-picker__hidden-hint">
                  该部位已隐藏，点击任意样式可恢复显示
                </div>
                <div class="avatar-picker__variant-grid">
                  <div
                    v-for="val in currentSchema[t.variantKey]?.values ?? []"
                    :key="val"
                    :class="['avatar-picker__variant-item', { selected: isVariantSelected(t.variantKey, val) }]"
                    @click="selectVariant(t.variantKey, val)"
                  >
                    <div class="avatar-picker__variant-preview" v-html="getOptionPreview(t.variantKey, val)" />
                    <span class="avatar-picker__variant-label">{{ formatVariantLabel(val) }}</span>
                    <n-icon
                      v-if="isVariantSelected(t.variantKey, val)"
                      class="avatar-picker__variant-check"
                      size="11"
                      color="var(--primary-color)"
                    >
                      <CheckIcon />
                    </n-icon>
                  </div>
                </div>

                <!-- 同部位颜色 -->
                <template v-if="t.colorKey">
                  <div class="avatar-picker__section-label">{{ formatPropLabel(t.colorKey) }}</div>
                  <div class="avatar-picker__freecolor">
                    <div class="avatar-picker__freecolor-list">
                      <div
                        v-for="(clr, idx) in getFreeColors(t.colorKey)"
                        :key="idx"
                        class="avatar-picker__freecolor-chip"
                      >
                        <div class="avatar-picker__freecolor-dot" :style="{ background: `#${clr}` }" />
                        <span class="avatar-picker__freecolor-hex">#{{ clr }}</span>
                        <span class="avatar-picker__freecolor-remove" @click="removeFreeColor(t.colorKey, idx)">×</span>
                      </div>
                    </div>
                    <div class="avatar-picker__freecolor-add">
                      <n-color-picker
                        :show-alpha="false"
                        :modes="['hex']"
                        :value="colorPickerTemp[t.colorKey] ?? '#b6e3f4'"
                        size="small"
                        @update:value="
                          (v: string) => {
                            colorPickerTemp[t.colorKey!] = v
                          }
                        "
                      />
                      <n-button size="small" type="primary" ghost @click="addFreeColor(t.colorKey)">添加颜色</n-button>
                      <n-button
                        v-if="getFreeColors(t.colorKey).length"
                        size="small"
                        quaternary
                        type="error"
                        @click="updateOption(t.colorKey, undefined)"
                        >清除
                      </n-button>
                    </div>
                    <div v-if="getFreeColors(t.colorKey).length === 0" class="avatar-picker__freecolor-hint">
                      未设置时将从样式默认色板中随机选取
                    </div>
                  </div>
                </template>
              </n-scrollbar>
            </n-tab-pane>

            <!-- 颜色 Tab（未归入部位的孤立颜色，如背景色 / 形状色） -->
            <n-tab-pane v-if="extraColorProps.length > 0" name="__color__" tab="颜色">
              <n-scrollbar class="avatar-picker__tab-content">
                <template v-for="key in extraColorProps" :key="key">
                  <div class="avatar-picker__section-label">{{ formatPropLabel(key) }}</div>
                  <div class="avatar-picker__freecolor">
                    <div class="avatar-picker__freecolor-list">
                      <div v-for="(clr, idx) in getFreeColors(key)" :key="idx" class="avatar-picker__freecolor-chip">
                        <div class="avatar-picker__freecolor-dot" :style="{ background: `#${clr}` }" />
                        <span class="avatar-picker__freecolor-hex">#{{ clr }}</span>
                        <span class="avatar-picker__freecolor-remove" @click="removeFreeColor(key, idx)">×</span>
                      </div>
                    </div>
                    <div class="avatar-picker__freecolor-add">
                      <n-color-picker
                        :show-alpha="false"
                        :modes="['hex']"
                        :value="colorPickerTemp[key] ?? '#b6e3f4'"
                        size="small"
                        @update:value="
                          (v: string) => {
                            colorPickerTemp[key] = v
                          }
                        "
                      />
                      <n-button size="small" type="primary" ghost @click="addFreeColor(key)">添加颜色</n-button>
                      <n-button
                        v-if="getFreeColors(key).length"
                        size="small"
                        quaternary
                        type="error"
                        @click="updateOption(key, undefined)"
                        >清除
                      </n-button>
                    </div>
                    <div v-if="getFreeColors(key).length === 0" class="avatar-picker__freecolor-hint">
                      未设置时将从样式默认色板中随机选取
                    </div>
                  </div>
                </template>
              </n-scrollbar>
            </n-tab-pane>
          </n-tabs>
        </div>
      </div>
    </div>

    <template #footer>
      <n-flex justify="end">
        <n-button @click="visible = false">取消</n-button>
        <n-button type="primary" @click="handleConfirm">保存头像</n-button>
      </n-flex>
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
  EyeOff as EyeOffIcon,
  RotateCcw as RotateCcwIcon,
  Search as SearchIcon,
  Shuffle as ShuffleIcon
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

<style lang="scss" scoped>
.avatar-picker-modal {
  :deep(.n-card) {
    max-width: 1000px;
    width: 92vw;
  }
}

.avatar-picker {
  display: flex;
  gap: 16px;
  height: 580px;

  &__styles {
    width: 210px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--n-border-color);
    padding-right: 12px;
  }

  &__styles-header {
    margin-bottom: 8px;
    flex-shrink: 0;
  }

  &__styles-scroll {
    flex: 1;
    min-height: 0;
  }

  &__category {
    margin-bottom: 12px;
    padding-right: 4px;
  }

  &__category-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--n-text-color-3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 5px;
  }

  &__style-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }

  &__style-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 4px;
    border-radius: 6px;
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: all 0.15s;

    &:hover {
      background: var(--n-color-hover);
    }

    &.active {
      border-color: var(--primary-color);
      background: var(--primary-color-suppl);
    }
  }

  &__style-preview {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--n-color);

    :deep(svg) {
      width: 100%;
      height: 100%;
    }
  }

  &__style-name {
    font-size: 9px;
    color: var(--n-text-color-2);
    text-align: center;
    line-height: 1.2;
    max-width: 52px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__editor {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__preview-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--n-border-color);
    flex-shrink: 0;
  }

  &__preview-avatar {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.12);
    background: var(--n-color);

    :deep(svg) {
      width: 100%;
      height: 100%;
    }
  }

  &__preview-actions {
    display: flex;
    gap: 8px;
  }

  &__seed-row {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 0 8px;
  }

  &__seed-label {
    font-size: 12px;
    color: var(--n-text-color-3);
    white-space: nowrap;
  }

  &__options-area {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  &__tabs {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;

    // naive-ui n-tabs 内部链路需逐层撑满高度，n-scrollbar 才能获得确定高度并滚动
    :deep(.n-tabs) {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    :deep(.n-tabs-nav) {
      flex-shrink: 0;
    }

    :deep(.n-tabs-wrapper) {
      flex-shrink: 0;
    }

    :deep(.n-tabs-content) {
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    :deep(.n-tabs-content-wrapper) {
      height: 100%;
    }

    :deep(.n-tab-pane) {
      height: 100%;
      min-height: 0;
      overflow: hidden;
      padding: 0;
    }
  }

  &__tab-content {
    height: 100%;
    // 右侧留出空间避免内容贴住滚动条；底部 padding 防最后一行溢出
    padding: 8px 10px 12px 2px;
  }

  &__section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--n-text-color-3);
    margin: 14px 0 8px;
    padding-top: 12px;
    border-top: 1px dashed var(--n-border-color);
  }

  &__no-options {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  &__variant-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--n-text-color-3);
    margin: 14px 0 8px;
    padding-top: 10px;
    border-top: 1px solid var(--n-border-color);
  }

  &__hidden-hint {
    font-size: 11px;
    color: var(--warning-color);
    margin-bottom: 8px;
  }

  &__variant-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
    padding-bottom: 8px;
  }

  &__variant-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 6px 4px;
    border-radius: 7px;
    cursor: pointer;
    border: 1.5px solid transparent;
    position: relative;
    transition: all 0.15s;

    &:hover {
      background: var(--n-color-hover);
    }

    &.selected {
      border-color: var(--primary-color);
      background: var(--primary-color-suppl);
    }
  }

  &__variant-preview {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--n-color);

    :deep(svg) {
      width: 100%;
      height: 100%;
    }
  }

  &__variant-label {
    font-size: 10px;
    color: var(--n-text-color-2);
    text-align: center;
    line-height: 1.2;
    max-width: 96px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__variant-check {
    position: absolute;
    top: 3px;
    right: 3px;
  }

  &__freecolor {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__freecolor-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__freecolor-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px 3px 5px;
    border-radius: 14px;
    background: var(--n-color-hover);
    border: 1px solid var(--n-border-color);
    font-size: 11px;
  }

  &__freecolor-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid rgba(128, 128, 128, 0.2);
    flex-shrink: 0;
  }

  &__freecolor-hex {
    color: var(--n-text-color-2);
    font-family: monospace;
  }

  &__freecolor-remove {
    cursor: pointer;
    color: var(--n-text-color-3);
    font-size: 14px;
    line-height: 1;

    &:hover {
      color: var(--error-color);
    }
  }

  &__freecolor-add {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__freecolor-hint {
    font-size: 11px;
    color: var(--n-text-color-3);
    font-style: italic;
  }

  // 部位 tab 内的分节标题（颜色小节）
  &__section-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--n-text-color-2);
    margin: 14px 0 8px;
    padding-top: 12px;
    border-top: 1px solid var(--n-border-color);
  }
}
</style>
