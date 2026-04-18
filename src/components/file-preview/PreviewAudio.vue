<script lang="ts" setup>
import type { BrowseFileItem } from '@/api/oss-browse'

defineProps<{
  url: string
  file: BrowseFileItem
}>()

const hasError = ref(false)
</script>

<template>
  <div class="preview-audio">
    <div class="preview-audio__icon">🎵</div>
    <div class="preview-audio__name">{{ file.originalName }}</div>
    <template v-if="!hasError">
      <audio
        :src="url"
        controls
        autoplay
        class="preview-audio__player"
        @error="hasError = true"
      />
    </template>
    <div v-else class="preview-audio__fallback">该音频格式不支持在线播放</div>
  </div>
</template>

<style lang="scss" scoped>
.preview-audio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: rgba(255, 255, 255, 0.8);

  &__icon {
    font-size: 80px;
  }

  &__name {
    font-size: 16px;
    max-width: 400px;
    text-align: center;
    word-break: break-all;
  }

  &__player {
    width: 400px;
    max-width: 90vw;
  }

  &__fallback {
    color: rgba(255, 255, 255, 0.5);
  }
}
</style>
