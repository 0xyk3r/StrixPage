<template>
  <div class="ai-nexus">
    <!-- Header -->
    <div class="nbp-header">
      <div class="nbp-header__left">
        <div class="nbp-header__brand">
          <span class="nbp-pulse-dot"></span>
          <span class="nbp-mono-label">AI_MODEL_NEXUS</span>
        </div>
        <h2 class="nbp-page-title">AI 模型配置</h2>
        <p class="nbp-page-subtitle">模型接入管理 · {{ list.length }} 个配置</p>
      </div>
      <div class="ain-header__type-legend">
        <div v-for="[code, label] in typeLegend" :key="code" class="ain-legend-item">
          <span :class="['ain-legend-dot', `ain-type-dot--${code}`]"></span>
          <span>{{ label }}</span>
        </div>
      </div>
    </div>

    <!-- Filters & Actions -->
    <div class="nbp-toolbar ain-toolbar">
      <div class="ain-filters">
        <label class="nbp-search ain-search">
          <svg class="nbp-search__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            v-model="keyword"
            class="nbp-search__input"
            placeholder="搜索模型名称或 Key…"
            @keydown.enter="loadList"
          />
          <button v-if="keyword" class="nbp-search__clear" @click="clearSearch" aria-label="清除搜索">×</button>
        </label>
        <div class="ain-type-filter">
          <button :class="['ain-filter-btn', { 'is-active': filterType === null }]" @click="changeFilterType(null)">
            全部
          </button>
          <button
            v-for="opt in typeOptions"
            :key="opt.value"
            :class="['ain-filter-btn', `ain-filter-type--${opt.value}`, { 'is-active': filterType === opt.value }]"
            @click="changeFilterType(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
      <button class="nbp-btn nbp-btn--primary" @click="showAdd"><span>＋</span> 添加模型</button>
    </div>

    <!-- Model cards grid -->
    <div class="ain-grid">
      <!-- Skeleton loading -->
      <template v-if="loading">
        <div v-for="i in 6" :key="i" class="ain-card ain-card--skeleton">
          <div class="ain-skeleton-line ain-skeleton-line--short"></div>
          <div class="ain-skeleton-line ain-skeleton-line--med"></div>
          <div class="ain-skeleton-line ain-skeleton-line--long"></div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else-if="filteredList.length === 0" class="ain-empty">
        <div class="ain-empty__glyph">⊛</div>
        <div class="ain-mono ain-dim">NO_MODELS_FOUND</div>
        <div class="ain-empty__sub">{{ keyword || filterType ? '调整筛选条件后重试' : '点击"添加模型"开始配置' }}</div>
      </div>

      <!-- Model cards -->
      <div
        v-else
        v-for="(item, i) in filteredList"
        :key="item.id"
        class="ain-card"
        :style="{ '--delay': `${i * 0.05}s` }"
      >
        <!-- Type stripe -->
        <div :class="['ain-card__stripe', `ain-stripe--type${item.type}`]"></div>

        <!-- Card head -->
        <div class="ain-card__head">
          <div class="ain-card__type-badge">
            <span :class="['ain-type-badge', `ain-type-badge--${item.type}`]">{{
                MODEL_TYPE_LABEL[item.type] ?? 'UNKNOWN'
              }}</span>
          </div>
          <div class="ain-card__status">
            <span :class="['ain-status-dot', { 'is-active': item.status === 1 }]"></span>
            <span class="ain-status-text">{{ item.status === 1 ? '启用' : '停用' }}</span>
          </div>
        </div>

        <!-- Card body -->
        <div class="ain-card__body">
          <div class="ain-card__key">
            <span class="ain-mono ain-key-code">{{ item.key }}</span>
          </div>
          <div class="ain-card__name">{{ item.name }}</div>
          <div class="ain-card__model-name">
            <span class="ain-chip">{{ item.modelName }}</span>
          </div>
          <div v-if="item.remark" class="ain-card__remark">{{ item.remark }}</div>
        </div>

        <!-- Card actions -->
        <div class="ain-card__foot">
          <button
            :class="['ain-card-btn', 'ain-card-btn--test', { 'is-testing': testingIds.has(item.id) }]"
            :disabled="item.type > 2 || testingIds.has(item.id)"
            @click="testConnection(item)"
          >
            <span v-if="testingIds.has(item.id)" class="ain-test-spinner"></span>
            <span v-else>⚡</span>
            {{ testingIds.has(item.id) ? '测试中…' : '连通性' }}
          </button>
          <button class="ain-card-btn ain-card-btn--edit" @click="showEdit(item)">编辑</button>
          <button class="ain-card-btn ain-card-btn--danger" @click="deleteRow(item)">删除</button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal (NaiveUI) -->
    <n-modal
      v-model:show="showModal"
      :title="editId ? '编辑模型配置' : '添加模型配置'"
      class="strix-form-modal"
      preset="card"
      size="huge"
      style="max-width: 720px"
      @after-leave="resetForm"
    >
      <ai-model-config-form
        ref="formRef"
        :edit-id="editId"
        :initial-data="editData"
        @saved="onSaved"
        @cancel="showModal = false"
      />
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import type { AiModelConfigResp } from '@/api/ai'
import { aiApi } from '@/api/ai'
import AiModelConfigForm from './AiModelConfigForm.vue'

const message = useMessage()
const dialog = useDialog()

const list = ref<AiModelConfigResp[]>([])
const loading = ref(false)
const showModal = ref(false)
const editId = ref('')
const editData = ref<AiModelConfigResp | null>(null)
const formRef = ref()
const keyword = ref('')
const filterType = ref<number | null>(null)
const testingIds = ref<Set<string>>(new Set())

const MODEL_TYPE_LABEL: Record<number, string> = {
  1: 'TEXT',
  2: 'VISION',
  3: 'TTS',
  4: 'STT',
  5: 'IMAGE',
  6: 'ASR'
}

const typeLegend: [number, string][] = [
  [1, 'TEXT'],
  [2, 'VISION'],
  [3, 'TTS'],
  [4, 'STT'],
  [5, 'IMAGE'],
  [6, 'ASR']
]

const typeOptions = Object.entries(MODEL_TYPE_LABEL).map(([v, l]) => ({
  label: l,
  value: Number(v)
}))

const filteredList = computed(() => {
  return list.value.filter((item) => {
    const matchKeyword = !keyword.value || item.name.includes(keyword.value) || item.key.includes(keyword.value)
    const matchType = filterType.value === null || item.type === filterType.value
    return matchKeyword && matchType
  })
})

const changeFilterType = (value: number | null) => {
  filterType.value = value
  loadList()
}

const loadList = () => {
  loading.value = true
  aiApi
    .modelConfigList()
    .then((res) => {
      list.value = (res.data?.data ?? []) as AiModelConfigResp[]
    })
    .finally(() => {
      loading.value = false
    })
}

const showAdd = () => {
  editId.value = ''
  editData.value = null
  showModal.value = true
}

const showEdit = (row: AiModelConfigResp) => {
  editId.value = row.id
  editData.value = row
  showModal.value = true
}

function onSaved() {
  showModal.value = false
  loadList()
}

function resetForm() {
  editId.value = ''
  editData.value = null
}

const clearSearch = () => {
  keyword.value = ''
  loadList()
}

function deleteRow(row: AiModelConfigResp) {
  dialog.warning({
    title: '确认删除',
    content: `确认删除模型配置「${row.name}」？`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: () => {
      aiApi.modelConfigRemove(row.id).then(() => {
        message.success('删除成功')
        loadList()
      })
    }
  })
}

async function testConnection(row: AiModelConfigResp) {
  if (testingIds.value.has(row.id)) return
  testingIds.value = new Set([...testingIds.value, row.id])
  try {
    const res = await aiApi.modelConfigTest(row.id)
    if (res.data?.code === 200) {
      message.success(res.data.data ?? '连通性测试通过')
    } else {
      message.error(res.data?.msg ?? '连通性测试失败')
    }
  } catch {
    message.error('连通性测试失败')
  } finally {
    const next = new Set(testingIds.value)
    next.delete(row.id)
    testingIds.value = next
  }
}

onMounted(() => loadList())
</script>

<style lang="scss" scoped>
.ai-nexus {
  padding: 4px 0;
}

/* ─── Header ─── */
.ain-header {
  margin-bottom: 20px;
}

.ain-header__brand {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
}

/* ─── Type legend (unique to AI page) ─── */
.ain-header__type-legend {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.ain-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--strix-text-secondary);
}

.ain-legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

/* Type colors */
.ain-type-dot--1, .ain-stripe--type1, .ain-type-badge--1 {
  --type-color: #70c0e8;
}

.ain-type-dot--2, .ain-stripe--type2, .ain-type-badge--2 {
  --type-color: #63e2b7;
}

.ain-type-dot--3, .ain-stripe--type3, .ain-type-badge--3 {
  --type-color: #f2c97d;
}

.ain-type-dot--4, .ain-stripe--type4, .ain-type-badge--4 {
  --type-color: #e88080;
}

.ain-type-dot--5, .ain-stripe--type5, .ain-type-badge--5 {
  --type-color: #c084fc;
}

.ain-type-dot--6, .ain-stripe--type6, .ain-type-badge--6 {
  --type-color: #fb923c;
}

.ain-legend-dot {
  background: var(--type-color, var(--strix-color-accent));
}

/* ─── Toolbar overrides ─── */
.ain-toolbar {
  justify-content: space-between;
  margin-bottom: 16px;
}

.ain-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.ain-search {
  flex: 1;
  min-width: 180px;
}

.ain-type-filter {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.ain-filter-btn {
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid var(--strix-border-default);
  background: transparent;
  color: var(--strix-text-secondary);
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--strix-border-accent);
    color: var(--strix-text-primary);
  }

  &.is-active {
    background: var(--strix-color-accent);
    border-color: var(--strix-color-accent);
    color: #06060e;
    font-weight: 600;
  }
}

.ain-filter-type--1.is-active {
  background: #70c0e8;
  border-color: #70c0e8;
}

.ain-filter-type--2.is-active {
  background: #63e2b7;
  border-color: #63e2b7;
}

.ain-filter-type--3.is-active {
  background: #f2c97d;
  border-color: #f2c97d;
}

.ain-filter-type--4.is-active {
  background: #e88080;
  border-color: #e88080;
}

.ain-filter-type--5.is-active {
  background: #c084fc;
  border-color: #c084fc;
}

.ain-filter-type--6.is-active {
  background: #fb923c;
  border-color: #fb923c;
}

/* ─── Grid ─── */
.ain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

/* ─── Card ─── */
.ain-card {
  position: relative;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-subtle);
  border-radius: 12px;
  overflow: hidden;
  animation: ain-card-in 0.35s var(--delay, 0s) both cubic-bezier(0.16, 1, 0.3, 1);
  transition: border-color 0.25s,
  transform 0.2s,
  box-shadow 0.25s;

  &:hover {
    border-color: var(--strix-border-accent);
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  }

  &--skeleton {
    animation: none;
    pointer-events: none;
  }
}

@keyframes ain-card-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.ain-skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: var(--strix-bg-surface-hover);
  margin: 12px 16px;
  animation: ain-skeleton 1.2s ease-in-out infinite;

  &--short {
    width: 40%;
  }

  &--med {
    width: 65%;
  }

  &--long {
    width: 85%;
  }
}

@keyframes ain-skeleton {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}

.ain-card__stripe {
  height: 3px;
  background: var(--type-color, var(--strix-color-accent));
  opacity: 0.7;
}

.ain-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
}

.ain-type-badge {
  font-family: 'Geist Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 2px 8px;
  border-radius: 100px;
  color: var(--type-color, var(--strix-color-accent));
  background: color-mix(in srgb, var(--type-color, var(--strix-color-accent)) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--type-color, var(--strix-color-accent)) 35%, transparent);
}

.ain-card__status {
  display: flex;
  align-items: center;
  gap: 5px;
}

.ain-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--strix-text-muted);
  opacity: 0.4;

  &.is-active {
    background: var(--strix-color-success);
    opacity: 1;
    animation: ain-pulse 2s ease-in-out infinite;
  }
}

.ain-status-text {
  font-size: 11px;
  color: var(--strix-text-secondary);
}

.ain-card__body {
  padding: 0 14px 14px;
}

.ain-key-code {
  font-size: 11px;
  color: var(--strix-text-accent);
  letter-spacing: 0.3px;
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  margin-bottom: 4px;
}

.ain-card__name {
  font-family: 'Outfit', 'Alimama FangYuanTi', 'PingFang SC', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--strix-text-primary);
  letter-spacing: -0.3px;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ain-chip {
  display: inline-block;
  font-family: 'Geist Mono', monospace;
  font-size: 11px;
  padding: 2px 8px;
  background: var(--strix-bg-surface-hover);
  border: 1px solid var(--strix-border-default);
  border-radius: 4px;
  color: var(--strix-text-secondary);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ain-card__model-name {
  margin-bottom: 6px;
}

.ain-card__remark {
  font-size: 12px;
  color: var(--strix-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.7;
}

.ain-card__foot {
  display: flex;
  gap: 6px;
  padding: 10px 14px 12px;
  border-top: 1px solid var(--strix-border-subtle);
}

.ain-card-btn {
  flex: 1;
  height: 28px;
  border-radius: 6px;
  border: 1px solid;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  &--test {
    color: var(--strix-color-info);
    border-color: color-mix(in srgb, var(--strix-color-info) 35%, transparent);
    background: transparent;

    &:hover:not(:disabled) {
      background: color-mix(in srgb, var(--strix-color-info) 10%, transparent);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &.is-testing {
      opacity: 0.7;
    }
  }

  &--edit {
    color: var(--strix-color-warning);
    border-color: color-mix(in srgb, var(--strix-color-warning) 35%, transparent);
    background: transparent;

    &:hover {
      background: color-mix(in srgb, var(--strix-color-warning) 10%, transparent);
    }
  }

  &--danger {
    color: var(--strix-color-error);
    border-color: color-mix(in srgb, var(--strix-color-error) 35%, transparent);
    background: transparent;

    &:hover {
      background: color-mix(in srgb, var(--strix-color-error) 10%, transparent);
    }
  }
}

.ain-test-spinner {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 1.5px solid transparent;
  border-top-color: var(--strix-color-info);
  border-right-color: var(--strix-color-info);
  border-radius: 50%;
  animation: ain-spin 0.6s linear infinite;
}

@keyframes ain-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ─── Empty ─── */
.ain-empty {
  grid-column: 1 / -1;
  padding: 80px 20px;
  text-align: center;
}

.ain-empty__glyph {
  font-size: 40px;
  color: var(--strix-text-muted);
  opacity: 0.25;
  margin-bottom: 12px;
}

.ain-empty__sub {
  margin-top: 8px;
  font-size: 13px;
  color: var(--strix-text-secondary);
}

.ain-dim {
  opacity: 0.35;
}
</style>
