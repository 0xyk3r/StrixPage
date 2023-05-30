<template>
  <div>waiting to redirect.</div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const $route = useRoute()
const $router = useRouter()

const replaceAll = (str, substr, replacement) => {
  if (str == null) return str
  return str.replace(new RegExp(substr, 'gm'), replacement)
}

onMounted(() => {
  const { path } = $route
  $router.replace(`${replaceAll(path, '/redirect', '')}`)
})
</script>
