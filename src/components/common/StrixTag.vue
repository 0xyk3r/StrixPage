<template>
  <NebulaTag :type="tag.type"> {{ beforeLabel }}{{ tag.label }}{{ afterLabel }} </NebulaTag>
</template>
<script lang="ts" setup>
import type { NTagType } from '@/@types/naive-ui'
import { useDict } from '@/composables/useDict.ts'
import NebulaTag from '@/components/common/NebulaTag.vue'

const { value, dictName, notFoundLabel } = defineProps({
  value: { type: [String, Number], required: true },
  dictName: { type: String, required: true },
  beforeLabel: { type: String, default: '' },
  afterLabel: { type: String, default: '' },
  notFoundLabel: { type: String, default: '未知' }
})

const dict = useDict(dictName)

const tag = computed(() => {
  if (!dict || dict.value.length === 0) {
    return { label: '加载中...', type: 'default' as NTagType }
  }

  const foundItem: any = dict.value.find((item: any) => item.value === value)
  return {
    label: foundItem?.label || notFoundLabel,
    type: (foundItem?.style || 'default') as NTagType
  }
})
</script>
<style lang="scss" scoped></style>
