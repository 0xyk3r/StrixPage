<template>
  <n-tag :type="tag.type" :bordered="false" :disabled="loading">
    {{ beforeLabel }}{{ tag.label }}{{ afterLabel }}
  </n-tag>
</template>
<script setup>
import { useDict } from '@/utils/strix-dict-util.js'
import { computed } from 'vue'

const $props = defineProps({
  value: { type: [String, Number], required: true },
  dictName: { type: String, required: true },
  beforeLabel: { type: String, default: '' },
  afterLabel: { type: String, default: '' },
  notFoundLabel: { type: String, default: '未知' }
})

const dict = useDict(`${$props.dictName}`)

const loading = computed(() => {
  return !dict || dict.value.length == 0
})

const tag = computed(() => {
  if (!dict || dict.value.length === 0) {
    return { label: '加载中...', type: '' }
  }

  const { label, style } = dict.value.find((item) => item.value === $props.value) || {}
  return {
    label: label || $props.notFoundLabel,
    type: style || ''
  }
})
</script>
<style lang="scss" scoped></style>
