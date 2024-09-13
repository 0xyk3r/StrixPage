<template>
  <div>waiting to redirect.</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const $route = useRoute()
const $router = useRouter()

const replaceAll = (str: string, substr: string, replacement: string) => {
  return str?.replace(new RegExp(substr, 'gm'), replacement) ?? str
}

onMounted(() => {
  const newPath = replaceAll($route.path, '/redirect', '')
  $router.replace(newPath)
})
</script>
