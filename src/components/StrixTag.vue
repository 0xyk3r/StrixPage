<template>
  <n-tag :type="tag.type" :bordered="false" :disabled="loading">
    {{ beforeLabel }}{{ tag.label }}{{ afterLabel }}
  </n-tag>
</template>
<script setup lang="ts">
import type { NTagType } from '@/@types/naive-ui'
import { useDict } from '@/utils/strix-dict-util'
import { NTag } from 'naive-ui'
import { computed } from 'vue'

const $props = defineProps({
  value: { type: [String, Number], required: true },
  dictName: { type: String, required: true },
  beforeLabel: { type: String, default: '' },
  afterLabel: { type: String, default: '' },
  notFoundLabel: { type: String, default: '未知' }
})

const dict = useDict($props.dictName)

const loading = computed(() => !dict || dict.value.length === 0)

const tag = computed(() => {
  if (!dict || dict.value.length === 0) {
    return { label: '加载中...', type: 'default' as NTagType }
  }

  const foundItem: any = dict.value.find((item: any) => item.value === $props.value)
  return {
    label: foundItem?.label || $props.notFoundLabel,
    type: (foundItem?.style || 'default') as NTagType
  }
})
</script>
<style lang="scss" scoped></style>
