<script lang="ts" setup>
import type { BrowseFileItem, DirectoryItem } from '@/api/oss-browse'

defineProps<{
  visible: boolean
  x: number
  y: number
  target: BrowseFileItem | DirectoryItem | null
  type: 'file' | 'directory' | 'blank' | 'multi'
  selectedFiles: Set<string>
  currentGroupKey: string
  currentPrefix: string
  files: BrowseFileItem[]
}>()

defineEmits<{
  'update:visible': [value: boolean]
  refresh: []
  preview: [file: BrowseFileItem]
}>()
</script>

<template>
  <div><!-- FileBrowserContextMenu placeholder --></div>
</template>
