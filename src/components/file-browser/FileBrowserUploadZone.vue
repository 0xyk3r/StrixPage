<script lang="ts" setup>
import { commonApi } from '@/api/common'
import { ossBrowseApi } from '@/api/oss-browse'

const props = defineProps<{
  groupKey: string
  currentPrefix: string
}>()

const emit = defineEmits<{
  uploadComplete: []
}>()

const isDragging = ref(false)
const uploadProgress = ref<{ name: string; percent: number }[]>([])
let dragCounter = 0

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  dragCounter++
  isDragging.value = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  dragCounter--
  if (dragCounter <= 0) {
    isDragging.value = false
    dragCounter = 0
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

async function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  dragCounter = 0

  if (!e.dataTransfer?.files?.length || !props.groupKey) return

  const files = Array.from(e.dataTransfer.files)
  uploadProgress.value = files.map((f) => ({ name: f.name, percent: 0 }))

  const concurrency = 3
  const queue = [...files]
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const file = queue.shift()
      if (!file) break
      const idx = files.indexOf(file)
      const progressItem = uploadProgress.value[idx]
      try {
        const formData = new FormData()
        formData.append('file', file)
        if (progressItem) progressItem.percent = 50
        const { data } = await commonApi.fileUpload(props.groupKey, formData)
        if (data.code === 200 && props.currentPrefix) {
          await ossBrowseApi.move({
            fileIds: [data.data.fileId],
            targetGroupKey: props.groupKey,
            targetPrefix: props.currentPrefix
          })
        }
        if (progressItem) progressItem.percent = 100
      } catch {
        if (progressItem) progressItem.percent = -1
      }
    }
  })

  await Promise.all(workers)
  setTimeout(() => {
    uploadProgress.value = []
    emit('uploadComplete')
  }, 500)
}
</script>

<template>
  <div
    class="upload-zone"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <slot />

    <Transition name="fade">
      <div v-if="isDragging" class="upload-zone__overlay">
        <div class="upload-zone__overlay-content">
          <div style="font-size: 48px">📤</div>
          <div>释放以上传到当前目录</div>
        </div>
      </div>
    </Transition>

    <div v-if="uploadProgress.length > 0" class="upload-zone__progress">
      <div v-for="(item, idx) in uploadProgress" :key="idx" class="upload-zone__progress-item">
        <span class="upload-zone__progress-name">{{ item.name }}</span>
        <n-progress
          :percentage="Math.max(item.percent, 0)"
          :status="item.percent === -1 ? 'error' : item.percent === 100 ? 'success' : 'default'"
          :show-indicator="false"
          style="width: 120px"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.upload-zone {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__overlay {
    position: absolute;
    inset: 0;
    z-index: 100;
    background: rgba(45, 180, 140, 0.1);
    border: 2px dashed var(--n-color-primary);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    &-content {
      text-align: center;
      font-size: 16px;
      color: var(--n-color-primary);
    }
  }

  &__progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--n-color);
    border-top: 1px solid var(--n-border-color);
    padding: 8px 12px;
    max-height: 120px;
    overflow-y: auto;
  }

  &__progress-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    padding: 2px 0;
  }

  &__progress-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
