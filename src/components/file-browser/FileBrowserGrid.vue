<script lang="ts" setup>
import type { BrowseFileItem, DirectoryItem } from '@/api/oss-browse'

defineProps<{
  directories: DirectoryItem[]
  files: BrowseFileItem[]
  selectedFiles: Set<string>
  loading: boolean
}>()

defineEmits<{
  itemDoubleClick: [item: BrowseFileItem | DirectoryItem]
  contextMenu: [event: MouseEvent, target: BrowseFileItem | DirectoryItem | null, type: 'file' | 'directory' | 'blank' | 'multi']
  'update:selectedFiles': [value: Set<string>]
}>()
</script>

<template>
  <div><!-- FileBrowserGrid placeholder --></div>
</template>
