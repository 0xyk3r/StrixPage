<template>
  <nav class="nebula-breadcrumb">
    <template v-for="(item, index) in breadcrumbList" :key="item.path">
      <!-- 分隔符 -->
      <span v-if="index > 0" class="nebula-crumb__sep">›</span>

      <!-- 面包屑项 -->
      <div
        :class="[
          'nebula-crumb',
          {
            'nebula-crumb--link': !item.meta.empty && item.path !== route.path,
            'nebula-crumb--current': index === breadcrumbList.length - 1
          }
        ]"
        @click="jumpRoute(item)"
      >
        <span v-if="item.meta.icon" class="nebula-crumb__icon">
          <StrixIcon :icon="item.meta.icon" :size="13" />
        </span>
        <span>{{ item.meta._title || item.meta.title }}</span>
      </div>
    </template>
  </nav>
</template>

<script lang="ts" setup>
import StrixIcon from '@/components/icon/StrixIcon.vue'
import { useStrixSettingsStore } from '@/stores/strix-settings.ts'
import { replaceDynamicName } from '@/utils/dynamic-component-util.ts'
import { storeToRefs } from 'pinia'
import type { RouteLocationMatched } from 'vue-router'

const route = useRoute()
const router = useRouter()

const globalSettingsStore = useStrixSettingsStore()
const { isSmallWindow } = storeToRefs(globalSettingsStore)
watch(isSmallWindow, () => {
  getBreadcrumbList()
})

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

  matchedRoutes.forEach((item, index) => {
    if (item.meta.parentRouteName) {
      const parentRoute = router.getRoutes().find((r) => r.name === item.meta.parentRouteName)
      if (parentRoute && !matchedRoutes.some((r) => r.name === parentRoute.name)) {
        matchedRoutes.splice(index, 0, parentRoute)
        handleRouteDynamicTitle(parentRoute)
      }
    }
    handleRouteDynamicTitle(item)
  })

  breadcrumbList.value = isSmallWindow.value ? [matchedRoutes[matchedRoutes.length - 1]] : matchedRoutes
}

const jumpRoute = (item: RouteLocationMatched) => {
  if (item.meta.isDynamicWrapper) return
  if (item.path === '') item.path = '/'
  if (!item.meta.empty && item.path && item.path !== route.path) {
    router.push(item.meta._path || item.path)
  }
}

watch(
  () => route.path,
  () => {
    getBreadcrumbList()
  },
  { immediate: true }
)
</script>
