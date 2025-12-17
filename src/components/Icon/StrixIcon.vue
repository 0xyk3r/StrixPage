<template>
  <component :is="comp" class="strix-icon" v-bind="props" />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { getLucideComponent } from '@/components/Icon/StrixIconLoader.ts'

interface Props {
  icon?: string
  size?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: '',
  size: 18
})

// 转换 kebab-case 为 PascalCase
const convertToPascalCase = (str: string): string => {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

const comp = computed(() => {
  const iconName = props.icon.includes('-')
    ? convertToPascalCase(props.icon)
    : props.icon.charAt(0).toUpperCase() + props.icon.slice(1)
  return getLucideComponent(iconName)
})
</script>

<style lang="less" scoped>
.strix-icon {
  display: inline-block;
  vertical-align: text-bottom;
}
</style>
