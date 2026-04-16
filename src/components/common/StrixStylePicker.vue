<template>
  <div class="strix-style-picker">
    <n-space :size="8" align="center">
      <n-tag
        v-for="item in presets"
        :key="item.value"
        :type="item.type"
        :bordered="modelValue !== item.value"
        :class="{ 'strix-style-picker__selected': modelValue === item.value }"
        size="small"
        style="cursor: pointer"
        @click="selectStyle(item.value)"
      >
        {{ item.label }}
      </n-tag>
    </n-space>
  </div>
</template>

<script lang="ts" setup>
import type { NTagType } from '@/@types/naive-ui'

const modelValue = defineModel<string>('value', { default: 'DEFAULT' })

interface StylePreset {
  label: string
  value: string
  type: NTagType
}

const presets: StylePreset[] = [
  { label: '默认', value: 'DEFAULT', type: 'default' },
  { label: '主要', value: 'PRIMARY', type: 'primary' },
  { label: '成功', value: 'SUCCESS', type: 'success' },
  { label: '警告', value: 'WARNING', type: 'warning' },
  { label: '错误', value: 'ERROR', type: 'error' },
  { label: '信息', value: 'INFO', type: 'info' }
]

function selectStyle(value: string) {
  modelValue.value = value
}
</script>

<style lang="scss" scoped>
.strix-style-picker {
  &__selected {
    outline: 2px solid var(--primary-color);
    outline-offset: 1px;
    border-radius: 4px;
  }
}
</style>
