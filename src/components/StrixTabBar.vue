<template>
  <div id="tabs-bar-container" class="tabs-bar-container">
    <n-tabs
      :value="tabActive"
      animated
      class="tabs-content"
      type="card"
      @close="closeTab"
      @update:value="handleTabClick"
    >
      <n-tab
        v-for="(item, index) in visitedRoutes"
        :key="getRouteKey(item)"
        :closable="!isAffix(item)"
        :name="getRouteKey(item)"
        @contextmenu.prevent.stop="handleTabContextmenu($event, index)"
      >
        {{ item.meta.title }}
      </n-tab>
    </n-tabs>

    <div class="tabs-bar-bottom-bar"></div>

    <Teleport defer to="#strix-tool-bar-item">
      <n-dropdown :options="contextmenuList" placement="bottom-start" trigger="hover" @select="handleContextmenuSelect">
        <n-icon-wrapper
          :border-radius="5"
          :color="themeVars.actionColor"
          :icon-color="themeVars.textColorBase"
          :size="32"
        >
          <n-icon :size="18">
            <StrixIcon class="tabs-common-handler" icon="compass" />
          </n-icon>
        </n-icon-wrapper>
      </n-dropdown>
    </Teleport>

    <teleport to=".n-config-provider">
      <n-dropdown
        :options="contextmenuList"
        :show="showRightMenu"
        :x="contextmenuPosition.x"
        :y="contextmenuPosition.y"
        placement="bottom-start"
        trigger="manual"
        @clickoutside="clearContextmenuSelect"
        @select="handleContextmenuSelect"
      />
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { EventBus } from '@/plugins/event-bus'
import { useQuickMenuStore } from '@/stores/quick-menu'
import { useTabsBarStore } from '@/stores/tabs-bar'
import { useThemeVars } from 'naive-ui'
import { storeToRefs } from 'pinia'
import StrixIcon from '@/components/Icon/StrixIcon.vue'

const route = useRoute()
const router = useRouter()
const tabsBarStore = useTabsBarStore()
const quickMenuStore = useQuickMenuStore()
const themeVars = useThemeVars()

const { visitedRoutes } = storeToRefs(tabsBarStore)
const tabActive = ref()

// 获取路由的唯一标识符，优先使用 fullPath，对于 fixed 标签页可能使用 path
const getRouteKey = (route: any): string => {
  return route.fullPath || route.path || route.name || ''
}

// tabs的右击相关逻辑
const showRightMenu = ref(false)
let contextmenuRoutesIndex: number | null = null
const contextmenuPosition = ref({ x: 0, y: 0 })
const contextmenuList = [
  {
    key: 'closeCurrTabs',
    label: '关闭',
    icon: () => h(StrixIcon, { icon: 'x' })
  },
  {
    key: 'reloadRouter',
    label: '刷新',
    icon: () => h(StrixIcon, { icon: 'rotate-cw' })
  },
  {
    key: 'reloadAllRouter',
    label: '刷新全部',
    icon: () => h(StrixIcon, { icon: 'refresh-cw' })
  },
  {
    key: 'closeLeftTabs',
    label: '关闭左侧',
    icon: () => h(StrixIcon, { icon: 'panel-left-close' })
  },
  {
    key: 'closeRightTabs',
    label: '关闭右侧',
    icon: () => h(StrixIcon, { icon: 'panel-right-close' })
  },
  {
    key: 'closeOtherTabs',
    label: '关闭其他',
    icon: () => h(StrixIcon, { icon: 'copy-minus' })
  },
  {
    key: 'closeAllTabs',
    label: '关闭全部',
    icon: () => h(StrixIcon, { icon: 'copy-x' })
  }
]
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
  // 添加 当前路由 标签页
  const { name, meta } = route
  if (name && meta.title && !meta.empty) {
    tabsBarStore.addVisitedRoute(route)
  }
  // 设置当前激活的标签页
  nextTick(() => {
    const activeRoute = visitedRoutes.value.find((item) => item.path === route.path)
    tabActive.value = activeRoute ? getRouteKey(activeRoute) : ''
  })
}
watch(() => route.path, setupTabs, { immediate: true })

// 点击标签页
const handleTabClick = (tabKey: string) => {
  const r = visitedRoutes.value.find((item) => getRouteKey(item) === tabKey)
  if (r?.path !== route.path) {
    router.push({ path: r.path, query: r.query })
  }
}

// 关闭标签页
const closeTab = async (tabKey: string) => {
  const index = visitedRoutes.value.findIndex((item) => getRouteKey(item) === tabKey)
  if (index !== -1) {
    const view = visitedRoutes.value[index]
    // 如果关闭的是当前标签页 则跳转
    if (isActive(view)) {
      if (index - 1 < 0) {
        if (visitedRoutes.value.length > 1) {
          await router.push(visitedRoutes.value[index + 1])
        } else {
          await router.push('/')
        }
      } else {
        await router.push(visitedRoutes.value[index - 1])
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

  // 固定标签页不允许关闭
  if (view?.meta?.fixed) {
    return
  }

  if (view) {
    closeTab(getRouteKey(view))
  }
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

// 一些通用处理函数
const isActive = (r: any) => route.path === r.path
const isAffix = (r: any) => r.meta?.fixed
const getContextmenuTagView = () => {
  const index = contextmenuRoutesIndex ?? visitedRoutes.value.findIndex((r: any) => tabActive.value === getRouteKey(r))
  return visitedRoutes.value[index]
}
</script>

<style lang="scss" scoped>
.tabs-bar-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  z-index: 499;
  user-select: none;
  box-sizing: border-box;
  transition: border 0.3s var(--n-bezier);

  // 屏幕小于 1280px 时不显示
  @media (max-width: 1280px) {
    display: none;
  }

  .tabs-content {
    height: 34px;
  }

  .tabs-bar-bottom-bar {
    position: absolute;
    bottom: 4px;
    left: 0;
    width: 100%;
    height: 4px;
    border-radius: 4px;
    background-color: var(--n-border-color);
    transition: background-color 0.3s var(--n-bezier);
  }
}

::v-deep(.tabs-content) {
  .n-tabs-nav-scroll-content {
    justify-content: center;

    .n-tabs-wrapper {
      .n-tabs-tab-wrapper {
        .n-tabs-tab {
          box-sizing: border-box;
          height: 34px;
          line-height: 34px;
          transition:
            all 0.3s var(--n-bezier),
            width 0.6s !important;
          padding-right: 20px;

          .n-base-close {
            width: 0;
            margin-left: 0;
            overflow: hidden;
            transform-origin: 100% 50%;
            transition: all 0.3s var(--n-bezier);

            .n-base-icon {
              overflow: hidden;
            }
          }

          &:after {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 0;
            height: 2px;
            content: '';
            background-color: var(--n-tab-text-color-active);
            transition:
              all 0.3s var(--n-bezier),
              border 0s,
              color 0.1s,
              font-size 0s;
          }

          &:hover {
            border: 1px solid var(--n-tab-text-color-hover);

            &.n-tabs-tab--closable {
              padding-right: 10px;

              .n-base-close {
                width: 18px;
                margin-left: 6px;
              }
            }

            &:after {
              width: 100%;
            }
          }
        }

        .n-tabs-tab--active {
          &:after {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 2px;
            content: '';
            background-color: var(--n-tab-text-color-active);
            transition:
              all 0.3s var(--n-bezier),
              border 0s,
              color 0.1s,
              font-size 0s;
          }
        }

        .n-tabs-tab-pad {
          width: 6px;
          border: none;
        }
      }
    }

    .n-tabs-pad {
      flex-grow: 0 !important;
      border: none !important;
    }
  }
}

.tabs-common-handler {
  color: var(--n-tab-text-color);
  outline: none;
  cursor: pointer;
  transition: transform 1s;
}

.tabs-common-handler:hover {
  color: #63e2b7;
  transform: rotate(90deg);
}
</style>
