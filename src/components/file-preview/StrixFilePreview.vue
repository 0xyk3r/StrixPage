<script lang="ts" setup>
import type { BrowseFileItem } from '@/api/oss-browse'
import { ossBrowseApi } from '@/api/oss-browse'
import { commonApi } from '@/api/common'
import { downloadBlob, formatFileSize } from '@/utils/strix-file-util'
import PreviewImage from './PreviewImage.vue'
import PreviewVideo from './PreviewVideo.vue'
import PreviewAudio from './PreviewAudio.vue'
import PreviewPdf from './PreviewPdf.vue'
import PreviewCode from './PreviewCode.vue'
import PreviewArchive from './PreviewArchive.vue'

const props = defineProps<{
  visible: boolean
  files: BrowseFileItem[]
  initialIndex: number
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const currentIndex = ref(0)
const previewUrl = ref('')
const previewLoading = ref(false)
let loadGeneration = 0

const currentFile = computed(() => props.files[currentIndex.value] ?? null)

const previewType = computed<string>(() => {
  const file = currentFile.value
  if (!file) return 'unknown'
  const ct = file.contentType || ''
  const ext = file.ext?.toLowerCase() || ''

  if (ct.startsWith('image/')) return 'image'
  if (ct.startsWith('video/')) return 'video'
  if (ct.startsWith('audio/')) return 'audio'
  if (ct === 'application/pdf' || ext === '.pdf') return 'pdf'
  if (['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz'].includes(ext)) return 'archive'
  if (ct.startsWith('text/') || isCodeFile(ext)) return 'code'
  return 'unknown'
})

function isCodeFile(ext: string): boolean {
  return [
    '.js', '.ts', '.jsx', '.tsx', '.vue', '.java', '.py', '.go', '.rs',
    '.rb', '.php', '.c', '.cpp', '.h', '.cs', '.swift', '.kt',
    '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg',
    '.html', '.htm', '.css', '.scss', '.sass', '.less',
    '.md', '.txt', '.log', '.csv', '.sql', '.sh', '.bat', '.ps1',
    '.dockerfile', '.gitignore', '.env', '.properties'
  ].includes(ext)
}

watch(() => props.visible, (v) => {
  if (v) {
    currentIndex.value = props.initialIndex
    loadPreview()
  }
}, { immediate: true })

watch(currentIndex, () => {
  if (props.visible) loadPreview()
})

function revokeCurrentBlob() {
  if (previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
}

async function loadPreview() {
  if (!currentFile.value) return
  const gen = ++loadGeneration
  previewLoading.value = true
  try {
    const { data } = await ossBrowseApi.getPreviewUrl(currentFile.value.id)
    if (gen !== loadGeneration) return
    if (data.code === 200 && data.data) {
      revokeCurrentBlob()
      previewUrl.value = data.data
    } else {
      const res = await commonApi.fileDownload(currentFile.value.id)
      if (gen !== loadGeneration) return
      revokeCurrentBlob()
      previewUrl.value = URL.createObjectURL(new Blob([res.data]))
    }
  } catch {
    if (gen === loadGeneration) previewUrl.value = ''
  } finally {
    if (gen === loadGeneration) previewLoading.value = false
  }
}

function navigatePrev() {
  if (currentIndex.value > 0) currentIndex.value--
}

function navigateNext() {
  if (currentIndex.value < props.files.length - 1) currentIndex.value++
}

function close() {
  emit('update:visible', false)
  revokeCurrentBlob()
  previewUrl.value = ''
}

async function handleDownload() {
  if (!currentFile.value) return
  const res = await commonApi.fileDownload(currentFile.value.id)
  downloadBlob(res, currentFile.value.originalName || 'file')
}

function handleKeydown(e: KeyboardEvent) {
  if (!props.visible) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowLeft') navigatePrev()
  if (e.key === 'ArrowRight') navigateNext()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="preview-fade">
      <div v-if="visible" class="file-preview-modal" @click.self="close">
        <!-- Header -->
        <div class="file-preview-modal__header">
          <div class="file-preview-modal__info">
            <span class="file-preview-modal__name">{{ currentFile?.originalName }}</span>
            <span class="file-preview-modal__meta">
              {{ formatFileSize(currentFile?.size ?? 0) }} · {{ currentFile?.ext }}
            </span>
          </div>
          <div class="file-preview-modal__actions">
            <n-button quaternary circle @click="handleDownload">
              <template #icon><span>⬇</span></template>
            </n-button>
            <n-button quaternary circle @click="close">
              <template #icon><span>✕</span></template>
            </n-button>
          </div>
        </div>

        <!-- Navigation -->
        <button
          v-if="currentIndex > 0"
          class="file-preview-modal__nav file-preview-modal__nav--prev"
          @click="navigatePrev"
        >
          ‹
        </button>
        <button
          v-if="currentIndex < files.length - 1"
          class="file-preview-modal__nav file-preview-modal__nav--next"
          @click="navigateNext"
        >
          ›
        </button>

        <!-- Content -->
        <div class="file-preview-modal__content">
          <n-spin v-if="previewLoading" :show="true" />
          <template v-else-if="currentFile && previewUrl">
            <PreviewImage v-if="previewType === 'image'" :url="previewUrl" :file="currentFile" />
            <PreviewVideo v-else-if="previewType === 'video'" :url="previewUrl" :file="currentFile" />
            <PreviewAudio v-else-if="previewType === 'audio'" :url="previewUrl" :file="currentFile" />
            <PreviewPdf v-else-if="previewType === 'pdf'" :url="previewUrl" :file="currentFile" />
            <PreviewCode v-else-if="previewType === 'code'" :url="previewUrl" :file="currentFile" />
            <PreviewArchive v-else-if="previewType === 'archive'" :file="currentFile" />
            <div v-else class="file-preview-modal__unsupported">
              <div style="font-size: 64px; margin-bottom: 16px">📄</div>
              <div>该文件类型暂不支持预览</div>
              <n-button type="primary" style="margin-top: 16px" @click="handleDownload">下载文件</n-button>
            </div>
          </template>
        </div>

        <!-- Counter -->
        <div class="file-preview-modal__counter">
          {{ currentIndex + 1 }} / {{ files.length }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.file-preview-modal {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    color: #fff;
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__name {
    font-size: 15px;
    font-weight: 500;
  }

  &__meta {
    font-size: 12px;
    opacity: 0.6;
  }

  &__actions {
    display: flex;
    gap: 4px;

    :deep(.n-button) {
      color: #fff;
    }
  }

  &__content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 0 60px;
  }

  &__nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #fff;
    font-size: 36px;
    width: 48px;
    height: 80px;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    &--prev { left: 8px; }
    &--next { right: 8px; }
  }

  &__counter {
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    padding: 8px;
    font-size: 12px;
    flex-shrink: 0;
  }

  &__unsupported {
    text-align: center;
    color: rgba(255, 255, 255, 0.8);
  }
}

.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.25s;
}
.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}
</style>
