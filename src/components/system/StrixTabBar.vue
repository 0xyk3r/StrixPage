<template>
  <div class="nebula-tabs">
    <!-- 左滚动箭头 -->
    <button :class="['nebula-tabs__arrow', { visible: canScrollLeft }]" @click="scrollLeft">
      <StrixIcon icon="chevron-left" :size="12" />
    </button>

    <!-- 标签滚动区域 -->
    <div ref="scrollRef" class="nebula-tabs__scroll" @wheel.prevent="handleWheel">
      <div
        v-for="(item, index) in visitedRoutes"
        :key="getRouteKey(item)"
        :class="[
          'nebula-tab',
          {
            'nebula-tab--active': isActive(item),
            'nebula-tab--fixed': isAffix(item)
          }
        ]"
        @click="handleTabClick(getRouteKey(item))"
        @contextmenu.prevent.stop="handleTabContextmenu($event, index)"
      >
        <StrixIcon v-if="isAffix(item)" icon="pin" :size="10" class="nebula-tab__pin" />
        <span class="nebula-tab__text">{{ item.meta.title }}</span>
        <button v-if="!isAffix(item)" class="nebula-tab__close" @click.stop="closeTab(getRouteKey(item))">
          <StrixIcon icon="x" :size="10" />
        </button>
      </div>
    </div>

    <!-- 右滚动箭头 -->
    <button :class="['nebula-tabs__arrow', { visible: canScrollRight }]" @click="scrollRight">
      <StrixIcon icon="chevron-right" :size="12" />
    </button>

    <!-- 标签数量 -->
    <div v-if="visitedRoutes.length > 3" class="nebula-tabs__count">{{ visitedRoutes.length }}</div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div
        v-if="showRightMenu"
        class="nebula-context-menu"
        :style="{ left: contextmenuPosition.x + 'px', top: contextmenuPosition.y + 'px' }"
      >
        <div class="nebula-context-item" @click="handleContextmenuSelect('closeCurrTabs')">
          <StrixIcon icon="x" :size="14" />
          <span>关闭</span>
        </div>
        <div class="nebula-context-item" @click="handleContextmenuSelect('reloadRouter')">
          <StrixIcon icon="rotate-cw" :size="14" />
          <span>刷新</span>
        </div>
        <div class="nebula-context-item" @click="handleContextmenuSelect('reloadAllRouter')">
          <StrixIcon icon="refresh-cw" :size="14" />
          <span>刷新全部</span>
        </div>
        <div class="nebula-context-divider" />
        <div class="nebula-context-item" @click="handleContextmenuSelect('closeLeftTabs')">
          <StrixIcon icon="panel-left-close" :size="14" />
          <span>关闭左侧</span>
        </div>
        <div class="nebula-context-item" @click="handleContextmenuSelect('closeRightTabs')">
          <StrixIcon icon="panel-right-close" :size="14" />
          <span>关闭右侧</span>
        </div>
        <div class="nebula-context-item" @click="handleContextmenuSelect('closeOtherTabs')">
          <StrixIcon icon="copy-minus" :size="14" />
          <span>关闭其他</span>
        </div>
        <div class="nebula-context-divider" />
        <div class="nebula-context-item nebula-context-item--danger" @click="handleContextmenuSelect('closeAllTabs')">
          <StrixIcon icon="copy-x" :size="14" />
          <span>关闭全部</span>
        </div>
      </div>
    </Teleport>

    <!-- 全局点击关闭右键菜单 -->
    <Teleport to="body">
      <div
        v-if="showRightMenu"
        class="nebula-context-backdrop"
        @click="clearContextmenuSelect"
        @contextmenu.prevent="clearContextmenuSelect"
      />
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { EventBus } from '@/plugins/event-bus.ts'
import { useQuickMenuStore } from '@/stores/quick-menu.ts'
import { useTabsBarStore } from '@/stores/tabs-bar.ts'
import { storeToRefs } from 'pinia'
import StrixIcon from '@/components/icon/StrixIcon.vue'

const route = useRoute()
const router = useRouter()
const tabsBarStore = useTabsBarStore()
const quickMenuStore = useQuickMenuStore()

const { visitedRoutes } = storeToRefs(tabsBarStore)
const tabActive = ref()

// 滚动相关
const scrollRef = ref<HTMLDivElement>()
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const checkScroll = () => {
  const el = scrollRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 2
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 2
}

const scrollLeft = () => {
  scrollRef.value?.scrollBy({ left: -160, behavior: 'smooth' })
}

const scrollRight = () => {
  scrollRef.value?.scrollBy({ left: 160, behavior: 'smooth' })
}

const handleWheel = (e: WheelEvent) => {
  scrollRef.value?.scrollBy({ left: e.deltaY > 0 ? 80 : -80 })
}

// 滚动到当前活动标签
const scrollToActive = () => {
  nextTick(() => {
    const el = scrollRef.value
    if (!el) return
    const activeTab = el.querySelector('.nebula-tab--active') as HTMLElement
    if (activeTab) {
      const tabLeft = activeTab.offsetLeft
      const tabWidth = activeTab.offsetWidth
      const scrollLeft = el.scrollLeft
      const visibleWidth = el.clientWidth

      if (tabLeft < scrollLeft) {
        el.scrollTo({ left: tabLeft - 8, behavior: 'smooth' })
      } else if (tabLeft + tabWidth > scrollLeft + visibleWidth) {
        el.scrollTo({ left: tabLeft + tabWidth - visibleWidth + 8, behavior: 'smooth' })
      }
    }
    checkScroll()
  })
}

onMounted(() => {
  checkScroll()
  const el = scrollRef.value
  if (el) {
    el.addEventListener('scroll', checkScroll, { passive: true })
    const observer = new ResizeObserver(checkScroll)
    observer.observe(el)
    onUnmounted(() => {
      el.removeEventListener('scroll', checkScroll)
      observer.disconnect()
    })
  }
})

// 获取路由的唯一标识符
const getRouteKey = (route: any): string => {
  return route.fullPath || route.path || route.name || ''
}

// tabs的右击相关逻辑
const showRightMenu = ref(false)
let contextmenuRoutesIndex: number | null = null
const contextmenuPosition = ref({ x: 0, y: 0 })

const handleTabContextmenu = (e: MouseEvent, index: number): void => {
  showRightMenu.value = true
  contextmenuRoutesIndex = index
  contextmenuPosition.value = { x: e.x, y: e.y }
}

const clearContextmenuSelect = () => {
  showRightMenu.value = false
  setTimeout(() => {
    contextmenuRoutesIndex = null
  }, 50)
}

const handleContextmenuSelect = (key: string) => {
  const actions: Record<string, () => void> = {
    reloadRouter,
    reloadAllRouter,
    closeCurrTabs,
    closeOtherTabs,
    closeLeftTabs,
    closeRightTabs,
    closeAllTabs
  }
  actions[key]?.()
  clearContextmenuSelect()
}

// 添加 fixed 标签页
const fixedTabs = computed(() =>
  router
    .getRoutes()
    .filter((r) => r.meta.fixed)
    .sort((a, b) => (a.meta.fixedIndex ?? 0) - (b.meta.fixedIndex ?? 0))
)
watch(
  fixedTabs,
  (fixedTabs) => {
    fixedTabs.forEach((fixedTab: any) => {
      tabsBarStore.addVisitedRoute(fixedTab)
    })
  },
  { immediate: true }
)

// 初始化标签页
const setupTabs = () => {
  const { name, meta } = route
  if (name && meta.title && !meta.empty) {
    tabsBarStore.addVisitedRoute(route)
    tabsBarStore.saveRouteState(route.path)
  }
  nextTick(() => {
    const activeRoute = visitedRoutes.value.find((item) => item.path === route.path)
    tabActive.value = activeRoute ? getRouteKey(activeRoute) : ''
  })
  scrollToActive()
}
watch(() => route.path, setupTabs, { immediate: true })

// 点击标签页
const handleTabClick = (tabKey: string) => {
  const r = visitedRoutes.value.find((item) => getRouteKey(item) === tabKey)
  if (r?.path !== route.path) {
    const state = tabsBarStore.getRouteState(r.path)
    router.push({ path: r.path, query: r.query, state })
  }
}

// 关闭标签页
const closeTab = async (tabKey: string) => {
  const index = visitedRoutes.value.findIndex((item) => getRouteKey(item) === tabKey)
  if (index !== -1) {
    const view = visitedRoutes.value[index]
    if (isActive(view)) {
      if (index - 1 < 0) {
        if (visitedRoutes.value.length > 1) {
          const target = visitedRoutes.value[index + 1]
          const state = tabsBarStore.getRouteState(target.path)
          await router.push({ path: target.path, query: target.query, state })
        } else {
          await router.push('/')
        }
      } else {
        const target = visitedRoutes.value[index - 1]
        const state = tabsBarStore.getRouteState(target.path)
        await router.push({ path: target.path, query: target.query, state })
      }
    }
    tabsBarStore.delVisitedRoute(view)
  }
}

const reloadRouter = async () => {
  const oldIndex =
    contextmenuRoutesIndex ?? visitedRoutes.value.findIndex((r: any) => tabActive.value === getRouteKey(r))
  const view: any = visitedRoutes.value[oldIndex]
  if (view) {
    const currentPath = view.fullPath || view.path
    view.oldIndex = view.meta.fixed ? view.meta.fixedIndex : oldIndex
    tabsBarStore.addRefreshRoutes(view)
    tabsBarStore.delVisitedRoute(view)
    quickMenuStore.delAllQuickMenu()
    await router.push('/redirect' + currentPath)
  }
}

const reloadAllRouter = () => {
  EventBus.emit('reload-router-view')
}

const closeCurrTabs = () => {
  const view = getContextmenuTagView()
  if (view?.meta?.fixed) return
  if (view) closeTab(getRouteKey(view))
}

const closeOtherTabs = () => {
  const view = getContextmenuTagView()
  if (view) {
    tabsBarStore.delOthersVisitedRoute(view)
    nextTick(() => {
      if (!visitedRoutes.value.some((r: any) => tabActive.value === getRouteKey(r))) {
        router.push('/redirect' + (view.fullPath || view.path))
      }
    })
  }
}

const closeLeftTabs = () => {
  const view = getContextmenuTagView()
  if (view) {
    tabsBarStore.delLeftVisitedRoute(view)
    nextTick(() => {
      if (!visitedRoutes.value.some((r: any) => tabActive.value === getRouteKey(r))) {
        router.push('/redirect' + (view.fullPath || view.path))
      }
    })
  }
}

const closeRightTabs = () => {
  const view = getContextmenuTagView()
  if (view) {
    tabsBarStore.delRightVisitedRoute(view)
    nextTick(() => {
      if (!visitedRoutes.value.some((r: any) => tabActive.value === getRouteKey(r))) {
        router.push('/redirect' + (view.fullPath || view.path))
      }
    })
  }
}

const closeAllTabs = async () => {
  tabsBarStore.delAllVisitedRoutes()
  const defaultView = visitedRoutes.value[0]
  await router.push(defaultView ?? '/')
}

// 通用函数
const isActive = (r: any) => route.path === r.path
const isAffix = (r: any) => r.meta?.fixed
const getContextmenuTagView = () => {
  const index = contextmenuRoutesIndex ?? visitedRoutes.value.findIndex((r: any) => tabActive.value === getRouteKey(r))
  return visitedRoutes.value[index]
}
</script>

<style lang="scss" scoped>
// 右键菜单透明遮罩
.nebula-context-backdrop {
  position: fixed;
  inset: 0;
  z-index: calc($z-popover - 1);
}
</style>
