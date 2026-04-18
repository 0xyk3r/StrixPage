<script lang="ts" setup>
import type { BrowseFileItem } from '@/api/oss-browse'

defineProps<{
  url: string
  file: BrowseFileItem
}>()

const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const imgStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  cursor: isDragging.value ? 'grabbing' : 'grab',
  transition: isDragging.value ? 'none' : 'transform 0.2s',
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain' as const
}))

function handleWheel(e: WheelEvent) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  scale.value = Math.max(0.1, Math.min(10, scale.value + delta))
}

function handleMouseDown(e: MouseEvent) {
  isDragging.value = true
  dragStart.value = { x: e.clientX - translateX.value, y: e.clientY - translateY.value }
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  translateX.value = e.clientX - dragStart.value.x
  translateY.value = e.clientY - dragStart.value.y
}

function handleMouseUp() {
  isDragging.value = false
}

function handleDoubleClick() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div class="preview-image" @wheel="handleWheel">
    <img
      :src="url"
      :alt="file.originalName"
      :style="imgStyle"
      draggable="false"
      @mousedown.prevent="handleMouseDown"
      @dblclick="handleDoubleClick"
    />
  </div>
</template>

<style lang="scss" scoped>
.preview-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
}
</style>
