<template>
  <div ref="breadcrumbContainerRef" class="breadcrumb-container">
    <n-breadcrumb separator="/">
      <n-breadcrumb-item
        v-for="item in breadcrumbList"
        :key="item.path"
        :clickable="!item.meta.empty"
        @click="jumpRoute(item)"
      >
        <StrixIcon v-if="item.meta.icon" :icon="item.meta.icon" :width="16" />
        {{ item.meta._title || item.meta.title }}
      </n-breadcrumb-item>
    </n-breadcrumb>
  </div>
</template>

<script lang="ts" setup>
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

  breadcrumbList.value = isSmallWindow.value ? [matchedRoutes[matchedRoutes.length - 1]] : matchedRoutes
}

const jumpRoute = (item: RouteLocationMatched) => {
  // 忽略动态包装组件
  if (item.meta.isDynamicWrapper) {
    return
  }
  if (item.path === '') {
    item.path = '/'
  }
  if (!item.meta.empty && item.path && item.path !== route.path) {
    router.push(item.meta._path || item.path)
  }
}

// 鼠标滚轮横向滚动优化
onMounted(() => {
  if (breadcrumbContainerRef.value) {
    breadcrumbContainerRef.value.addEventListener('wheel', handleWheel, { passive: false })
  }
})

onUnmounted(() => {
  if (breadcrumbContainerRef.value) {
    breadcrumbContainerRef.value.removeEventListener('wheel', handleWheel)
  }
})

const handleWheel = (e: WheelEvent) => {
  if (breadcrumbContainerRef.value) {
    // 阻止默认纵向滚动
    e.preventDefault()
    // 将纵向滚动转为横向滚动
    breadcrumbContainerRef.value.scrollLeft += e.deltaY
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
  width: 210px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scroll-behavior: smooth;

  // 隐藏滚动条 - 跨浏览器
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  // 屏幕小于 1280px 时不显示
  @media (max-width: 1280px) {
    display: none;
  }

  // 添加渐变遮罩效果（当内容溢出时）
  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 40px;
    background: linear-gradient(to right, transparent, var(--n-color));
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::after {
    opacity: 1;
  }

  ::v-deep(.n-breadcrumb) {
    flex-wrap: nowrap;

    .n-breadcrumb-item {
      flex-shrink: 0;

      .n-breadcrumb-item__link {
        max-width: none;
      }

      .n-breadcrumb-item__link,
      .n-breadcrumb-item__separator {
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}
</style>
