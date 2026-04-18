<script lang="ts" setup>
defineProps<{
  currentGroupKey: string
}>()

defineEmits<{
  selectGroup: [groupKey: string, groupName: string]
}>()
</script>

<template>
  <div><!-- FileBrowserSidebar placeholder --></div>
</template>
