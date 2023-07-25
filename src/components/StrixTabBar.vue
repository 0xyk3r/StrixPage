<template>
  <div id="tabs-bar-container" class="tabs-bar-container">
    <n-tabs :value="tabActive" type="card" class="tabs-content" animated @update:value="handleTabClick"
      @close="handleTabRemove">
      <n-tab v-for="(item, index) in visitedRoutes" :key="item.name" :name="item.meta.title" :closable="!isAffix(item)"
        @contextmenu.prevent.stop="handleTabContextmenu($event, index)" />
    </n-tabs>

    <n-dropdown trigger="hover" placement="bottom-start" :options="contextmenuList" @select="handleContextmenuSelect">
      <Icon icon="ion:grid" class="tabs-common-handler" :width="20" />
    </n-dropdown>

    <teleport to=".n-config-provider">
      <n-dropdown placement="bottom-start" trigger="manual" :x="contextmenuPosition.x" :y="contextmenuPosition.y"
        :options="contextmenuList" :show="showRightMenu" @select="handleContextmenuSelect" />
    </teleport>
  </div>
</template>

<script>
import { useQuickMenuStore } from '@/stores/quick-menu'
import { useTabsBarStore } from '@/stores/tabs-bar'
import { Icon } from '@iconify/vue'
import { computed, defineComponent, getCurrentInstance, h, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default defineComponent({
  name: 'StrixTabsBar',
  components: {
    Icon
  },
  setup() {
    const { proxy } = getCurrentInstance()
    const $route = useRoute()
    const $router = useRouter()
    const tabsBarStore = useTabsBarStore()
    const quickMenuStore = useQuickMenuStore()

    const visitedRoutes = computed(() => tabsBarStore.visitedRoutes)
    // 监听路由变化
    const tabActiveRef = ref()

    // tabs的右击相关逻辑
    const showRightMenuRef = ref()
    let contextmenuRoutesIndex = ''
    const contextmenuPosition = ref({ x: 0, y: 0 })
    const contextmenuList = [
      {
        key: 'reloadRouter',
        label: '刷新',
        icon: () => h(Icon, { icon: 'ion:reload-outline' })
      },
      {
        key: 'reloadAllRouter',
        label: '刷新全部',
        icon: () => h(Icon, { icon: 'ion:reload-circle-outline' })
      },
      {
        key: 'closeOtherTabs',
        label: '关闭其他',
        icon: () => h(Icon, { icon: 'ion:close-outline' })
      },
      {
        key: 'closeLeftTabs',
        label: '关闭左侧',
        icon: () => h(Icon, { icon: 'ion:arrow-undo-outline' })
      },
      {
        key: 'closeRightTabs',
        label: '关闭右侧',
        icon: () => h(Icon, { icon: 'ion:arrow-redo-outline' })
      },
      {
        key: 'closeAllTabs',
        label: '关闭全部',
        icon: () => h(Icon, { icon: 'ion:power-outline' })
      }
    ]
    const handleTabContextmenu = (e, index) => {
      showRightMenuRef.value = true
      contextmenuRoutesIndex = index
      contextmenuPosition.value.x = e.x
      contextmenuPosition.value.y = e.y
    }
    const handleContextmenuSelect = (key) => {
      showRightMenuRef.value = false
      switch (key) {
        case 'reloadRouter':
          reloadRouter()
          break
        case 'reloadAllRouter':
          reloadAllRouter()
          break
        case 'closeOtherTabs':
          closeOtherTabs()
          break
        case 'closeLeftTabs':
          closeLeftTabs()
          break
        case 'closeRightTabs':
          closeRightTabs()
          break
        case 'closeAllTabs':
          closeAllTabs()
          break
      }
      // 延迟50ms清除选择的tab记录
      setTimeout(() => {
        contextmenuRoutesIndex = ''
      }, 50)
    }
    onMounted(() => {
      // 点击任意地方隐藏右键菜单
      proxy.$EventBus.on('click-container', () => {
        showRightMenuRef.value = false
      })
    })

    // 初始化标签页
    const initTabs = () => {
      // 添加 fixed 标签页
      const routes = $router.getRoutes()
      routes.forEach(r => {
        if (r.meta.fixed) {
          tabsBarStore.addVisitedRoute(r)
        }
      })
      // 添加 当前路由 标签页
      const { name, meta } = $route
      if (name && meta.title && !meta.empty) {
        tabsBarStore.addVisitedRoute($route)
      }
    }

    const handleTabClick = (tab) => {
      const route = visitedRoutes.value.filter((item) => {
        if (item.meta.title === tab) {
          return item
        }
      })[0]
      if ($router.currentRoute.value.fullPath !== route.path) {
        $router.push({
          path: route.path,
          query: route.query,
          fullPath: route.fullPath
        })
      } else {
        return false
      }
    }
    const handleTabRemove = async (tab) => {
      let view
      let currentIndex = 0
      for (let i = 0; i < visitedRoutes.value.length; i++) {
        const item = visitedRoutes.value[i]
        if (tab === item.meta.title) {
          view = item
          currentIndex = i
          break
        }
      }
      if (view) {
        tabsBarStore.delVisitedRoute(view)
        if (isActive(view)) {
          await $router.push(visitedRoutes.value[currentIndex - 1])
        }
      }
    }

    const reloadRouter = async () => {
      const oldIndex = contextmenuRoutesIndex || visitedRoutes.value.findIndex((r) => tabActiveRef.value === r.meta.title)
      const view = visitedRoutes.value[oldIndex]
      const currentPath = view.fullPath
      if (view) {
        view.oldIndex = view.meta.fixed ? view.meta.fixedIndex : oldIndex
        tabsBarStore.addRefreshRoutes(view)
        tabsBarStore.delVisitedRoute(view)
        quickMenuStore.delAllQuickMenu()
        await $router.push('/redirect' + currentPath)
      }
    }
    const reloadAllRouter = () => {
      proxy.$EventBus.emit('reload-router-view')
    }
    const closeOtherTabs = () => {
      const view = getContextmenuTagView()
      if (view) {
        tabsBarStore.delOthersVisitedRoute(view)
        nextTick(() => {
          // 如果激活的tab被删除了，需要跳转到被操作的tab
          if (visitedRoutes.value.findIndex((r) => tabActiveRef.value === r.meta.title) === -1) {
            $router.push('/redirect' + view.fullPath)
          }
        })
      }
    }
    const closeLeftTabs = () => {
      const view = getContextmenuTagView()
      if (view) {
        tabsBarStore.delLeftVisitedRoute(view)
        nextTick(() => {
          // 如果激活的tab被删除了，需要跳转到被操作的tab
          if (visitedRoutes.value.findIndex((r) => tabActiveRef.value === r.meta.title) === -1) {
            $router.push('/redirect' + view.fullPath)
          }
        })
      }
    }
    const closeRightTabs = () => {
      const view = getContextmenuTagView()
      if (view) {
        tabsBarStore.delRightVisitedRoute(view)
        nextTick(() => {
          // 如果激活的tab被删除了，需要跳转到被操作的tab
          if (visitedRoutes.value.findIndex((r) => tabActiveRef.value === r.meta.title) === -1) {
            $router.push('/redirect' + view.fullPath)
          }
        })
      }
    }
    const closeAllTabs = async () => {
      tabsBarStore.delAllVisitedRoutes()
      const defaultView = visitedRoutes.value[0]
      if (defaultView) {
        await $router.push(defaultView)
      } else {
        await $router.push('/')
      }
    }

    // 一些通用处理函数
    const isActive = (route) => {
      return route.path === $route.path
    }
    const isAffix = (tag) => {
      return tag.meta && tag.meta.fixed
    }
    const getContextmenuTagView = () => {
      const index = contextmenuRoutesIndex || visitedRoutes.value.findIndex((r) => tabActiveRef.value === r.meta.title)
      return visitedRoutes.value[index]
    }

    watch(() => $router.currentRoute.value.path, () => {
      initTabs()
      nextTick(() => {
        tabActiveRef.value = ''
        visitedRoutes.value.forEach((item) => {
          if (item.path === $route.path) {
            tabActiveRef.value = item.meta.title
          }
        })
      })
    }, {
      immediate: true
    })

    return {
      visitedRoutes,
      tabActive: tabActiveRef,
      contextmenuList,
      showRightMenu: showRightMenuRef,
      contextmenuPosition,
      handleTabContextmenu,
      handleContextmenuSelect,
      handleTabClick,
      handleTabRemove,
      isAffix
    }
  }
})
</script>

<style lang="scss" scoped>
.tabs-bar-container {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-content: center;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 50px;
  padding: 0 20px;
  user-select: none;
  border-top: 1px solid var(--n-border-color);
  box-shadow: 0 2px 4px 0 rgba(36, 38, 47, .2) !important;
  z-index: 499;
  transition: border .3s var(--n-bezier);

  .tabs-content {
    width: calc(100% - 90px);
    height: 34px;
  }
}

::v-deep(.tabs-content) {
  .n-tabs-wrapper {
    .n-tabs-tab-wrapper {
      .n-tabs-tab {
        box-sizing: border-box;
        height: 34px;
        line-height: 34px;
        transition: all .3s var(--n-bezier), width .6s !important;
        padding-right: 20px;

        .n-base-close {
          width: 0;
          margin-left: 0;
          overflow: hidden;
          transform-origin: 100% 50%;
          transition: all .3s var(--n-bezier);

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
          content: "";
          background-color: var(--n-tab-text-color-active);
          transition: all .3s var(--n-bezier), border 0s, color .1s, font-size 0s;
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
          content: "";
          background-color: var(--n-tab-text-color-active);
          transition: all .3s var(--n-bezier), border 0s, color .1s, font-size 0s;
        }
      }

      .n-tabs-tab-pad {
        width: 6px;
      }
    }
  }

  .n-tabs-pad {
    border: none !important;
  }
}

.tabs-common-handler {
  color: var(--n-tab-text-color);
  font-size: 20px;
  outline: none;
  cursor: pointer;
  transition: transform 1s;
}

.tabs-common-handler:hover {
  color: #63e2b7;
  transform: rotate(90deg);
}
</style>
