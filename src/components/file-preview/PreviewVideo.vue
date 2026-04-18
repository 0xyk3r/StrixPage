<script lang="ts" setup>
import type { BrowseFileItem } from '@/api/oss-browse'

defineProps<{
  url: string
  file: BrowseFileItem
}>()

const videoRef = ref<HTMLVideoElement>()
const hasError = ref(false)

function handleError() {
  hasError.value = true
}
</script>

<template>
  <div class="preview-video">
    <template v-if="!hasError">
      <video
        ref="videoRef"
        :src="url"
        controls
        autoplay
        preload="auto"
        class="preview-video__player"
        @error="handleError"
      >
        浏览器不支持此视频格式
      </video>
    </template>
    <div v-else class="preview-video__fallback">
      <div style="font-size: 48px; margin-bottom: 12px">🎬</div>
      <div>该视频格式不支持在线播放</div>
      <div style="margin-top: 8px; opacity: 0.6; font-size: 12px">{{ file.originalName }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.preview-video {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  &__player {
    max-width: 100%;
    max-height: 100%;
    border-radius: 4px;
  }

  &__fallback {
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
  }
}
</style>
