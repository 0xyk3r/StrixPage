<template>
  <div class="doc-forge">
    <!-- ── Header ───────────────────────────────────────────── -->
    <header class="nbp-header">
      <div class="nbp-header__left">
        <div class="nbp-header__brand">
          <span class="nbp-pulse-dot"></span>
          <span class="nbp-mono-label">DOCUMENT_FORGE</span>
        </div>
        <h2 class="nbp-page-title">文档格式转换</h2>
        <p class="nbp-page-subtitle">支持 {{ convertTypes.length }} 种格式转换 · Excel / PDF / PPT / Word</p>
      </div>
      <div class="forge-header-stats">
        <div class="forge-stat">
          <span class="forge-stat__num">{{ activeTasks.length }}</span>
          <span class="forge-stat__lbl">ACTIVE</span>
        </div>
        <div class="forge-stat">
          <span class="forge-stat__num">{{ completedCount }}</span>
          <span class="forge-stat__lbl">DONE</span>
        </div>
      </div>
    </header>

    <!-- ── Workspace ────────────────────────────────────────── -->
    <div class="forge-workspace">
      <!-- ── LEFT PANEL: Config (sticky top) + Task Queue (scrollable) ── -->
      <div class="forge-left-panel">
        <!-- Config: stays put, never scrolls -->
        <div class="forge-config">
          <!-- Drop Zone -->
          <div
            class="forge-drop"
            :class="{ 'is-dragover': isDragover, 'has-file': !!selectedFile }"
            @dragover.prevent="isDragover = true"
            @dragleave="isDragover = false"
            @drop.prevent="handleDrop"
            @click="fileInputRef?.click()"
          >
            <input ref="fileInputRef" type="file" style="display: none" @change="handleFileSelect" />
            <div class="forge-drop__scan"></div>
            <div v-if="!selectedFile" class="forge-drop__empty">
              <div class="forge-drop__icon">⬇</div>
              <div class="forge-drop__title">拖入文件 或 点击选择</div>
              <div class="forge-drop__hint">XLSX · XLS · PDF · PPTX · PPT · DOCX · DOC</div>
            </div>
            <div v-else class="forge-drop__file">
              <div class="forge-drop__file-icon">{{ getFileIcon(selectedFile.name) }}</div>
              <div class="forge-drop__file-info">
                <div class="forge-drop__file-name">{{ selectedFile.name }}</div>
                <div class="forge-drop__file-size">{{ formatFileSize(selectedFile.size) }}</div>
              </div>
              <button class="forge-drop__clear" @click.stop="clearFile">✕</button>
            </div>
          </div>

          <!-- Type Picker -->
          <div class="forge-type-section">
            <div class="forge-section-label">
              <span class="nbp-mono-label">CONVERT_TO</span>
              <span v-if="selectedType" class="nbp-badge nbp-badge--teal">{{ selectedTypeInfo?.displayName }}</span>
            </div>
            <div class="forge-cat-tabs">
              <button
                v-for="cat in categories"
                :key="cat.id"
                class="forge-cat-tab"
                :class="{ 'is-active': activeCategory === cat.id, 'is-disabled': !isCatAvailable(cat.id) }"
                @click="activeCategory = cat.id"
              >
                {{ cat.label }}
              </button>
            </div>
            <div class="forge-types">
              <button
                v-for="type in filteredTypes"
                :key="type.code"
                class="forge-type-btn"
                :class="{
                  'is-selected': selectedType === type.code,
                  'is-disabled': !isTypeAvailable(type)
                }"
                @click="isTypeAvailable(type) && (selectedType = type.code)"
              >
                <span class="forge-type-ext">.{{ type.targetExtension }}</span>
                <span class="forge-type-name">{{ getShortName(type.displayName) }}</span>
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button
            class="forge-submit"
            :class="{ 'is-ready': canSubmit, 'is-loading': isSubmitting }"
            :disabled="!canSubmit || isSubmitting"
            @click="submitConvert"
          >
            <span v-if="!isSubmitting" class="forge-submit__label">
              <span class="forge-submit__arrow">▶</span>
              启动转换
            </span>
            <span v-else class="forge-submit__loading">
              <span class="nbp-spin">⟳</span>
              提交中…
            </span>
            <span class="forge-submit__scan"></span>
          </button>
        </div>

        <!-- Divider -->
        <div class="forge-panel-divider">
          <span class="nbp-mono-label">TASK_QUEUE</span>
          <button v-if="completedTasks.length" class="nbp-ctrl-btn" @click="clearCompleted">清除已完成</button>
        </div>

        <!-- Task Queue: scrollable region -->
        <div class="forge-queue-scroll">
          <div v-if="!tasks.length" class="forge-queue-empty">
            <div class="nbp-table-empty__icon">◎</div>
            <div class="nbp-mono-label nbp-dim">NO_TASKS</div>
            <div class="nbp-table-empty__sub">提交转换后任务将在此显示</div>
          </div>

          <transition-group name="forge-task" tag="div" class="forge-task-list">
            <div
              v-for="task in [...activeTasks, ...completedTasks]"
              :key="task.taskId"
              class="forge-task-card"
              :class="[`is-${task.status}`, { 'is-previewing': activePreviewTaskId === task.taskId }]"
            >
              <span class="nbp-hud-corner nbp-hud-corner--tl"></span>
              <span class="nbp-hud-corner nbp-hud-corner--br"></span>

              <div class="forge-task-head">
                <div class="forge-task-files">
                  <span class="forge-task-ext">{{ getFileExt(task.sourceFilename) }}</span>
                  <span class="forge-task-arrow">→</span>
                  <span class="forge-task-ext forge-task-ext--target">.{{ task.targetExtension }}</span>
                </div>
                <div class="forge-task-status" :class="`forge-task-status--${task.status}`">
                  {{ statusLabel(task.status) }}
                </div>
              </div>

              <div class="forge-task-filename">{{ task.sourceFilename }}</div>
              <div class="forge-task-msg">{{ task.message }}</div>

              <div class="forge-progress">
                <div
                  class="forge-progress__fill"
                  :style="{ width: Math.max(0, task.progress) + '%' }"
                  :class="{ 'is-error': task.status === 'failed', 'is-anim': task.status === 'processing' }"
                ></div>
              </div>
              <div class="forge-progress-pct">{{ task.progress < 0 ? 'ERR' : task.progress + '%' }}</div>

              <div v-if="task.status === 'completed'" class="forge-task-actions">
                <button class="nbp-op nbp-op--info" @click="previewTask(task)">
                  {{ activePreviewTaskId === task.taskId ? '关闭预览' : '预览' }}
                </button>
                <button class="nbp-op nbp-op--neutral" @click="downloadTask(task)">下载</button>
              </div>
            </div>
          </transition-group>
        </div>
      </div>

      <!-- ── RIGHT PANEL: Preview (always visible) ─────────── -->
      <div class="forge-right-panel">
        <!-- Empty State -->
        <div v-if="!previewData" class="forge-preview-placeholder">
          <div class="forge-preview-placeholder__icon">◈</div>
          <div class="nbp-mono-label nbp-dim" style="margin-top: 14px">PREVIEW_ZONE</div>
          <p class="forge-preview-placeholder__hint">转换完成后，点击任务卡片的「预览」按钮</p>
        </div>

        <!-- Active Preview -->
        <transition name="forge-preview-slide">
          <div v-if="previewData" key="preview" class="forge-preview">
            <div class="forge-preview__header">
              <span class="nbp-mono-label">PREVIEW</span>
              <span class="nbp-badge nbp-badge--info">{{ previewData.type.toUpperCase() }}</span>
              <button class="nbp-ctrl-btn" style="margin-left: auto" @click="closePreview">✕ 关闭</button>
            </div>

            <!-- Image Gallery -->
            <div v-if="previewData.type === 'images'" class="forge-preview-images">
              <div class="forge-img-toolbar">
                <span class="nbp-mono-label">{{ previewData.images!.length }} PAGES</span>
                <div class="forge-img-nav">
                  <button class="nbp-ctrl-btn" :disabled="imgPage <= 0" @click="imgPage--">‹</button>
                  <span class="forge-img-page">{{ imgPage + 1 }} / {{ previewData.images!.length }}</span>
                  <button class="nbp-ctrl-btn" :disabled="imgPage >= previewData.images!.length - 1" @click="imgPage++">
                    ›
                  </button>
                </div>
              </div>
              <div class="forge-img-viewer">
                <img :src="previewData.images![imgPage]" :alt="`Page ${imgPage + 1}`" class="forge-img-main" />
              </div>
              <!-- Thumbnail strip — width constrained, horizontally scrollable -->
              <div class="forge-img-strip">
                <img
                  v-for="(img, i) in previewData.images"
                  :key="i"
                  :src="img"
                  :ref="(el) => setThumbRef(el as Element | null, i)"
                  class="forge-img-thumb"
                  :class="{ 'is-active': imgPage === i }"
                  @click="imgPage = i"
                />
              </div>
            </div>

            <!-- PDF / HTML Iframe -->
            <div v-else-if="previewData.type === 'pdf' || previewData.type === 'html'" class="forge-preview-iframe">
              <iframe
                :src="previewData.blobUrl"
                :sandbox="previewData.type === 'html' ? 'allow-same-origin' : undefined"
                class="forge-iframe"
                frameborder="0"
              ></iframe>
            </div>

            <!-- Text / Code -->
            <div v-else-if="previewData.type === 'text'" class="forge-preview-text">
              <pre class="forge-code">{{ previewData.text }}</pre>
            </div>

            <!-- Download Only -->
            <div v-else class="forge-preview-download">
              <div class="nbp-table-empty__icon">{{ getFileIcon(previewData.filename ?? '') }}</div>
              <div class="forge-preview-download__name">{{ previewData.filename }}</div>
              <div class="nbp-table-empty__sub">此格式暂不支持在线预览，请下载后查看</div>
              <button
                class="nbp-btn nbp-btn--primary"
                style="margin-top: 20px"
                @click="downloadByUrl(previewData.downloadUrl!, previewData.filename!)"
              >
                ⬇ 下载文件
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import JSZip from 'jszip'
import { documentConvertApi, type DocumentConvertTypeItem } from '@/api/document-convert'

// ── Types ─────────────────────────────────────────────────────
type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface ConvertTask {
  taskId: string
  sourceFilename: string
  typeCode: string
  targetExtension: string
  status: TaskStatus
  progress: number
  message: string
  resultFilename?: string
  resultBlob?: Blob
}

interface PreviewData {
  type: 'images' | 'pdf' | 'html' | 'text' | 'download-only'
  images?: string[]
  blobUrl?: string
  text?: string
  filename?: string
  downloadUrl?: string
}

// ── State ─────────────────────────────────────────────────────
const convertTypes = ref<DocumentConvertTypeItem[]>([])
const selectedFile = ref<File | null>(null)
const selectedType = ref<string>('')
const isDragover = ref(false)
const isSubmitting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const tasks = ref<ConvertTask[]>([])
const previewData = ref<PreviewData | null>(null)
const activePreviewTaskId = ref<string | null>(null)
const imgPage = ref(0)
const activeCategory = ref<string>('excel')
// Thumbnail element refs for auto-scroll
const imgThumbEls = ref<(HTMLImageElement | null)[]>([])

function setThumbRef(el: Element | null, index: number) {
  if (el instanceof HTMLImageElement || el === null) {
    imgThumbEls.value[index] = el
  }
}

watch(imgPage, (newPage) => {
  nextTick(() => {
    imgThumbEls.value[newPage]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  })
})

// ── Computed ──────────────────────────────────────────────────
const activeTasks = computed(() => tasks.value.filter((t) => t.status !== 'completed' && t.status !== 'failed'))
const completedTasks = computed(() => tasks.value.filter((t) => t.status === 'completed' || t.status === 'failed'))
const completedCount = computed(() => tasks.value.filter((t) => t.status === 'completed').length)
const canSubmit = computed(() => !!selectedFile.value && !!selectedType.value && !isSubmitting.value)

const categories = [
  { id: 'excel', label: 'Excel' },
  { id: 'pdf', label: 'PDF' },
  { id: 'ppt', label: 'PPT' },
  { id: 'word', label: 'Word' }
]

const categoryExtMap: Record<string, string[]> = {
  excel: ['xlsx', 'xls'],
  pdf: ['pdf'],
  ppt: ['pptx', 'ppt'],
  word: ['docx', 'doc']
}

const typePrefixMap: Record<string, string> = {
  excel: 'CELLS',
  pdf: 'PDF',
  ppt: 'SLIDES',
  word: 'WORDS'
}

const filteredTypes = computed(() =>
  convertTypes.value.filter((t) => t.code.startsWith(typePrefixMap[activeCategory.value] ?? ''))
)

const selectedTypeInfo = computed(() => convertTypes.value.find((t) => t.code === selectedType.value))

const fileExt = computed(() => {
  if (!selectedFile.value) return ''
  return selectedFile.value.name.split('.').pop()?.toLowerCase() ?? ''
})

// ── Helpers ────────────────────────────────────────────────────
function getFileExt(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return ext ? `.${ext}` : '?'
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    xlsx: '📊',
    xls: '📊',
    csv: '📊',
    pdf: '📄',
    pptx: '📑',
    ppt: '📑',
    docx: '📝',
    doc: '📝',
    html: '🌐',
    md: '📃',
    png: '🖼',
    zip: '📦'
  }
  return map[ext] ?? '📁'
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function getShortName(displayName: string) {
  return displayName
    .replace(/Excel|PDF|演示文稿|Word|全部/g, '')
    .replace('转', '→')
    .trim()
}

function isCatAvailable(catId: string) {
  if (!selectedFile.value) return true
  return categoryExtMap[catId]?.includes(fileExt.value) ?? false
}

function isTypeAvailable(type: DocumentConvertTypeItem) {
  if (!selectedFile.value) return true
  const prefix = typePrefixMap[activeCategory.value]
  return type.code.startsWith(prefix ?? '') && (categoryExtMap[activeCategory.value]?.includes(fileExt.value) ?? false)
}

function statusLabel(status: TaskStatus) {
  const map: Record<TaskStatus, string> = {
    pending: 'QUEUED',
    processing: 'FORGING',
    completed: 'DONE',
    failed: 'ERROR'
  }
  return map[status]
}

// ── File Handling ─────────────────────────────────────────────
function handleDrop(e: DragEvent) {
  isDragover.value = false
  const file = e.dataTransfer?.files[0]
  if (file) selectFile(file)
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) selectFile(file)
}

function selectFile(file: File) {
  selectedFile.value = file
  selectedType.value = ''
  // Auto-switch category
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  for (const [catId, exts] of Object.entries(categoryExtMap)) {
    if (exts.includes(ext)) {
      activeCategory.value = catId
      break
    }
  }
}

function clearFile() {
  selectedFile.value = null
  selectedType.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// ── Submit ─────────────────────────────────────────────────────
async function submitConvert() {
  if (!canSubmit.value) return
  isSubmitting.value = true
  try {
    const { data: res } = await documentConvertApi.submit(selectedFile.value!, selectedType.value)
    const typeInfo = convertTypes.value.find((t) => t.code === selectedType.value)
    const task: ConvertTask = {
      taskId: res.data.taskId,
      sourceFilename: selectedFile.value!.name,
      typeCode: selectedType.value,
      targetExtension: typeInfo?.targetExtension ?? '',
      status: 'pending',
      progress: 0,
      message: '等待处理...'
    }
    tasks.value.unshift(task)
    clearFile()
    connectSSE(task)
  } finally {
    isSubmitting.value = false
  }
}

// ── SSE ────────────────────────────────────────────────────────
function connectSSE(task: ConvertTask) {
  const url = `/api/system/tool/document/convert/progress/${task.taskId}`
  const es = new EventSource(url)

  es.addEventListener('progress', (e) => {
    const data = JSON.parse((e as MessageEvent).data)
    const t = tasks.value.find((t) => t.taskId === task.taskId)
    if (!t) return

    t.progress = data.progress
    t.message = data.message ?? ''

    if (data.status === 'PROCESSING') {
      t.status = 'processing'
    } else if (data.status === 'COMPLETED') {
      t.status = 'completed'
      t.resultFilename = data.filename
      es.close()
    } else if (data.status === 'FAILED') {
      t.status = 'failed'
      es.close()
    }
  })

  es.onerror = () => {
    const t = tasks.value.find((t) => t.taskId === task.taskId)
    if (t && t.status !== 'completed' && t.status !== 'failed') {
      t.status = 'failed'
      t.message = 'SSE 连接断开'
    }
    es.close()
  }
}

// ── Preview ────────────────────────────────────────────────────
async function previewTask(task: ConvertTask) {
  if (activePreviewTaskId.value === task.taskId) {
    closePreview()
    return
  }
  activePreviewTaskId.value = task.taskId
  imgPage.value = 0
  imgThumbEls.value = [] // reset thumbnail refs for new preview

  // If we already have the blob, use it; otherwise download
  let blob = task.resultBlob
  if (!blob) {
    const { data } = await documentConvertApi.downloadResult(task.taskId)
    blob = data as Blob
    task.resultBlob = blob
  }

  const ext = task.targetExtension

  if (ext === 'zip') {
    // Extract images from ZIP
    const zip = await JSZip.loadAsync(blob)
    const images: string[] = []
    const sortedFiles = Object.keys(zip.files).sort()
    for (const filename of sortedFiles) {
      const file = zip.files[filename]
      if (file && !file.dir && filename.match(/\.png$/i)) {
        const imgBlob = await file.async('blob')
        // Filter out very small/blank images (< 1KB likely means empty rendered sheet)
        if (imgBlob.size < 1024) continue
        images.push(URL.createObjectURL(imgBlob))
      }
    }
    previewData.value = { type: 'images', images }
  } else if (ext === 'pdf') {
    const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    previewData.value = { type: 'pdf', blobUrl }
  } else if (ext === 'html') {
    const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'text/html' }))
    previewData.value = { type: 'html', blobUrl }
  } else if (ext === 'md' || ext === 'csv') {
    const text = await blob.text()
    previewData.value = { type: 'text', text }
  } else {
    const blobUrl = URL.createObjectURL(blob)
    previewData.value = {
      type: 'download-only',
      filename: task.resultFilename ?? `result.${ext}`,
      downloadUrl: blobUrl
    }
  }
}

function closePreview() {
  activePreviewTaskId.value = null
  previewData.value = null
}

function downloadTask(task: ConvertTask) {
  if (task.resultBlob) {
    downloadByUrl(URL.createObjectURL(task.resultBlob), task.resultFilename ?? `result.${task.targetExtension}`)
  } else {
    documentConvertApi.downloadResult(task.taskId).then(({ data }) => {
      task.resultBlob = data as Blob
      downloadByUrl(URL.createObjectURL(task.resultBlob), task.resultFilename ?? `result.${task.targetExtension}`)
    })
  }
}

function downloadByUrl(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

function clearCompleted() {
  if (activePreviewTaskId.value) {
    const task = completedTasks.value.find((t) => t.taskId === activePreviewTaskId.value)
    if (task) closePreview()
  }
  tasks.value = tasks.value.filter((t) => t.status !== 'completed' && t.status !== 'failed')
}

// ── Init ───────────────────────────────────────────────────────
onMounted(async () => {
  const { data: res } = await documentConvertApi.getTypes()
  convertTypes.value = res.data
})
</script>

<style lang="scss" scoped>
// ── Page container ─────────────────────────────────────────────
.doc-forge {
  padding: 4px 0 32px;
}

// ── Workspace: two columns ─────────────────────────────────────
.forge-workspace {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

// ── Left panel ────────────────────────────────────────────────
// Config (sticky top) + scrollable task queue below
.forge-left-panel {
  width: 420px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

// ── Header Stats ──────────────────────────────────────────────
.forge-header-stats {
  display: flex;
  gap: 20px;
}

.forge-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  &__num {
    font-family: 'Outfit', 'Geist Mono', monospace;
    font-size: 36px;
    font-weight: 800;
    line-height: 1;
    color: var(--strix-color-accent);
    opacity: 0.22;
  }

  &__lbl {
    font-family: 'Geist Mono', monospace;
    font-size: 9px;
    letter-spacing: 3px;
    color: var(--strix-text-muted);
    opacity: 0.5;
  }
}

// ── Config area (upload + types + submit) — never scrolls ─────
.forge-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 12px;
}

// ── Drop Zone ─────────────────────────────────────────────────
.forge-drop {
  position: relative;
  height: 148px;
  border: 1.5px dashed var(--strix-border-default);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  background: var(--strix-bg-surface);
  transition:
    border-color 0.25s,
    background 0.25s;

  &:hover,
  &.is-dragover {
    border-color: var(--strix-color-accent);
    background: var(--strix-accent-glow-subtle);

    .forge-drop__scan {
      opacity: 1;
    }
  }

  &.has-file {
    border-style: solid;
    border-color: var(--strix-border-accent);
    background: var(--strix-accent-glow-subtle);
  }

  &__scan {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      transparent 0%,
      color-mix(in srgb, var(--strix-color-accent) 6%, transparent) 50%,
      transparent 100%
    );
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
    animation: forge-scan 2.5s linear infinite;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
  }

  &__icon {
    font-size: 24px;
    color: var(--strix-text-muted);
    opacity: 0.4;
  }

  &__title {
    font-family: 'Outfit', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--strix-text-secondary);
  }

  &__hint {
    font-family: 'Geist Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 1px;
    color: var(--strix-text-muted);
    opacity: 0.55;
  }

  &__file {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 0 18px;
    width: 100%;
  }

  &__file-icon {
    font-size: 28px;
    flex-shrink: 0;
  }

  &__file-info {
    flex: 1;
    min-width: 0;
  }

  &__file-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--strix-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__file-size {
    font-family: 'Geist Mono', monospace;
    font-size: 11px;
    color: var(--strix-color-accent);
    margin-top: 2px;
    opacity: 0.8;
  }

  &__clear {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid var(--strix-border-default);
    background: var(--strix-bg-base);
    color: var(--strix-text-muted);
    font-size: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    z-index: 2;

    &:hover {
      border-color: var(--strix-color-error);
      color: var(--strix-color-error);
    }
  }
}

@keyframes forge-scan {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(200%);
  }
}

// ── Type Section ──────────────────────────────────────────────
.forge-type-section {
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-subtle);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.forge-section-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.forge-cat-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.forge-cat-tab {
  height: 26px;
  padding: 0 13px;
  border-radius: 100px;
  border: 1px solid var(--strix-border-default);
  background: transparent;
  color: var(--strix-text-secondary);
  font-family: 'Geist Mono', monospace;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(.is-disabled) {
    border-color: var(--strix-border-accent);
    color: var(--strix-text-primary);
  }

  &.is-active {
    background: var(--strix-accent-glow-subtle);
    border-color: var(--strix-border-accent);
    color: var(--strix-color-accent);
  }

  &.is-disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.forge-types {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.forge-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 9px 6px;
  border-radius: 10px;
  border: 1px solid var(--strix-border-default);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(.is-disabled) {
    border-color: var(--strix-border-accent);
    background: var(--strix-bg-surface-hover);
  }

  &.is-selected {
    border-color: var(--strix-color-accent);
    background: var(--strix-accent-glow-subtle);
    box-shadow: 0 0 12px var(--strix-accent-glow-subtle);

    .forge-type-ext {
      color: var(--strix-color-accent);
    }

    .forge-type-name {
      color: var(--strix-text-primary);
    }
  }

  &.is-disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.forge-type-ext {
  font-family: 'Geist Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  color: var(--strix-text-muted);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  transition: color 0.2s;
}

.forge-type-name {
  font-size: 9.5px;
  color: var(--strix-text-secondary);
  text-align: center;
  transition: color 0.2s;
}

// ── Submit Button ─────────────────────────────────────────────
.forge-submit {
  position: relative;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--strix-border-default);
  background: var(--strix-bg-surface);
  color: var(--strix-text-muted);
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: not-allowed;
  overflow: hidden;
  transition: all 0.3s;
  width: 100%;

  &.is-ready {
    border-color: var(--strix-color-accent);
    background: var(--strix-accent-glow-subtle);
    color: var(--strix-color-accent);
    cursor: pointer;
    box-shadow: 0 4px 20px color-mix(in srgb, var(--strix-color-accent) 12%, transparent);

    &:hover {
      background: color-mix(in srgb, var(--strix-color-accent) 15%, transparent);

      .forge-submit__scan {
        animation: forge-btn-scan 0.8s ease-in-out;
      }
    }

    &:active {
      transform: scale(0.99);
    }
  }

  &__label,
  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  &__loading {
    opacity: 0.7;
  }

  &__arrow {
    font-size: 12px;
  }

  &__scan {
    position: absolute;
    top: 0;
    left: -60px;
    width: 60px;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--strix-color-accent) 20%, transparent),
      transparent
    );
    pointer-events: none;
  }
}

@keyframes forge-btn-scan {
  from {
    left: -60px;
  }
  to {
    left: calc(100% + 60px);
  }
}

// ── Panel Divider (between config and task queue) ─────────────
.forge-panel-divider {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 2px 8px;
  border-top: 1px solid var(--strix-border-subtle);
  margin-top: 4px;
}

// ── Task Queue (scrollable) ────────────────────────────────────
.forge-queue-scroll {
  overflow-y: auto;
  max-height: 380px;

  // Custom scrollbar
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--strix-border-default);
    border-radius: 2px;
  }
}

.forge-queue-empty {
  padding: 32px 20px;
  text-align: center;
}

.forge-task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 2px 2px 4px;
}

// ── Task Card ─────────────────────────────────────────────────
.forge-task-card {
  position: relative;
  padding: 12px 14px;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-subtle);
  border-radius: 10px;
  transition: border-color 0.25s;

  &.is-processing {
    border-color: var(--strix-border-accent);
  }

  &.is-completed {
    border-color: color-mix(in srgb, var(--strix-color-accent) 15%, transparent);
  }

  &.is-failed {
    border-color: color-mix(in srgb, var(--strix-color-error) 20%, transparent);
  }

  &.is-previewing {
    border-color: var(--strix-color-accent);
    box-shadow: 0 0 0 1px var(--strix-border-accent);
  }
}

.forge-task-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
}

.forge-task-files {
  display: flex;
  align-items: center;
  gap: 5px;
}

.forge-task-ext {
  font-family: 'Geist Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  color: var(--strix-text-muted);
  background: var(--strix-bg-elevated);
  border: 1px solid var(--strix-border-default);
  border-radius: 4px;
  padding: 1px 5px;
  text-transform: uppercase;

  &--target {
    color: var(--strix-color-accent);
    border-color: var(--strix-border-accent);
    background: var(--strix-accent-glow-subtle);
  }
}

.forge-task-arrow {
  color: var(--strix-text-muted);
  font-size: 12px;
}

.forge-task-status {
  font-family: 'Geist Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 2px 7px;
  border-radius: 100px;
  border: 1px solid;

  &--pending {
    color: var(--strix-text-muted);
    border-color: var(--strix-border-default);
    background: transparent;
  }

  &--processing {
    color: var(--strix-color-info);
    border-color: color-mix(in srgb, var(--strix-color-info) 35%, transparent);
    background: color-mix(in srgb, var(--strix-color-info) 10%, transparent);
    animation: forge-pulse-badge 2s ease-in-out infinite;
  }

  &--completed {
    color: var(--strix-color-accent);
    border-color: var(--strix-border-accent);
    background: var(--strix-accent-glow-subtle);
  }

  &--failed {
    color: var(--strix-color-error);
    border-color: color-mix(in srgb, var(--strix-color-error) 35%, transparent);
    background: color-mix(in srgb, var(--strix-color-error) 10%, transparent);
  }
}

@keyframes forge-pulse-badge {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.forge-task-filename {
  font-size: 12px;
  font-weight: 500;
  color: var(--strix-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 3px;
}

.forge-task-msg {
  font-family: 'Geist Mono', monospace;
  font-size: 9.5px;
  color: var(--strix-text-muted);
  margin-bottom: 9px;
  height: 13px;
  overflow: hidden;
}

// ── Progress Bar ──────────────────────────────────────────────
.forge-progress {
  height: 3px;
  background: var(--strix-border-subtle);
  border-radius: 100px;
  overflow: hidden;
  margin-bottom: 4px;

  &__fill {
    height: 100%;
    background: var(--strix-color-accent);
    border-radius: 100px;
    transition: width 0.4s ease;

    &.is-error {
      background: var(--strix-color-error);
    }

    &.is-anim {
      background: linear-gradient(
        90deg,
        var(--strix-color-accent),
        color-mix(in srgb, var(--strix-color-info) 50%, var(--strix-color-accent)),
        var(--strix-color-accent)
      );
      background-size: 200% 100%;
      animation: forge-progress-shimmer 1.5s linear infinite;
    }
  }
}

@keyframes forge-progress-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

.forge-progress-pct {
  font-family: 'Geist Mono', monospace;
  font-size: 9px;
  color: var(--strix-text-muted);
  text-align: right;
  margin-bottom: 7px;
}

.forge-task-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

// ── Task card transitions ─────────────────────────────────────
.forge-task-enter-active {
  animation: forge-task-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.forge-task-leave-active {
  animation: forge-task-out 0.3s ease forwards;
}

@keyframes forge-task-in {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes forge-task-out {
  to {
    opacity: 0;
    transform: scale(0.96);
  }
}

// ── Right panel ───────────────────────────────────────────────
.forge-right-panel {
  flex: 1;
  min-width: 0; // ← critical: prevents flex child from overflowing
  display: flex;
  flex-direction: column;
  min-height: 480px;
  position: relative;
}

// ── Preview Placeholder (no preview) ─────────────────────────
.forge-preview-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--strix-bg-surface);
  border: 1.5px dashed var(--strix-border-default);
  border-radius: 14px;
  padding: 60px 20px;
  text-align: center;
  min-height: 480px;
  transition: border-color 0.25s;

  &__icon {
    font-size: 40px;
    color: var(--strix-text-muted);
    opacity: 0.15;
  }

  &__hint {
    font-size: 13px;
    color: var(--strix-text-muted);
    margin-top: 8px;
  }
}

// ── Active preview transitions ────────────────────────────────
.forge-preview-slide-enter-active {
  animation: forge-preview-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.forge-preview-slide-leave-active {
  animation: forge-preview-out 0.3s ease forwards;
}

@keyframes forge-preview-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes forge-preview-out {
  to {
    opacity: 0;
    transform: translateY(-6px);
  }
}

// ── Preview Panel ─────────────────────────────────────────────
.forge-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-subtle);
  border-radius: 14px;
  overflow: hidden;
  min-height: 480px;
  width: 100%; // ← ensure it doesn't over-expand

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 18px;
    border-bottom: 1px solid var(--strix-border-subtle);
    background: var(--strix-bg-elevated);
    flex-shrink: 0;
  }
}

// ── Image Preview ─────────────────────────────────────────────
.forge-preview-images {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  width: 100%;
  min-width: 0; // ← key: prevent flex item from expanding to content
}

.forge-img-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--strix-border-subtle);
  flex-shrink: 0;
}

.forge-img-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.forge-img-page {
  font-family: 'Geist Mono', monospace;
  font-size: 12px;
  color: var(--strix-text-secondary);
  min-width: 56px;
  text-align: center;
}

.forge-img-viewer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 16px;
  min-height: 260px;
  background: repeating-conic-gradient(
      color-mix(in srgb, var(--strix-text-muted) 4%, transparent) 0% 25%,
      transparent 0% 50%
    )
    0 0 / 20px 20px;
}

.forge-img-main {
  max-width: 100%;
  max-height: 480px;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

// ── Thumbnail strip — the key overflow fix ──────────────────
.forge-img-strip {
  // Must be constrained to parent width and scroll horizontally
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--strix-border-subtle);
  flex-shrink: 0;
  box-sizing: border-box; // ← include padding in width calculation

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--strix-border-default);
    border-radius: 2px;
  }
}

.forge-img-thumb {
  width: 64px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
  border: 1.5px solid var(--strix-border-subtle);
  cursor: pointer;
  flex-shrink: 0; // ← CRITICAL: don't shrink, let strip scroll
  transition:
    border-color 0.2s,
    opacity 0.2s;
  opacity: 0.6;

  &.is-active {
    border-color: var(--strix-color-accent);
    opacity: 1;
  }

  &:hover {
    opacity: 1;
  }
}

// ── Iframe Preview ────────────────────────────────────────────
.forge-preview-iframe {
  flex: 1;
  display: flex;
  min-height: 0;
}

.forge-iframe {
  width: 100%;
  min-height: 480px;
  border: none;
  background: #fff;
}

// ── Text Preview ──────────────────────────────────────────────
.forge-preview-text {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.forge-code {
  font-family: 'Geist Mono', monospace;
  font-size: 12px;
  color: var(--strix-text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.7;
  margin: 0;
}

// ── Download Only ─────────────────────────────────────────────
.forge-preview-download {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;

  &__name {
    font-family: 'Outfit', system-ui, sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: var(--strix-text-primary);
    margin: 12px 0 4px;
  }
}

// ── Responsive ────────────────────────────────────────────────
@media (max-width: 1100px) {
  .forge-workspace {
    flex-direction: column;
  }

  .forge-left-panel {
    width: 100%;
  }

  .forge-queue-scroll {
    max-height: 300px;
  }

  .forge-right-panel {
    min-height: 400px;
  }
}
</style>
