<template>
  <div class="strix-avatar" :style="{ width: `${size}px`, height: `${size}px` }" v-html="svgContent" />
</template>

<script lang="ts" setup>
import { type AvatarConfig, generateAvatarSvg, parseAvatarConfig } from '@/utils/dicebear-util'

interface Props {
  /** 管理员 ID，用于默认 seed */
  managerId: string
  /** DiceBear 配置 JSON 字符串或对象，不传则以 managerId 为 seed 自动生成 */
  config?: string | AvatarConfig | null
  /** 头像尺寸（px），默认 40 */
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  config: null,
  size: 40
})

const svgContent = computed(() => {
  const parsed = parseAvatarConfig(props.config)
  return generateAvatarSvg(props.managerId, parsed)
})
</script>

<style lang="scss" scoped>
.strix-avatar {
  display: block;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  line-height: 0;

  // v-html 注入的 svg 已通过 inline style 设为 100% 尺寸
  // 此处作为兜底保障，确保 svg 完全填充容器
  :deep(svg) {
    display: block !important;
    width: 100% !important;
    height: 100% !important;
  }
}
</style>
