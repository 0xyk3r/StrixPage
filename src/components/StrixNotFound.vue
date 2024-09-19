<template>
  <div>
    <n-result description="生活总归带点荒谬" size="huge" status="404" title="404 资源不存在">
      <template #footer>
        <n-button @click="closeCurrentTab">{{ countDown }} 秒后返回首页</n-button>
      </template>
    </n-result>
  </div>
</template>

<script lang="ts" setup>
import { useTabsBarStore } from '@/stores/tabs-bar'

const route = useRoute()
const router = useRouter()
const tabsBarStore = useTabsBarStore()

const countDown = ref(5)

let timer: number | null = null
const clearTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const closeCurrentTab = () => {
  clearTimer()
  tabsBarStore.delVisitedRoute(route)
  router.push({ path: '/' })
}

onMounted(() => {
  timer = setInterval(() => {
    countDown.value--
    if (countDown.value === 0) {
      closeCurrentTab()
    }
  }, 1000)
})

onUnmounted(() => {
  clearTimer()
})
</script>
