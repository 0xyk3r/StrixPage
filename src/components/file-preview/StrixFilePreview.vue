<script lang="ts" setup>
import type { BrowseFileItem } from '@/api/oss-browse'

defineProps<{
  visible: boolean
  files: BrowseFileItem[]
  initialIndex: number
}>()

defineEmits<{
  'update:visible': [value: boolean]
}>()
</script>

<template>
  <div><!-- StrixFilePreview placeholder --></div>
</template>
