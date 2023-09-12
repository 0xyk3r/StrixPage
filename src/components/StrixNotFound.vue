<template>
  <div>
    <n-result status="404" title="404 资源不存在" description="生活总归带点荒谬" size="huge">
      <template #footer>
        <n-button @click="closeCurrentTab">{{ countDown }} 秒后返回首页</n-button>
      </template>
    </n-result>
  </div>
</template>

<script setup>
import { useTabsBarStore } from '@/stores/tabs-bar'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const $route = useRoute()
const $router = useRouter()
const tabsBarStore = useTabsBarStore()

let timer = null
const countDown = ref(5)

const closeCurrentTab = () => {
  if (timer) clearInterval(timer)
  tabsBarStore.delVisitedRoute($route)
  $router.push({ path: '/' })
}

onMounted(() => {
  timer = setInterval(() => {
    countDown.value--
    if (countDown.value === 0) {
      clearInterval(timer)
      closeCurrentTab()
    }
  }, 1000)
})
</script>
