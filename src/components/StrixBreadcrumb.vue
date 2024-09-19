<template>
  <div ref="breadcrumbContainerRef" class="breadcrumb-container">
    <n-breadcrumb separator="/">
      <n-breadcrumb-item
        v-for="item in breadcrumbList"
        :key="item.path"
        :clickable="!item.meta.empty"
        @click="jumpRoute(item)"
      >
        <n-icon v-if="item.meta.icon">
          <Icon :icon="item.meta.icon" :width="16" />
        </n-icon>
        {{ item.meta._title || item.meta.title }}
      </n-breadcrumb-item>
    </n-breadcrumb>
  </div>
</template>

<script setup lang="ts">
import { useStrixSettingsStore } from '@/stores/strix-settings'
import { replaceDynamicName } from '@/utils/dynamic-component-util'
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'
import type { RouteLocationMatched } from 'vue-router'

const route = useRoute()
const router = useRouter()

const globalSettingsStore = useStrixSettingsStore()
const { isSmallWindow } = storeToRefs(globalSettingsStore)
watch(isSmallWindow, () => {
  getBreadcrumbList()
})

const breadcrumbContainerRef = ref<HTMLElement | null>(null)
const breadcrumbList = ref<any[]>([])

// 处理动态路由标题
const handleRouteDynamicTitle = (item: RouteLocationMatched) => {
  const titleTemplate = item.meta.titleTemplate
  if (titleTemplate) {
    item.meta._title = replaceDynamicName(titleTemplate, route.params)
    item.meta._path = replaceDynamicName(item.path, route.params)
  }
}

const getBreadcrumbList = () => {
  const matchedRoutes = route.matched.filter((r) => r.name && (r.meta.title || r.meta.icon))

  // 处理动态路由标题
  matchedRoutes.forEach((item, index) => {
    if (item.meta.parentRouteName) {
      // 如果存在父级路由，则插入
      const parentRoute = router.getRoutes().find((r) => r.name === item.meta.parentRouteName)
      if (parentRoute && !matchedRoutes.some((r) => r.name === parentRoute.name)) {
        matchedRoutes.splice(index, 0, parentRoute)
        handleRouteDynamicTitle(parentRoute)
      }
    }
    handleRouteDynamicTitle(item)
  })

  breadcrumbList.value = isSmallWindow.value
    ? [matchedRoutes[matchedRoutes.length - 1]]
    : matchedRoutes
}

const jumpRoute = (item: RouteLocationMatched) => {
  if (item.path === '') {
    item.path = '/'
  }
  if (!item.meta.empty && item.path && item.path !== route.path) {
    router.push(item.meta._path || item.path)
  }
}

watch(
  () => route.path,
  () => {
    getBreadcrumbList()
    // 滚动到最右侧
    nextTick(() => {
      if (breadcrumbContainerRef.value) {
        breadcrumbContainerRef.value.scrollTo({
          left: breadcrumbContainerRef.value.scrollWidth,
          behavior: 'smooth'
        })
      }
    })
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.breadcrumb-container {
  width: 100%;
  height: 100%;
  max-width: 100%;
  display: flex;
  align-items: center;

  white-space: nowrap;
  overflow-x: scroll;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  // 屏幕小于 1280px 时不显示
  @media (max-width: 1280px) {
    display: none;
  }
}
</style>
