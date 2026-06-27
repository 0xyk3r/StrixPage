<template>
  <div class="strix-avatar" :style="{ width: `${size}px`, height: `${size}px` }" v-html="svgContent" />
</template>

<script lang="ts" setup>
import { type AvatarConfig, generateAvatarSvg, parseAvatarConfig } from '@/utils/dicebear-util'
import { useManagerAvatar } from '@/composables/useManagerAvatar'

interface Props {
  /** 管理员 ID，用于默认 seed */
  managerId: string
  /**
   * DiceBear 配置 JSON 字符串或对象。
   * - 显式传入（含 null）：直接渲染，不发起请求（调用方已持有头像数据的场景）。
   * - 完全不传（undefined）：在 autoFetch 开启时按 managerId 自助批量拉取头像配置。
   */
  config?: string | AvatarConfig | null
  /** 头像尺寸（px），默认 40 */
  size?: number
  /**
   * 是否在未提供 config 时按 managerId 自助拉取头像配置，默认 true。
   * 仅有 managerId 的页面（会话监控、评论等）依赖此能力渲染正确头像。
   */
  autoFetch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  config: undefined,
  size: 40,
  autoFetch: true
})

// 是否显式提供了 config（含 null）——显式提供则以调用方数据为准，不触发自助拉取
const hasExplicitConfig = computed(() => props.config !== undefined)

// 仅在「未显式提供 config 且开启 autoFetch」时按 managerId 拉取
const shouldFetch = computed(() => !hasExplicitConfig.value && props.autoFetch)
const { config: fetchedConfig } = useManagerAvatar(() => (shouldFetch.value ? props.managerId : null))

const svgContent = computed(() => {
  // 显式 config 优先；否则用自助拉取结果（加载完成前为 null，回退到 managerId 作 seed）
  const raw = hasExplicitConfig.value ? props.config : fetchedConfig.value
  const parsed = parseAvatarConfig(raw)
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
