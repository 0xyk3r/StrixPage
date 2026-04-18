<script lang="ts" setup>
defineProps<{
  groupKey: string
  currentPrefix: string
}>()

defineEmits<{
  uploadComplete: []
}>()
</script>

<template>
  <div><slot /></div>
</template>
