<script lang="ts" setup>
import type {
  DocumentAiModelItem,
  DocumentAiSubmitResp,
  SseBatchChunkData,
  SseBatchDoneData,
  SseBatchErrorData,
  SseMergeChunkData,
  SseStageData
} from '@/api/documentAiAnalyze'
import { documentAiAnalyzeApi } from '@/api/documentAiAnalyze'
import StrixAutoScroll from '@/components/common/StrixAutoScroll.vue'
import StrixStreamMarkdown from '@/components/common/StrixStreamMarkdown.vue'
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Columns2,
  Copy,
  Cpu,
  FileText,
  GitMerge,
  Grid3x3,
  Image as ImageIcon,
  LayoutList,
  Upload,
  X
} from '@lucide/vue'

// ============================================================
//  Settings state
// ============================================================

const visionModels = ref<DocumentAiModelItem[]>([])
const textModels = ref<DocumentAiModelItem[]>([])
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const visionModelKey = ref<string | null>(null)
const textModelKey = ref<string | null>(null)
const prompt = ref('')
const batchSize = ref(1)
const enableMerge = ref(true)

// ============================================================
//  Analysis state
// ============================================================

const isAnalyzing = ref(false)
const submitResp = ref<DocumentAiSubmitResp | null>(null)

type BatchStatus = 'pending' | 'streaming' | 'done' | 'error'
type AnalysisStage = 'CONVERTING' | 'ANALYZING' | 'MERGING' | 'DONE' | 'ERROR' | ''

interface BatchState {
  index: number
  pageRange: string
  pageRangeIndices: [number, number]
  content: string
  status: BatchStatus
  errorMessage?: string
  collapsed: boolean
}

const batches = ref<BatchState[]>([])
const mergeContent = ref('')
const mergeStatus = ref<'idle' | 'streaming' | 'done'>('idle')
const currentStage = ref<AnalysisStage>('')

// ============================================================
//  Terminal log
// ============================================================

interface LogEntry {
  time: string
  text: string
  type: 'info' | 'success' | 'error' | 'warn'
}

const logEntries = ref<LogEntry[]>([])
const terminalExpanded = ref(true)

function addLog(text: string, type: LogEntry['type'] = 'info') {
  logEntries.value.push({ time: new Date().toLocaleTimeString('zh-CN', { hour12: false }), text, type })
}

// ============================================================
//  Tabs
// ============================================================

type TabName = 'agents' | 'result' | 'gallery'
const activeTab = ref<TabName>('agents')

const agentsDoneCount = computed(() => batches.value.filter((b) => b.status === 'done' || b.status === 'error').length)
const agentsStreamingCount = computed(() => batches.value.filter((b) => b.status === 'streaming').length)

// 标签状态色：模板内多处复用，用 computed 缓存避免每次渲染重复遍历 batches
const agentsTabColor = computed(() => {
  if (!batches.value.length) return 'idle'
  if (agentsDoneCount.value === batches.value.length) return 'done'
  if (agentsStreamingCount.value > 0) return 'active'
  return 'pending'
})

// ============================================================
//  Grid layout
// ============================================================

const gridCols = ref<1 | 2 | 3>(3)

// ============================================================
//  Gallery
// ============================================================

const galleryRef = ref<HTMLElement | null>(null)

function scrollToGalleryPage(pageIndex: number) {
  activeTab.value = 'gallery'
  nextTick(() => {
    const el = document.getElementById(`gp-${pageIndex}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function getPageImageUrl(pageIndex: number): string {
  if (!submitResp.value) return ''
  return documentAiAnalyzeApi.getPageImageUrl(submitResp.value.taskId, pageIndex)
}

// ============================================================
//  Hover expand (floating overlay)
// ============================================================

const expandedBatch = ref<number | null>(null)
const tooltipBatch = ref<number | null>(null)
const cardRefs = new Map<number, HTMLElement>()
const hoverTimers = new Map<number, ReturnType<typeof setTimeout>>()

// 卡片悬浮触发延迟（准星收拢动画时长与之同步，单一数据源）
const CARD_HOVER_DELAY = 650

function setCardRef(el: HTMLElement | null, idx: number) {
  if (el) cardRefs.set(idx, el)
  else cardRefs.delete(idx)
}

function onCardMouseEnter(idx: number) {
  // 已在等待期内（如从 meta 滑入 body）则忽略，避免重设计时器使准星进度与触发时机错位
  if (tooltipBatch.value === idx && hoverTimers.has(idx)) return
  // 清除该卡片可能残留的定时器，避免重复触发堆积
  const existing = hoverTimers.get(idx)
  if (existing) clearTimeout(existing)
  tooltipBatch.value = idx
  const timer = setTimeout(() => {
    if (tooltipBatch.value === idx) {
      tooltipBatch.value = null
      expandedBatch.value = idx
    }
  }, CARD_HOVER_DELAY)
  hoverTimers.set(idx, timer)
}

function onCardMouseLeave(idx: number) {
  const timer = hoverTimers.get(idx)
  if (timer) {
    clearTimeout(timer)
    hoverTimers.delete(idx)
  }
  tooltipBatch.value = null
  // Don't collapse expanded — overlay handles its own mouseleave
}

function closeExpanded() {
  // 放大图片显示时，不关闭下方浮层
  if (zoomPageIndex.value !== null) return
  expandedBatch.value = null
}

const expandedCardRef = ref<HTMLElement | null>(null)

// 浮层内容区自动滚动（由 StrixAutoScroll 承担粘底逻辑）
const overlayScrollRef = ref<InstanceType<typeof StrixAutoScroll> | null>(null)

// 打开浮层时：流式中跟随底部，已完成/出错则从顶部展示
watch(expandedBatch, (val) => {
  if (val === null) return
  const batch = batches.value[val]
  nextTick(() => {
    if (batch && batch.status === 'streaming') overlayScrollRef.value?.scrollToBottom(true)
    else overlayScrollRef.value?.scrollToTop()
  })
})

// ── 图片放大（共享 lightbox，浮层缩略图与画廊通用）──
const zoomPageIndex = ref<number | null>(null)
const zoomPinned = ref(false)
// 悬浮需持续一段时间才弹出，避免划过时误触发
const ZOOM_HOVER_DELAY = 500
let zoomHoverTimer: ReturnType<typeof setTimeout> | null = null
// 悬浮等待期内正在「锁定」的图片页码，用于渲染准星进度提示（null 表示无）
const reticlePage = ref<number | null>(null)

function clearZoomHoverTimer() {
  if (zoomHoverTimer) {
    clearTimeout(zoomHoverTimer)
    zoomHoverTimer = null
  }
  reticlePage.value = null
}

function previewImage(pi: number) {
  if (zoomPinned.value) return
  clearZoomHoverTimer()
  // 已有预览显示时直接切换，否则延迟弹出
  if (zoomPageIndex.value !== null) {
    zoomPageIndex.value = pi
    return
  }
  reticlePage.value = pi
  zoomHoverTimer = setTimeout(() => {
    zoomHoverTimer = null
    reticlePage.value = null
    if (!zoomPinned.value) zoomPageIndex.value = pi
  }, ZOOM_HOVER_DELAY)
}

function endPreview() {
  clearZoomHoverTimer()
  if (!zoomPinned.value) zoomPageIndex.value = null
}

function pinImage(pi: number) {
  clearZoomHoverTimer()
  zoomPageIndex.value = pi
  zoomPinned.value = true
}

function closeZoom() {
  clearZoomHoverTimer()
  zoomPageIndex.value = null
  zoomPinned.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (zoomPageIndex.value !== null) closeZoom()
  else if (expandedBatch.value !== null) closeExpanded()
}

// Compute transform-origin for expanded card animation
const expandedOriginStyle = computed(() => {
  if (expandedBatch.value === null) return {}
  const el = cardRefs.get(expandedBatch.value)
  if (!el) return {}
  const rect = el.getBoundingClientRect()
  const originX = rect.left + rect.width / 2
  const originY = rect.top + rect.height / 2
  return { transformOrigin: `${originX}px ${originY}px` }
})

const expandedBatchData = computed(() =>
  expandedBatch.value !== null ? (batches.value[expandedBatch.value] ?? null) : null
)

// ============================================================
//  Computed / helpers
// ============================================================

const message = useMessage()

// 开启合并时未选文本模型（后端要求 merge=true 时 textModelKey 必填）
const mergeModelMissing = computed(() => enableMerge.value && !textModelKey.value)

const canSubmit = computed(
  () =>
    !!selectedFile.value &&
    !!visionModelKey.value &&
    prompt.value.trim().length > 0 &&
    !mergeModelMissing.value &&
    !isAnalyzing.value
)

const showMergeWarning = computed(() => !enableMerge.value && (submitResp.value?.totalBatches ?? 0) > 1)

const hasStarted = computed(() => logEntries.value.length > 0)

const visionModelOptions = computed(() => visionModels.value.map((m) => ({ label: m.name, value: m.key })))
const textModelOptions = computed(() => textModels.value.map((m) => ({ label: m.name, value: m.key })))

const ACCEPTED_EXTS = ['.doc', '.docx', '.pdf', '.ppt', '.pptx', '.xls', '.xlsx']

const fileExtColor: Record<string, string> = {
  pdf: '#e88080',
  doc: '#70c0e8',
  docx: '#70c0e8',
  ppt: '#f2c97d',
  pptx: '#f2c97d',
  xls: '#63e2b7',
  xlsx: '#63e2b7'
}

const getFileExt = (name: string) => name.split('.').pop()?.toUpperCase() ?? 'FILE'
const getFileExtColor = (name: string) => fileExtColor[name.split('.').pop()?.toLowerCase() ?? ''] ?? '#888'
const formatFileSize = (b: number) => (b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`)

const quickPrompts = [
  { label: '全文解析', text: '请详细解析文档全部内容，提取关键信息和主要观点，以结构化的 Markdown 格式输出分析报告。' },
  { label: '内容摘要', text: '请对文档内容进行摘要，突出重点信息，给出简洁清晰的总结。' },
  { label: '信息提取', text: '请提取文档中的关键数据、表格信息和重要事项，以列表形式呈现。' },
  { label: '质量审查', text: '请对文档内容进行审查，指出潜在问题、逻辑不一致之处和改进建议。' }
]

// ============================================================
//  Init
// ============================================================

onMounted(async () => {
  try {
    const [vRes, tRes] = await Promise.all([
      documentAiAnalyzeApi.listVisionModels(),
      documentAiAnalyzeApi.listTextModels()
    ])
    visionModels.value = vRes.data.data ?? []
    textModels.value = tRes.data.data ?? []
  } catch {
    message.error('加载模型列表失败')
  }
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  closeSSE()
  clearCollapseTimer()
  hoverTimers.forEach((t) => clearTimeout(t))
  clearZoomHoverTimer()
  window.removeEventListener('keydown', onKeydown)
})

// ============================================================
//  File handling
// ============================================================

function selectFile(file: File) {
  if (!ACCEPTED_EXTS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
    message.error(`不支持的文件格式，支持：${ACCEPTED_EXTS.join(' ')}`)
    return
  }
  selectedFile.value = file
}

function handleInputChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) selectFile(f)
  ;
  (e.target as HTMLInputElement).value = ''
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) selectFile(f)
}

// ============================================================
//  Analysis flow
// ============================================================

let eventSource: EventSource | null = null
// 任务完成后延迟折叠终端的定时器句柄（卸载/重置时需清理）
let collapseTimer: ReturnType<typeof setTimeout> | null = null

function clearCollapseTimer() {
  if (collapseTimer) {
    clearTimeout(collapseTimer)
    collapseTimer = null
  }
}

function resetResults() {
  clearCollapseTimer()
  batches.value = []
  mergeContent.value = ''
  mergeStatus.value = 'idle'
  logEntries.value = []
  submitResp.value = null
  activeTab.value = 'agents'
  currentStage.value = ''
  expandedBatch.value = null
  tooltipBatch.value = null
  // 清理悬浮定时器与卡片 ref，避免多次分析后旧索引堆积
  hoverTimers.forEach((t) => clearTimeout(t))
  hoverTimers.clear()
  cardRefs.clear()
}

async function startAnalysis() {
  if (!canSubmit.value) return
  isAnalyzing.value = true
  terminalExpanded.value = true
  resetResults()
  addLog('正在提交任务...', 'info')

  try {
    const res = await documentAiAnalyzeApi.submitAnalyze(selectedFile.value!, {
      prompt: prompt.value,
      visionModelKey: visionModelKey.value!,
      batchSize: batchSize.value,
      merge: enableMerge.value,
      textModelKey: enableMerge.value && textModelKey.value ? textModelKey.value : undefined
    })

    const data = res.data.data
    submitResp.value = data

    batches.value = data.batchDescriptions.map((pageRange, index) => {
      // 兜底：后端某批缺失页码范围时回退为空区间标记，避免后续缩略图计算得到 NaN
      const range = data.batchPageRanges[index]
      const pageRangeIndices: [number, number] =
        Array.isArray(range) && range.length === 2 ? [range[0], range[1]] : [-1, -1]
      return {
        index,
        pageRange,
        pageRangeIndices,
        content: '',
        status: 'pending' as BatchStatus,
        collapsed: false
      }
    })

    addLog(`任务已提交 — 共 ${data.totalPages} 页，分 ${data.totalBatches} 批并行分析`, 'success')
    connectSSE(data.taskId)
  } catch (e: any) {
    isAnalyzing.value = false
    currentStage.value = 'ERROR'
    addLog(`提交失败：${e?.message ?? '未知错误'}`, 'error')
  }
}

function connectSSE(taskId: string) {
  eventSource = new EventSource(documentAiAnalyzeApi.getStreamUrl(taskId))

  eventSource.addEventListener('stage', (e: MessageEvent) => {
    const data: SseStageData = JSON.parse(e.data)
    currentStage.value = data.stage as AnalysisStage
    const msgs: Record<string, string> = {
      CONVERTING: `文档转换完成，共 ${data.totalPages ?? '?'} 页`,
      ANALYZING: `${data.totalBatches ?? '?'} 个 Agent 已并行启动`,
      MERGING: '开始合并各批次分析结果...'
    }
    addLog(msgs[data.stage] ?? data.message, 'info')
  })

  eventSource.addEventListener('batch_chunk', (e: MessageEvent) => {
    const data: SseBatchChunkData = JSON.parse(e.data)
    const batch = batches.value[data.batchIndex]
    if (batch) {
      if (batch.status === 'pending') batch.status = 'streaming'
      batch.content += data.content
    }
  })

  eventSource.addEventListener('batch_done', (e: MessageEvent) => {
    const data: SseBatchDoneData = JSON.parse(e.data)
    const batch = batches.value[data.batchIndex]
    if (batch) {
      batch.status = 'done'
      addLog(`Agent ${String(data.batchIndex + 1).padStart(2, '0')} 完成 (${batch.pageRange})`, 'success')
    }
  })

  eventSource.addEventListener('batch_error', (e: MessageEvent) => {
    const data: SseBatchErrorData = JSON.parse(e.data)
    const batch = batches.value[data.batchIndex]
    if (batch) {
      batch.status = 'error'
      batch.errorMessage = data.message
      addLog(`Agent ${String(data.batchIndex + 1).padStart(2, '0')} 出错：${data.message}`, 'error')
    }
  })

  eventSource.addEventListener('merge_chunk', (e: MessageEvent) => {
    const data: SseMergeChunkData = JSON.parse(e.data)
    // 首条合并内容到达时自动切换到最终结果标签
    if (!mergeContent.value) {
      activeTab.value = 'result'
    }
    mergeContent.value += data.content
    mergeStatus.value = 'streaming'
  })

  eventSource.addEventListener('done', () => {
    currentStage.value = 'DONE'
    addLog('分析任务全部完成 ✓', 'success')
    if (mergeStatus.value === 'streaming') mergeStatus.value = 'done'
    isAnalyzing.value = false
    closeSSE()
    // 任务完成后自动折叠日志区，腾出内容展示空间
    if (collapseTimer) clearTimeout(collapseTimer)
    collapseTimer = setTimeout(() => {
      collapseTimer = null
      terminalExpanded.value = false
    }, 800)
  })

  // 服务端业务错误事件（带 JSON data）
  eventSource.addEventListener('error', (e: MessageEvent) => {
    // 传输层断连触发的 error 无 data，交给 onerror 处理
    if (typeof e.data !== 'string') return
    try {
      const data = JSON.parse(e.data)
      addLog(`错误：${data.message ?? '分析失败'}`, 'error')
    } catch {
      addLog('发生错误', 'error')
    }
    currentStage.value = 'ERROR'
    isAnalyzing.value = false
    closeSSE()
  })

  // 传输层断连
  eventSource.onerror = () => {
    if (isAnalyzing.value) {
      addLog('SSE 连接中断', 'warn')
      currentStage.value = 'ERROR'
      isAnalyzing.value = false
    }
    closeSSE()
  }
}

function closeSSE() {
  clearCollapseTimer()
  eventSource?.close()
  eventSource = null
}

function stopAnalysis() {
  closeSSE()
  isAnalyzing.value = false
  currentStage.value = 'ERROR'
  addLog('已停止分析', 'warn')
  batches.value.forEach((b) => {
    if (b.status === 'streaming' || b.status === 'pending') b.status = 'error'
  })
}

async function copyContent(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制')
  } catch {
    message.error('复制失败')
  }
}
</script>

<template>
  <div class="daa nbp-page">
    <!-- ── Header ─────────────────────────────────────── -->
    <div class="nbp-header">
      <div class="nbp-header__left">
        <div class="nbp-header__brand">
          <span class="nbp-pulse-dot" />
          <span class="nbp-mono-label">DOC_AI_ANALYZER</span>
        </div>
        <h1 class="nbp-page-title">文档 AI 分析</h1>
        <p class="nbp-page-subtitle">上传文档，多 Agent 并行视觉分析，实时查看工作流结果</p>
      </div>
    </div>

    <!-- ── Layout ─────────────────────────────────────── -->
    <div class="daa__layout">
      <!-- ══ LEFT PANEL ════════════════════════════════ -->
      <aside class="daa__panel">
        <div class="daa__section">
          <label class="daa__label">文档文件</label>
          <div
            class="daa__dropzone"
            :class="{ 'is-dragging': isDragging, 'has-file': !!selectedFile }"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop="handleDrop"
            @click="fileInputRef?.click()"
          >
            <input
              ref="fileInputRef"
              type="file"
              :accept="ACCEPTED_EXTS.join(',')"
              style="display: none"
              @change="handleInputChange"
            />
            <template v-if="selectedFile">
              <span
                class="daa__file-badge"
                :style="{ borderColor: getFileExtColor(selectedFile.name), color: getFileExtColor(selectedFile.name) }"
              >
                {{ getFileExt(selectedFile.name) }}
              </span>
              <div class="daa__file-name">{{ selectedFile.name }}</div>
              <div class="daa__file-size">{{ formatFileSize(selectedFile.size) }}</div>
              <div class="daa__file-change">点击更换</div>
            </template>
            <template v-else>
              <Upload :size="22" class="daa__upload-icon" />
              <div class="daa__upload-hint">拖拽文件至此或点击选择</div>
              <div class="daa__upload-types">{{ ACCEPTED_EXTS.join('  ') }}</div>
            </template>
            <i class="daa__corner tl" /><i class="daa__corner tr" /><i class="daa__corner bl" /><i
            class="daa__corner br"
          />
          </div>
        </div>

        <div class="daa__section">
          <label class="daa__label"
          >
            <Cpu :size="12" style="margin-right: 5px; vertical-align: middle; opacity: 0.7" />
            视觉分析模型</label
          >
          <n-select v-model:value="visionModelKey" :options="visionModelOptions" placeholder="选择视觉分析模型" />
        </div>

        <div class="daa__section">
          <label class="daa__label">分析提示词</label>
          <n-input v-model:value="prompt" type="textarea" :rows="4" placeholder="输入分析提示词..." />
          <div class="daa__quick-prompts">
            <button v-for="qp in quickPrompts" :key="qp.label" class="daa__quick-btn" @click="prompt = qp.text">
              {{ qp.label }}
            </button>
          </div>
        </div>

        <div class="daa__section daa__batch-config">
          <i class="daa__corner tl" /><i class="daa__corner tr" /><i class="daa__corner bl" /><i
          class="daa__corner br"
        />
          <div class="daa__batch-title">批次配置</div>
          <div class="daa__batch-row">
            <span class="daa__batch-label">每批图片数</span>
            <n-input-number v-model:value="batchSize" :min="1" :max="20" size="small" style="width: 96px" />
          </div>
          <div class="daa__batch-row">
            <span class="daa__batch-label"
            ><GitMerge :size="12" style="margin-right: 4px; vertical-align: middle; opacity: 0.7" />合并结果</span
            >
            <n-switch v-model:value="enableMerge" size="small" />
          </div>
          <template v-if="enableMerge">
            <div style="margin-top: 6px">
              <div class="daa__batch-label" style="margin-bottom: 6px">合并用文本模型</div>
              <n-select
                v-model:value="textModelKey"
                :options="textModelOptions"
                placeholder="选择文本模型"
                size="small"
              />
            </div>
          </template>
        </div>

        <div v-if="showMergeWarning" class="daa__warning">
          <AlertTriangle :size="13" />
          未启用合并，将显示各批次独立分析结果
        </div>
        <div v-if="mergeModelMissing" class="daa__warning">
          <AlertTriangle :size="13" />
          已开启合并，请选择合并用文本模型后再开始分析
        </div>

        <div class="daa__actions">
          <button
            v-if="!isAnalyzing"
            class="daa__btn-start"
            :class="{ 'is-disabled': !canSubmit }"
            @click="startAnalysis"
          >
            <span class="daa__btn-text">开始分析</span><span class="daa__btn-scan" />
          </button>
          <button v-else class="daa__btn-stop" @click="stopAnalysis">停止分析</button>
        </div>
      </aside>

      <!-- ══ RIGHT PANEL ══════════════════════════════ -->
      <main class="daa__results">
        <!-- Empty state -->
        <div v-if="!hasStarted" class="daa__empty">
          <div class="daa__empty-grid" />
          <FileText :size="52" class="daa__empty-icon" />
          <div class="daa__empty-title">等待文档上传</div>
          <div class="daa__empty-hint">配置左侧参数后点击「开始分析」，多个分析 Agent 将并行处理文档批次</div>
        </div>

        <template v-else>
          <!-- ── Terminal ──────────────────────────── -->
          <div class="daa__terminal">
            <div class="daa__win-bar daa__win-bar--terminal">
              <div class="daa__win-dots">
                <span class="daa__dot dot-red" />
                <span class="daa__dot dot-yellow" />
                <span class="daa__dot dot-green" @click="terminalExpanded = !terminalExpanded" />
              </div>
              <span class="daa__win-title">SYSTEM_TERMINAL</span>
              <button class="daa__win-btn" @click="terminalExpanded = !terminalExpanded">
                <ChevronUp v-if="terminalExpanded" :size="13" />
                <ChevronDown v-else :size="13" />
              </button>
            </div>
            <Transition name="daa-collapse">
              <StrixAutoScroll v-show="terminalExpanded" class="daa__terminal-body" :threshold="40">
                <div v-for="(entry, i) in logEntries" :key="i" class="daa__tline" :class="`ttype-${entry.type}`">
                  <span class="daa__ttime">{{ entry.time }}</span>
                  <span class="daa__tprompt">›</span>
                  <span class="daa__tmsg">{{ entry.text }}</span>
                </div>
                <span v-if="isAnalyzing" class="daa__tcursor" />
              </StrixAutoScroll>
            </Transition>
          </div>

          <!-- ── Tab bar ───────────────────────────── -->
          <div class="daa__tabbar">
            <div class="daa__tabs-left">
              <!-- Agents tab -->
              <button
                class="daa__tab"
                :class="['is-' + agentsTabColor, { 'is-active': activeTab === 'agents' }]"
                @click="activeTab = 'agents'"
              >
                <span class="daa__tab-indicator" />
                <span class="daa__tab-label">◈ 分析过程</span>
                <span v-if="batches.length" class="daa__tab-badge" :class="agentsTabColor">
                  {{ agentsDoneCount }}/{{ batches.length }}
                </span>
              </button>

              <!-- Result tab -->
              <button
                class="daa__tab"
                :class="[
                  mergeStatus === 'done' ? 'is-done' : mergeStatus === 'streaming' ? 'is-active-blue' : 'is-pending',
                  { 'is-active': activeTab === 'result' }
                ]"
                @click="activeTab = 'result'"
              >
                <span class="daa__tab-indicator" />
                <span class="daa__tab-label">⌬ 最终结果</span>
                <span
                  class="daa__tab-badge"
                  :class="mergeStatus === 'done' ? 'done' : mergeStatus === 'streaming' ? 'active-blue' : 'idle'"
                >
                  <span v-if="mergeStatus === 'streaming'" class="daa__tab-spin">●</span>
                  <span v-else-if="mergeStatus === 'done'">✓</span>
                  <span v-else-if="!enableMerge" style="opacity: 0.4">─</span>
                  <span v-else>待合并</span>
                </span>
              </button>

              <!-- Gallery tab -->
              <button
                class="daa__tab"
                :class="[submitResp ? 'is-done' : 'is-pending', { 'is-active': activeTab === 'gallery' }]"
                @click="activeTab = 'gallery'"
              >
                <span class="daa__tab-indicator" />
                <span class="daa__tab-label"
                ><ImageIcon :size="12" style="vertical-align: middle; margin-right: 4px" />转换图片</span
                >
                <span v-if="submitResp" class="daa__tab-badge done">{{ submitResp.totalPages }}页</span>
                <span v-else class="daa__tab-badge idle">─</span>
              </button>
            </div>

            <!-- Grid layout toggle (agents tab only) -->
            <div v-if="activeTab === 'agents'" class="daa__grid-toggle">
              <button class="daa__grid-btn" :class="{ 'is-active': gridCols === 1 }" @click="gridCols = 1" title="单列">
                <LayoutList :size="14" />
              </button>
              <button class="daa__grid-btn" :class="{ 'is-active': gridCols === 2 }" @click="gridCols = 2" title="双列">
                <Columns2 :size="14" />
              </button>
              <button class="daa__grid-btn" :class="{ 'is-active': gridCols === 3 }" @click="gridCols = 3" title="三列">
                <Grid3x3 :size="14" />
              </button>
            </div>
          </div>

          <!-- ── Tab: Agents ───────────────────────── -->
          <div v-show="activeTab === 'agents'" class="daa__tab-content">
            <div v-if="!batches.length" class="daa__tab-empty">初始化中...</div>
            <div v-else class="daa__agents" :style="{ '--cols': gridCols }">
              <div
                v-for="batch in batches"
                :key="batch.index"
                :ref="(el) => setCardRef(el as HTMLElement | null, batch.index)"
                class="daa__agent-card"
                :class="[`status-${batch.status}`]"
                @mouseleave="onCardMouseLeave(batch.index)"
              >
                <!-- macOS title bar -->
                <div class="daa__win-bar" :class="`win-${batch.status}`">
                  <div class="daa__win-dots">
                    <span class="daa__dot dot-red" />
                    <span class="daa__dot dot-yellow" />
                    <span class="daa__dot dot-green" />
                  </div>
                  <span class="daa__win-title daa__agent-id">AGENT {{ String(batch.index + 1).padStart(2, '0') }}</span>
                  <div class="daa__win-right">
                    <span class="daa__agent-badge" :class="`badge-${batch.status}`">
                      <span v-if="batch.status === 'streaming'" class="daa__badge-dot" />
                      {{ { pending: '等待', streaming: '分析中', done: '完成', error: '出错' }[batch.status] }}
                    </span>
                    <button
                      v-if="batch.content"
                      class="daa__icon-btn"
                      @click.stop="copyContent(batch.content)"
                      title="复制"
                    >
                      <Copy :size="11" />
                    </button>
                    <button class="daa__icon-btn" @click.stop="batch.collapsed = !batch.collapsed">
                      <ChevronUp v-if="!batch.collapsed" :size="11" />
                      <ChevronDown v-else :size="11" />
                    </button>
                  </div>
                </div>

                <!-- Page range + thumbnails strip -->
                <div v-show="!batch.collapsed" class="daa__agent-meta" @mouseenter="onCardMouseEnter(batch.index)">
                  <span class="daa__agent-range">{{ batch.pageRange }}</span>
                  <!-- Thumbnail strip (click to gallery) -->
                  <div v-if="batch.pageRangeIndices[0] >= 0" class="daa__thumb-strip">
                    <img
                      v-for="pi in Array.from(
                        { length: batch.pageRangeIndices[1] - batch.pageRangeIndices[0] + 1 },
                        (_, j) => batch.pageRangeIndices[0] + j
                      )"
                      :key="pi"
                      :src="getPageImageUrl(pi)"
                      class="daa__thumb"
                      loading="lazy"
                      :alt="`第 ${pi + 1} 页`"
                      :title="`第 ${pi + 1} 页 — 点击查看`"
                      @click.stop="scrollToGalleryPage(pi)"
                    />
                  </div>
                </div>

                <!-- Content body -->
                <StrixAutoScroll
                  v-show="!batch.collapsed"
                  class="daa__agent-body"
                  @mouseenter="onCardMouseEnter(batch.index)"
                >
                  <div v-if="batch.status === 'error'" class="daa__agent-error">
                    {{ batch.errorMessage ?? '分析失败' }}
                  </div>
                  <template v-else-if="batch.content">
                    <StrixStreamMarkdown :content="batch.content" :streaming="batch.status === 'streaming'" />
                    <span v-if="batch.status === 'streaming'" class="daa__cursor" />
                  </template>
                  <div v-else class="daa__agent-idle">
                    <span v-if="batch.status === 'streaming'" class="daa__idle-dot" /><span v-else style="opacity: 0.2"
                  >—</span
                  >
                  </div>
                </StrixAutoScroll>

                <!-- Lock-on reticle (hover dwell progress) -->
                <Transition name="daa-reticle">
                  <div v-if="tooltipBatch === batch.index" class="daa__reticle" aria-hidden="true">
                    <span class="daa__reticle-corner tl" />
                    <span class="daa__reticle-corner tr" />
                    <span class="daa__reticle-corner bl" />
                    <span class="daa__reticle-corner br" />
                    <span class="daa__reticle-cross" />
                  </div>
                </Transition>
              </div>
            </div>
          </div>

          <!-- ── Tab: Final Result ─────────────────── -->
          <div v-show="activeTab === 'result'" class="daa__tab-content">
            <template v-if="enableMerge">
              <div v-if="mergeStatus === 'idle' && isAnalyzing" class="daa__tab-empty">
                <span class="daa__idle-dot" style="margin-right: 8px" />等待各批次完成后合并...
              </div>
              <div v-else-if="!mergeContent" class="daa__tab-empty">暂无合并结果</div>
              <div v-else class="daa__result-win">
                <!-- macOS title bar -->
                <div class="daa__win-bar" :class="mergeStatus === 'done' ? 'win-done' : 'win-streaming'">
                  <div class="daa__win-dots">
                    <span class="daa__dot dot-red" />
                    <span class="daa__dot dot-yellow" />
                    <span class="daa__dot dot-green" />
                  </div>
                  <span class="daa__win-title">⌬ MERGE AGENT — 综合分析结论</span>
                  <div class="daa__win-right">
                    <span v-if="mergeStatus === 'streaming'" class="daa__merge-streaming">
                      <span class="daa__badge-dot" />合并中
                    </span>
                    <span v-else-if="mergeStatus === 'done'" class="daa__merge-done">✓ 已完成</span>
                    <button class="daa__icon-btn" @click="copyContent(mergeContent)" title="复制">
                      <Copy :size="11" />
                    </button>
                  </div>
                </div>
                <StrixAutoScroll class="daa__result-body">
                  <StrixStreamMarkdown
                    :content="mergeContent"
                    :streaming="mergeStatus === 'streaming'"
                    variant="result"
                  />
                  <span v-if="mergeStatus === 'streaming'" class="daa__cursor daa__cursor--result" />
                </StrixAutoScroll>
              </div>
            </template>
            <div v-else class="daa__tab-empty">
              <AlertTriangle :size="18" style="margin-bottom: 8px; opacity: 0.4" />
              <div>未启用合并模式</div>
              <div style="font-size: 11px; opacity: 0.4; margin-top: 4px">请在左侧开启「合并结果」并选择文本模型</div>
            </div>
          </div>

          <!-- ── Tab: Gallery ──────────────────────── -->
          <div v-show="activeTab === 'gallery'" class="daa__tab-content">
            <div v-if="!submitResp" class="daa__tab-empty">等待分析任务提交...</div>
            <div v-else ref="galleryRef" class="daa__gallery">
              <div v-for="pi in submitResp.totalPages" :id="`gp-${pi - 1}`" :key="pi" class="daa__gallery-item">
                <div
                  class="daa__gallery-img-wrap"
                  @mouseenter="previewImage(pi - 1)"
                  @mouseleave="endPreview"
                  @click="pinImage(pi - 1)"
                >
                  <img :src="getPageImageUrl(pi - 1)" :alt="`第 ${pi} 页`" loading="lazy" class="daa__gallery-img" />
                  <!-- 锁定准星（悬浮等待期，时长 = ZOOM_HOVER_DELAY） -->
                  <div v-if="reticlePage === pi - 1" class="daa__reticle daa__reticle--img" aria-hidden="true">
                    <i class="daa__reticle-corner tl" /><i class="daa__reticle-corner tr" /><i
                    class="daa__reticle-corner bl"
                  /><i class="daa__reticle-corner br" />
                    <span class="daa__reticle-cross" />
                  </div>
                </div>
                <div class="daa__gallery-label">第 {{ pi }} 页</div>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>

    <!-- ══ Floating Overlay (hover expand) ══════════ -->
    <Teleport to="body">
      <Transition name="daa-expand">
        <div
          v-if="expandedBatch !== null && expandedBatchData"
          class="daa__overlay-backdrop"
          @click.self="closeExpanded"
        >
          <div
            ref="expandedCardRef"
            class="daa__overlay-card"
            :class="[`status-${expandedBatchData.status}`]"
            :style="expandedOriginStyle"
            @mouseleave="closeExpanded"
          >
            <!-- macOS title bar -->
            <div class="daa__win-bar" :class="`win-${expandedBatchData.status}`">
              <div class="daa__win-dots">
                <span class="daa__dot dot-red" @click="closeExpanded" />
                <span class="daa__dot dot-yellow" />
                <span class="daa__dot dot-green" />
              </div>
              <span class="daa__win-title daa__agent-id">
                AGENT {{ String(expandedBatchData.index + 1).padStart(2, '0') }} — {{ expandedBatchData.pageRange }}
              </span>
              <div class="daa__win-right">
                <span class="daa__agent-badge" :class="`badge-${expandedBatchData.status}`">
                  <span v-if="expandedBatchData.status === 'streaming'" class="daa__badge-dot" />
                  {{
                    { pending: '等待中', streaming: '分析中', done: '已完成', error: '出错' }[expandedBatchData.status]
                  }}
                </span>
                <button class="daa__icon-btn" @click="closeExpanded" title="关闭">
                  <X :size="12" />
                </button>
              </div>
            </div>

            <!-- Thumbnail strip in overlay -->
            <div v-if="expandedBatchData.pageRangeIndices[0] >= 0" class="daa__overlay-thumbs">
              <div
                v-for="pi in Array.from(
                  { length: expandedBatchData!.pageRangeIndices[1] - expandedBatchData!.pageRangeIndices[0] + 1 },
                  (_, j) => expandedBatchData!.pageRangeIndices[0] + j
                )"
                :key="pi"
                class="daa__overlay-thumb-wrap"
                @mouseenter="previewImage(pi)"
                @mouseleave="endPreview"
                @click.stop="pinImage(pi)"
              >
                <img :src="getPageImageUrl(pi)" class="daa__overlay-thumb" loading="lazy" :alt="`第 ${pi + 1} 页`" />
                <!-- 锁定准星进度提示 -->
                <span v-if="reticlePage === pi" class="daa__reticle daa__reticle--img" aria-hidden="true">
                  <i class="daa__reticle-corner tl" /><i class="daa__reticle-corner tr" />
                  <i class="daa__reticle-corner bl" /><i class="daa__reticle-corner br" />
                  <i class="daa__reticle-cross" />
                </span>
              </div>
            </div>

            <!-- Full content (markdown) -->
            <StrixAutoScroll ref="overlayScrollRef" class="daa__overlay-body">
              <div v-if="expandedBatchData.status === 'error'" class="daa__agent-error">
                {{ expandedBatchData.errorMessage }}
              </div>
              <template v-else-if="expandedBatchData.content">
                <StrixStreamMarkdown
                  :content="expandedBatchData.content"
                  :streaming="expandedBatchData.status === 'streaming'"
                />
                <span v-if="expandedBatchData.status === 'streaming'" class="daa__cursor" />
              </template>
              <div v-else class="daa__agent-idle">
                <span v-if="expandedBatchData.status === 'streaming'" class="daa__idle-dot" />
                <span v-else style="opacity: 0.25">暂无内容</span>
              </div>
            </StrixAutoScroll>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ Image Lightbox (shared by overlay thumbs & gallery) ══ -->
    <Teleport to="body">
      <Transition name="daa-zoom">
        <div
          v-if="zoomPageIndex !== null"
          class="daa__zoom-backdrop"
          :class="{ 'is-pinned': zoomPinned }"
          @click.self="closeZoom"
        >
          <div class="daa__zoom-frame">
            <img :src="getPageImageUrl(zoomPageIndex)" :alt="`第 ${zoomPageIndex + 1} 页`" class="daa__zoom-img" />
            <div class="daa__zoom-bar">
              <span class="daa__zoom-label">第 {{ zoomPageIndex + 1 }} 页</span>
              <span class="daa__zoom-hint">{{ zoomPinned ? '点击空白处或按 ESC 关闭' : '点击图片固定显示' }}</span>
              <button v-if="zoomPinned" class="daa__icon-btn" @click="closeZoom" title="关闭">
                <X :size="14" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/style/tokens' as *;
@use '@/assets/style/components/nebula-pages' as *;

// ── Layout ────────────────────────────────────────────────

.daa {
  min-height: calc(100vh - 120px);

  &__layout {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  &__panel {
    width: 340px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__results {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
}

// ── Shared ────────────────────────────────────────────────

.daa__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.daa__label {
  font-family: $font-mono;
  font-size: $text-2xs;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--strix-text-accent);
  opacity: 0.72;
}

.daa__corner {
  position: absolute;
  width: 8px;
  height: 8px;
  border-color: var(--strix-text-accent);
  border-style: solid;
  opacity: 0.28;
  pointer-events: none;
  transition: opacity 0.2s;

  &.tl {
    top: 0;
    left: 0;
    border-width: 1px 0 0 1px;
  }

  &.tr {
    top: 0;
    right: 0;
    border-width: 1px 1px 0 0;
  }

  &.bl {
    bottom: 0;
    left: 0;
    border-width: 0 0 1px 1px;
  }

  &.br {
    bottom: 0;
    right: 0;
    border-width: 0 1px 1px 0;
  }
}

// ── macOS-style window bar ────────────────────────────────

.daa__win-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-bottom: 1px solid var(--strix-border-subtle);
  background: rgba(255, 255, 255, 0.022);
  user-select: none;

  &--terminal {
    background: rgba(99, 226, 183, 0.04);
    border-bottom-color: rgba(99, 226, 183, 0.1);
  }

  &.win-streaming {
    border-bottom-color: rgba(99, 226, 183, 0.2);
    background: rgba(99, 226, 183, 0.04);
  }

  &.win-done {
    border-bottom-color: rgba(99, 226, 183, 0.1);
    background: rgba(99, 226, 183, 0.02);
  }

  &.win-error {
    border-bottom-color: rgba(232, 128, 128, 0.2);
    background: rgba(232, 128, 128, 0.04);
  }

  &.win-pending {
    border-bottom-color: var(--strix-border-subtle);
  }
}

.daa__win-dots {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.daa__dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  cursor: default;
  transition: filter 0.15s;

  &.dot-red {
    background: #ff5f57;
  }

  &.dot-yellow {
    background: #ffbd2e;
  }

  &.dot-green {
    background: #28c840;
  }

  .daa__win-bar:hover &.dot-red::after,
  .daa__win-bar:hover &.dot-yellow::after,
  .daa__win-bar:hover &.dot-green::after {
    opacity: 1;
  }
}

.daa__win-title {
  flex: 1;
  text-align: center;
  font-family: $font-mono;
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--strix-text-secondary);
  opacity: 0.6;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.daa__win-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.daa__win-btn {
  background: none;
  border: none;
  color: var(--strix-text-muted);
  cursor: pointer;
  padding: 1px;
  display: flex;
  align-items: center;

  &:hover {
    color: var(--strix-text-accent);
  }
}

// ── Dropzone ──────────────────────────────────────────────

.daa__dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 22px 16px;
  min-height: 110px;
  background: var(--strix-bg-surface);
  border: 1px dashed var(--strix-border-default);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s,
  background 0.2s;
  text-align: center;

  &:hover,
  &.is-dragging {
    border-color: var(--strix-border-accent-hover);
    background: var(--strix-bg-surface-hover);

    .daa__corner {
      opacity: 0.8;
    }
  }

  &.has-file {
    border-style: solid;
    border-color: var(--strix-border-accent);
  }
}

.daa__upload-icon {
  color: var(--strix-text-accent);
  opacity: 0.4;
  margin-bottom: 4px;
}

.daa__upload-hint {
  font-size: $text-xs;
  color: var(--strix-text-secondary);
}

.daa__upload-types {
  font-family: $font-mono;
  font-size: 11px;
  color: var(--strix-text-muted);
}

.daa__file-badge {
  font-family: $font-mono;
  font-size: 11px;
  letter-spacing: 2px;
  font-weight: $weight-bold;
  padding: 3px 8px;
  border: 1px solid;
  border-radius: 3px;
}

.daa__file-name {
  font-size: $text-xs;
  color: var(--strix-text-primary);
  font-weight: $weight-medium;
  word-break: break-all;
}

.daa__file-size {
  font-family: $font-mono;
  font-size: 11px;
  color: var(--strix-text-muted);
}

.daa__file-change {
  font-size: 11px;
  color: var(--strix-text-accent);
  opacity: 0.55;
}

// ── Quick prompts ─────────────────────────────────────────

.daa__quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.daa__quick-btn {
  font-family: $font-mono;
  font-size: 11px;
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--strix-border-default);
  border-radius: 4px;
  color: var(--strix-text-secondary);
  cursor: pointer;
  transition: border-color 0.15s,
  color 0.15s;

  &:hover {
    border-color: var(--strix-border-accent-hover);
    color: var(--strix-text-accent);
  }
}

// ── Batch config ──────────────────────────────────────────

.daa__batch-config {
  position: relative;
  padding: 14px;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-subtle);
  border-radius: 6px;
  gap: 10px;

  &:hover .daa__corner {
    opacity: 0.5;
  }
}

.daa__batch-title {
  font-family: $font-mono;
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--strix-text-accent);
  opacity: 0.5;
}

.daa__batch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.daa__batch-label {
  font-size: $text-xs;
  color: var(--strix-text-secondary);
  display: flex;
  align-items: center;
}

// ── Warning ───────────────────────────────────────────────

.daa__warning {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(242, 201, 125, 0.05);
  border: 1px solid rgba(242, 201, 125, 0.16);
  border-radius: 5px;
  font-size: $text-2xs;
  color: $color-warning;
}

// ── Buttons ───────────────────────────────────────────────

.daa__actions {
  margin-top: 4px;
}

.daa__btn-start {
  position: relative;
  overflow: hidden;
  width: 100%;
  padding: 11px;
  background: var(--strix-text-accent);
  border: none;
  border-radius: 5px;
  font-family: $font-mono;
  font-size: $text-xs;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #06060e;
  font-weight: $weight-bold;
  cursor: pointer;
  transition: opacity 0.2s,
  transform 0.1s;

  &:hover:not(.is-disabled) {
    opacity: 0.9;
  }

  &:hover:not(.is-disabled) .daa__btn-scan {
    transform: translateX(200%);
    transition: transform 0.5s ease;
  }

  &:active:not(.is-disabled) {
    transform: scale(0.98);
  }

  &.is-disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.daa__btn-scan {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
  transform: translateX(-100%);
  transition: none;
}

.daa__btn-text {
  position: relative;
}

.daa__btn-stop {
  width: 100%;
  padding: 11px;
  background: transparent;
  border: 1px solid $color-error;
  border-radius: 5px;
  font-family: $font-mono;
  font-size: $text-xs;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: $color-error;
  font-weight: $weight-medium;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(232, 128, 128, 0.07);
  }
}

// ── Empty state ───────────────────────────────────────────

.daa__empty {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 40px;
  text-align: center;
  overflow: hidden;
}

.daa__empty-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(99, 226, 183, 0.025) 1px, transparent 1px),
  linear-gradient(90deg, rgba(99, 226, 183, 0.025) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}

.daa__empty-icon {
  color: var(--strix-text-accent);
  opacity: 0.12;
  margin-bottom: 20px;
}

.daa__empty-title {
  font-family: $font-display;
  font-size: $text-xl;
  font-weight: $weight-semibold;
  color: var(--strix-text-primary);
  opacity: 0.35;
  margin-bottom: 10px;
}

.daa__empty-hint {
  font-size: $text-xs;
  color: var(--strix-text-muted);
  max-width: 360px;
  line-height: $leading-relaxed;
}

// ── Terminal ──────────────────────────────────────────────

.daa__terminal {
  margin-bottom: 0;
  border: 1px solid rgba(99, 226, 183, 0.1);
  border-radius: 6px 6px 0 0;
  overflow: hidden;
  background: #020904;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.05) 2px,
      rgba(0, 0, 0, 0.05) 4px
    );
    pointer-events: none;
    z-index: 1;
  }
}

.daa__terminal-body {
  position: relative;
  z-index: 2;
  padding: 10px 14px;
  height: 110px;
  overflow-y: auto;
  font-family: $font-mono;
  font-size: 12px;
  line-height: 1.7;
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 226, 183, 0.12) transparent;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(99, 226, 183, 0.12);
    border-radius: 2px;
  }
}

// ── Terminal collapse transition ──────────────────────────

.daa-collapse-enter-active,
.daa-collapse-leave-active {
  transition: max-height 0.32s ease,
  opacity 0.25s ease,
  padding-top 0.32s ease,
  padding-bottom 0.32s ease;
  overflow: hidden;
}

.daa-collapse-enter-from,
.daa-collapse-leave-to {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
}

.daa-collapse-enter-to,
.daa-collapse-leave-from {
  max-height: 130px;
  opacity: 1;
}

.daa__tline {
  display: flex;
  align-items: baseline;
  gap: 8px;
  white-space: pre-wrap;
  word-break: break-word;

  &.ttype-info .daa__tmsg {
    color: rgba(99, 226, 183, 0.7);
  }

  &.ttype-success .daa__tmsg {
    color: #63e2b7;
  }

  &.ttype-error .daa__tmsg {
    color: #e88080;
  }

  &.ttype-warn .daa__tmsg {
    color: #f2c97d;
  }
}

.daa__ttime {
  color: rgba(99, 226, 183, 0.22);
  flex-shrink: 0;
  user-select: none;
}

.daa__tprompt {
  color: rgba(99, 226, 183, 0.32);
  flex-shrink: 0;
  user-select: none;
}

.daa__tmsg {
  color: rgba(99, 226, 183, 0.7);
}

.daa__tcursor {
  display: inline-block;
  width: 7px;
  height: 13px;
  background: rgba(99, 226, 183, 0.6);
  animation: daa-blink 0.9s step-end infinite;
  vertical-align: text-bottom;
  margin-left: 2px;
}

// ── Tab bar ───────────────────────────────────────────────

.daa__tabbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 0 0;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-subtle);
  border-top: none;
  border-radius: 0 0 0 0;
  margin-bottom: 14px;
}

.daa__tabs-left {
  display: flex;
}

.daa__tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 14px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font-family: $font-mono;
  font-size: 11px;
  letter-spacing: 0.7px;
  color: var(--strix-text-secondary);
  cursor: pointer;
  transition: color 0.2s,
  border-color 0.2s;

  &:hover:not(.is-active) {
    color: var(--strix-text-primary);
  }

  // Active states
  &.is-active {
    color: var(--strix-text-accent);
    border-bottom-color: var(--strix-text-accent);
  }

  &.is-active.is-active-blue {
    color: $color-info;
    border-bottom-color: $color-info;
  }

  // Status glow indicator on left edge
  .daa__tab-indicator {
    position: absolute;
    left: 0;
    top: 25%;
    height: 50%;
    width: 2px;
    border-radius: 1px;
    background: transparent;
    transition: background 0.3s;
  }

  &.is-active .daa__tab-indicator {
    background: var(--strix-text-accent);
  }

  &.is-active.is-active-blue .daa__tab-indicator {
    background: $color-info;
  }
}

.daa__tab-label {
  text-transform: uppercase;
}

.daa__tab-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: $font-mono;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;

  &.active {
    background: rgba(99, 226, 183, 0.1);
    color: var(--strix-text-accent);
    border: 1px solid rgba(99, 226, 183, 0.2);
  }

  &.active-blue {
    background: rgba(112, 192, 232, 0.1);
    color: $color-info;
    border: 1px solid rgba(112, 192, 232, 0.2);
  }

  &.done {
    background: rgba(99, 226, 183, 0.06);
    color: var(--strix-text-accent);
    border: 1px solid rgba(99, 226, 183, 0.12);
    opacity: 0.75;
  }

  &.idle {
    background: var(--strix-bg-surface);
    color: var(--strix-text-muted);
    border: 1px solid var(--strix-border-subtle);
  }
}

.daa__tab-spin {
  animation: daa-blink 1s step-end infinite;
}

// ── Grid toggle ───────────────────────────────────────────

.daa__grid-toggle {
  display: flex;
  gap: 2px;
  padding: 4px;
}

.daa__grid-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  background: none;
  border: 1px solid transparent;
  color: var(--strix-text-muted);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: var(--strix-text-accent);
    background: rgba(99, 226, 183, 0.07);
  }

  &.is-active {
    color: var(--strix-text-accent);
    background: rgba(99, 226, 183, 0.1);
    border-color: rgba(99, 226, 183, 0.18);
  }
}

// ── Tab content ───────────────────────────────────────────

.daa__tab-content {
  min-height: 200px;
}

.daa__tab-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: var(--strix-text-muted);
  font-family: $font-mono;
  font-size: 12px;
  text-align: center;
}

// ── Agent cards ───────────────────────────────────────────

.daa__agents {
  display: grid;
  grid-template-columns: repeat(var(--cols, 1), 1fr);
  gap: 12px;
  align-items: start;
}

.daa__agent-card {
  position: relative;
  border: 1px solid var(--strix-border-default);
  border-radius: 6px;
  overflow: hidden;
  background: var(--strix-bg-surface);
  transition: border-color 0.3s,
  box-shadow 0.3s;
  cursor: default;

  &:hover {
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }

  &.status-streaming {
    border-color: rgba(99, 226, 183, 0.2);
    box-shadow: 0 0 0 1px rgba(99, 226, 183, 0.08) inset;
  }

  &.status-done {
    border-color: rgba(99, 226, 183, 0.12);
  }

  &.status-error {
    border-color: rgba(232, 128, 128, 0.18);
  }
}

.daa__agent-id {
  font-family: $font-mono;
  font-size: 11px;
  font-weight: $weight-bold;
  letter-spacing: 1.2px;
  color: var(--strix-text-accent) !important;
  opacity: 0.8;
}

.daa__agent-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: $font-mono;
  font-size: 10px;
  letter-spacing: 0.4px;
  padding: 1px 7px;
  border-radius: 3px;
  text-transform: uppercase;

  &.badge-pending {
    color: var(--strix-text-muted);
    background: var(--strix-bg-surface);
    border: 1px solid var(--strix-border-subtle);
  }

  &.badge-streaming {
    color: var(--strix-text-accent);
    background: rgba(99, 226, 183, 0.07);
    border: 1px solid rgba(99, 226, 183, 0.18);
  }

  &.badge-done {
    color: var(--strix-text-accent);
    opacity: 0.7;
    background: rgba(99, 226, 183, 0.04);
    border: 1px solid rgba(99, 226, 183, 0.1);
  }

  &.badge-error {
    color: $color-error;
    background: rgba(232, 128, 128, 0.05);
    border: 1px solid rgba(232, 128, 128, 0.18);
  }
}

.daa__badge-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: daa-pulse 1.1s ease-in-out infinite;
}

.daa__icon-btn {
  background: none;
  border: none;
  color: var(--strix-text-muted);
  cursor: pointer;
  padding: 3px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  transition: color 0.15s,
  background 0.15s;

  &:hover {
    color: var(--strix-text-accent);
    background: rgba(99, 226, 183, 0.08);
  }
}

.daa__agent-meta {
  padding: 8px 12px 6px;
  border-bottom: 1px solid var(--strix-border-subtle);
  background: var(--strix-bg-surface-hover);
}

.daa__agent-range {
  font-family: $font-mono;
  font-size: 11px;
  color: var(--strix-text-secondary);
  display: block;
  margin-bottom: 6px;
}

.daa__thumb-strip {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 2px;
}

.daa__thumb {
  height: 44px;
  width: auto;
  border-radius: 3px;
  cursor: pointer;
  border: 1px solid var(--strix-border-subtle);
  flex-shrink: 0;
  transition: border-color 0.15s,
  transform 0.15s;
  object-fit: cover;

  &:hover {
    border-color: var(--strix-border-accent-hover);
    transform: scale(1.05);
  }
}

.daa__agent-body {
  max-height: 260px;
  overflow-y: auto;
  padding: 12px 14px;
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 226, 183, 0.1) transparent;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(99, 226, 183, 0.1);
    border-radius: 2px;
  }
}

.daa__agent-error {
  font-family: $font-mono;
  font-size: 12px;
  color: $color-error;
  opacity: 0.8;
}

.daa__agent-idle {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  color: var(--strix-text-muted);
}

// ── Result window ─────────────────────────────────────────

.daa__result-win {
  border: 1px solid rgba(112, 192, 232, 0.14);
  border-radius: 6px;
  overflow: hidden;
  background: var(--strix-bg-surface);
}

.daa__merge-streaming {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: $font-mono;
  font-size: 10px;
  color: $color-info;
  opacity: 0.7;
}

.daa__merge-done {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: $font-mono;
  font-size: 10px;
  color: var(--strix-text-accent);
  opacity: 0.7;
}

.daa__result-body {
  max-height: 560px;
  overflow-y: auto;
  padding: 16px 18px;
  scrollbar-width: thin;
  scrollbar-color: rgba(112, 192, 232, 0.1) transparent;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(112, 192, 232, 0.12);
    border-radius: 2px;
  }
}

// ── Gallery ───────────────────────────────────────────────

.daa__gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  padding-bottom: 20px;
}

.daa__gallery-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.daa__gallery-img-wrap {
  width: 100%;
  border: 1px solid var(--strix-border-subtle);
  border-radius: 5px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
  transition: border-color 0.2s,
  transform 0.2s;

  &:hover {
    border-color: var(--strix-border-accent-hover);
    transform: scale(1.02);
  }
}

.daa__gallery-img {
  display: block;
  width: 100%;
  height: auto;
}

.daa__gallery-label {
  font-family: $font-mono;
  font-size: 11px;
  color: var(--strix-text-muted);
}

// ── Hover expand overlay ──────────────────────────────────

.daa__overlay-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

.daa__overlay-card {
  width: min(760px, calc(100vw - 80px));
  max-height: calc(100vh - 120px);
  border-radius: 8px;
  overflow: hidden;
  background: #0a0b14;
  border: 1px solid rgba(99, 226, 183, 0.25);
  box-shadow: 0 0 0 1px rgba(99, 226, 183, 0.08) inset,
  0 30px 80px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;

  &.status-streaming {
    border-color: rgba(99, 226, 183, 0.35);
    box-shadow: 0 0 40px rgba(99, 226, 183, 0.1),
    0 30px 80px rgba(0, 0, 0, 0.7);
  }

  &.status-error {
    border-color: rgba(232, 128, 128, 0.3);
  }

  // 标题栏与缩略图区固定高度，仅内容区可伸缩
  > .daa__win-bar {
    flex-shrink: 0;
  }
}

.daa__overlay-thumbs {
  height: 128px;
  flex-shrink: 0;
  display: flex;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--strix-border-subtle);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

.daa__overlay-thumb-wrap {
  position: relative;
  height: 100%;
  flex-shrink: 0;
  cursor: pointer;

  &:hover .daa__overlay-thumb {
    border-color: var(--strix-text-accent);
    transform: scale(1.04);
  }
}

.daa__overlay-thumb {
  display: block;
  height: 100%;
  width: auto;
  border-radius: 4px;
  border: 1px solid var(--strix-border-subtle);
  object-fit: cover;
  transition: border-color 0.15s,
  transform 0.15s;
}

.daa__overlay-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 18px;
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 226, 183, 0.1) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(99, 226, 183, 0.12);
    border-radius: 2px;
  }
}

// ── Expand transition ─────────────────────────────────────

.daa-expand-enter-active {
  transition: opacity 0.28s ease,
  transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.daa-expand-leave-active {
  transition: opacity 0.2s ease,
  transform 0.22s cubic-bezier(0.4, 0, 0.6, 1);
}

.daa-expand-enter-from {
  opacity: 0;
  transform: scale(0.72);
}

.daa-expand-leave-to {
  opacity: 0;
  transform: scale(0.88);
}

.daa-expand-enter-from .daa__overlay-backdrop,
.daa-expand-leave-to .daa__overlay-backdrop {
  background: transparent;
}

// ── Image lightbox ────────────────────────────────────────

.daa__zoom-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgba(0, 0, 0, 0.78);
  // 悬浮预览时不拦截鼠标，避免触发缩略图 mouseleave 造成闪烁
  pointer-events: none;

  &.is-pinned {
    pointer-events: auto;
  }
}

.daa__zoom-frame {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: min(1100px, calc(100vw - 80px));
  max-height: calc(100vh - 80px);
}

.daa__zoom-img {
  max-width: 100%;
  max-height: calc(100vh - 140px);
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid rgba(99, 226, 183, 0.25);
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.7);
  background: #0a0b14;
}

.daa__zoom-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: $font-mono;
  font-size: 12px;
}

.daa__zoom-label {
  color: var(--strix-text-accent);
  letter-spacing: 1px;
}

.daa__zoom-hint {
  flex: 1;
  color: var(--strix-text-muted);
  font-size: 11px;
}

.daa-zoom-enter-active {
  transition: opacity 0.22s ease,
  transform 0.26s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.daa-zoom-leave-active {
  transition: opacity 0.16s ease,
  transform 0.18s ease;
}

.daa-zoom-enter-from,
.daa-zoom-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

// ── Cursor / Idle / Spinner ───────────────────────────────

.daa__cursor {
  display: inline-block;
  width: 7px;
  height: 13px;
  background: var(--strix-text-accent);
  margin-left: 1px;
  vertical-align: text-bottom;
  animation: daa-blink 0.8s step-end infinite;
  opacity: 0.9;
}

.daa__cursor--result {
  background: $color-info;
}

.daa__idle-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--strix-text-accent);
  animation: daa-pulse 1.1s ease-in-out infinite;
}

// ── Lock-on reticle (hover dwell progress) ────────────────
// 四角括号向心收拢 = 进度；收拢完成即浮层弹出。动画时长与 JS 延迟同步：
//   Agent 卡片 → CARD_HOVER_DELAY (650ms)
//   图片       → ZOOM_HOVER_DELAY (500ms)

.daa__reticle {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none; // 不挡内容选择 / 点击
  // 默认（Agent 卡片）：内容区可滚动，准星需钉在视口可见区域
  display: flex;
  align-items: center;
  justify-content: center;
}

// 四角括号：起始向外偏移并半透明，随进度收拢到目标位置并增亮
.daa__reticle-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 1px solid var(--strix-text-accent);
  opacity: 0.3;
  filter: drop-shadow(0 0 3px rgba(99, 226, 183, 0.5));
  animation: daa-reticle-corner var(--daa-reticle-dur, 650ms) cubic-bezier(0.22, 0.61, 0.36, 1) forwards;

  // 收拢落点：距中心一定半径形成「取景框」
  &.tl {
    top: calc(50% - 26px);
    left: calc(50% - 26px);
    border-width: 1px 0 0 1px;
    --daa-from-x: -16px;
    --daa-from-y: -16px;
  }

  &.tr {
    top: calc(50% - 26px);
    right: calc(50% - 26px);
    border-width: 1px 1px 0 0;
    --daa-from-x: 16px;
    --daa-from-y: -16px;
  }

  &.bl {
    bottom: calc(50% - 26px);
    left: calc(50% - 26px);
    border-width: 0 0 1px 1px;
    --daa-from-x: -16px;
    --daa-from-y: 16px;
  }

  &.br {
    bottom: calc(50% - 26px);
    right: calc(50% - 26px);
    border-width: 0 1px 1px 0;
    --daa-from-x: 16px;
    --daa-from-y: 16px;
  }
}

// 中心十字：淡入放大，完成瞬间闪光
.daa__reticle-cross {
  position: relative;
  width: 16px;
  height: 16px;
  opacity: 0;
  filter: drop-shadow(0 0 4px rgba(99, 226, 183, 0.7));
  animation: daa-reticle-cross var(--daa-reticle-dur, 650ms) ease-out forwards;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: var(--strix-text-accent);
  }

  // 横线
  &::before {
    top: 50%;
    left: 0;
    width: 100%;
    height: 1px;
    transform: translateY(-50%);
  }

  // 竖线
  &::after {
    left: 50%;
    top: 0;
    height: 100%;
    width: 1px;
    transform: translateX(-50%);
  }
}

// 图片上的准星：缩小尺寸 + 极淡遮罩提升对比
.daa__reticle--img {
  background: rgba(0, 0, 0, 0.12);
  border-radius: inherit;

  .daa__reticle-corner {
    width: 10px;
    height: 10px;
    --daa-reticle-dur: 500ms;

    &.tl {
      top: calc(50% - 18px);
      left: calc(50% - 18px);
    }

    &.tr {
      top: calc(50% - 18px);
      right: calc(50% - 18px);
    }

    &.bl {
      bottom: calc(50% - 18px);
      left: calc(50% - 18px);
    }

    &.br {
      bottom: calc(50% - 18px);
      right: calc(50% - 18px);
    }
  }

  .daa__reticle-cross {
    width: 12px;
    height: 12px;
    --daa-reticle-dur: 500ms;
  }
}

@keyframes daa-reticle-corner {
  0% {
    opacity: 0;
    transform: translate(var(--daa-from-x), var(--daa-from-y));
  }
  18% {
    opacity: 0.45;
  }
  92% {
    opacity: 0.9;
    transform: translate(0, 0);
  }
  // 完成瞬间增亮闪光
  100% {
    opacity: 1;
    transform: translate(0, 0);
    filter: drop-shadow(0 0 7px rgba(99, 226, 183, 0.9));
  }
}

@keyframes daa-reticle-cross {
  0% {
    opacity: 0;
    transform: scale(0.6) rotate(-12deg);
  }
  70% {
    opacity: 0.85;
    transform: scale(1) rotate(0deg);
  }
  100% {
    opacity: 1;
    transform: scale(1.08) rotate(0deg);
    filter: drop-shadow(0 0 8px rgba(99, 226, 183, 1));
  }
}

// 进出场过渡（Transition name="daa-reticle"）
.daa-reticle-enter-active {
  transition: opacity 0.12s ease;
}

.daa-reticle-leave-active {
  transition: opacity 0.18s ease;
}

.daa-reticle-enter-from,
.daa-reticle-leave-to {
  opacity: 0;
}

// 无障碍：弱化动态，退化为静态取景框 + 透明度脉冲，仍精确计时
@media (prefers-reduced-motion: reduce) {
  .daa__reticle-corner {
    animation: none;
    opacity: 0.8;
    transform: none;
  }
  .daa__reticle-cross {
    animation: daa-pulse var(--daa-reticle-dur, 650ms) ease-in-out forwards;
    opacity: 0.8;
    transform: none;
  }
}

// ── Animations ────────────────────────────────────────────

@keyframes daa-blink {
  0%,
  100% {
    opacity: 0.9;
  }
  50% {
    opacity: 0;
  }
}

@keyframes daa-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.82);
  }
}
</style>
