<template>
  <div class="breadcrumb-container">
    <n-breadcrumb separator="/">
      <n-breadcrumb-item
        v-for="item in breadcrumbList"
        :key="item.path"
        :clickable="!item.meta.empty"
        @click="jumpPage(item)"
      >
        {{ item.meta._title || item.meta.title }}
      </n-breadcrumb-item>
    </n-breadcrumb>
  </div>
</template>

<script setup lang="ts">
import { useStrixSettingsStore } from '@/stores/strix-settings'
import { replaceDynamicName } from '@/utils/dynamic-component-util'
import { NBreadcrumb, NBreadcrumbItem } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import type { RouteLocationMatched } from 'vue-router'
import { useRoute, useRouter } from 'vue-router'

const $route = useRoute()
const $router = useRouter()

const globalSettingsStore = useStrixSettingsStore()
const { isSmallWindow } = storeToRefs(globalSettingsStore)
watch(isSmallWindow, () => {
  getBreadcrumbList()
})

const breadcrumbList = ref<RouteLocationMatched[]>([])

// 处理动态路由标题
const handleRouteDynamicTitle = (item: RouteLocationMatched) => {
  const titleTemplate = item.meta.titleTemplate as string
  if (titleTemplate) {
    item.meta._title = replaceDynamicName(titleTemplate, $route.params)
    item.meta._path = replaceDynamicName(item.path, $route.params)
  }
}

const getBreadcrumbList = () => {
  const blist = $route.matched.filter((item) => item.name && item.meta.title)

  // 处理动态父路由 (未测试多级父路由情况)
  blist.forEach((item, index) => {
    if (item.meta.parentRoute) {
      // 在所有路由中查找, 并插入到当前路由的前面
      const parentRoute = $router.getRoutes().find((route) => route.name === item.meta.parentRoute)
      // 判断是否已存在于blist中, 避免重复添加
      if (parentRoute && !blist.some((route) => route.name === parentRoute.name)) {
        blist.splice(index, 0, parentRoute)
        handleRouteDynamicTitle(parentRoute)
      }
    }
    handleRouteDynamicTitle(item)
  })

  breadcrumbList.value = isSmallWindow.value ? [blist[blist.length - 1]] : blist
}

const jumpPage = (item: RouteLocationMatched) => {
  if (!item.meta.empty && item.path) {
    $router.push(item.meta._path || item.path)
  }
}

watch(
  () => $router.currentRoute.value.path,
  () => {
    getBreadcrumbList()
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.breadcrumb-container {
  height: 60px;
  display: flex;
  align-items: center;

  .n-breadcrumb {
    line-height: 25px;
  }
}
</style>
