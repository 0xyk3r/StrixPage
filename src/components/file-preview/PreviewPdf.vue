<script lang="ts" setup>
import type { BrowseFileItem } from '@/api/oss-browse'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const props = defineProps<{
  url: string
  file: BrowseFileItem
}>()

const containerRef = ref<HTMLDivElement>()
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1.5)
const loading = ref(true)
const error = ref('')
const canvasRef = ref<HTMLCanvasElement>()

let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null

async function loadPdf() {
  loading.value = true
  error.value = ''
  try {
    pdfDoc = await pdfjsLib.getDocument(props.url).promise
    totalPages.value = pdfDoc.numPages
    currentPage.value = 1
    await renderPage()
  } catch {
    error.value = 'PDF 加载失败'
  } finally {
    loading.value = false
  }
}

async function renderPage() {
  if (!pdfDoc || !canvasRef.value) return
  const page = await pdfDoc.getPage(currentPage.value)
  const viewport = page.getViewport({ scale: scale.value })
  const canvas = canvasRef.value
  canvas.height = viewport.height
  canvas.width = viewport.width
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport, canvas: canvas }).promise
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    renderPage()
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    renderPage()
  }
}

function zoomIn() {
  scale.value = Math.min(5, scale.value + 0.25)
  renderPage()
}

function zoomOut() {
  scale.value = Math.max(0.5, scale.value - 0.25)
  renderPage()
}

onMounted(() => loadPdf())

onUnmounted(() => {
  pdfDoc?.destroy()
  pdfDoc = null
})
</script>

<template>
  <div ref="containerRef" class="preview-pdf">
    <div v-if="error" class="preview-pdf__error">
      <div>{{ error }}</div>
    </div>
    <template v-else>
      <!-- Controls -->
      <div class="preview-pdf__controls">
        <n-button-group size="small">
          <n-button :disabled="currentPage <= 1" @click="prevPage">‹</n-button>
          <n-button disabled>{{ currentPage }} / {{ totalPages }}</n-button>
          <n-button :disabled="currentPage >= totalPages" @click="nextPage">›</n-button>
        </n-button-group>
        <n-button-group size="small" style="margin-left: 12px">
          <n-button @click="zoomOut">−</n-button>
          <n-button disabled>{{ Math.round(scale * 100) }}%</n-button>
          <n-button @click="zoomIn">+</n-button>
        </n-button-group>
      </div>

      <!-- Canvas -->
      <div class="preview-pdf__canvas-wrapper">
        <n-spin :show="loading">
          <canvas ref="canvasRef" class="preview-pdf__canvas" />
        </n-spin>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.preview-pdf {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  &__controls {
    display: flex;
    align-items: center;
    padding: 8px;
    flex-shrink: 0;

    :deep(.n-button) {
      color: #fff;
      border-color: rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &__canvas-wrapper {
    flex: 1;
    overflow: auto;
    display: flex;
    justify-content: center;
    padding: 8px;
  }

  &__canvas {
    max-width: 100%;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  }

  &__error {
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    padding: 40px;
  }
}
</style>
