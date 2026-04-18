<script lang="ts" setup>
defineProps<{
  groupName: string
  breadcrumb: string[]
  viewMode: 'grid' | 'list'
  sortBy: string
  sortOrder: string
  canGoBack: boolean
  canGoForward: boolean
  currentGroupKey: string
  currentPrefix: string
}>()

defineEmits<{
  navigateBack: []
  navigateForward: []
  breadcrumbClick: [index: number]
  'update:viewMode': [value: 'grid' | 'list']
  sortChange: [sortBy: string, sortOrder: string]
  search: [keyword: string]
  mkdir: []
  uploadComplete: []
}>()
</script>

<template>
  <div><!-- FileBrowserToolbar placeholder --></div>
</template>
