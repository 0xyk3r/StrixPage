<template>
  <n-layout class="home-layout" has-sider @click="clickContainer">
    <n-layout-sider
      v-model:collapsed="siderCollapsed"
      :collapsed-width="70"
      :native-scrollbar="false"
      :style="'--n-color: ' + themeVars.bodyColor"
      :width="240"
      class="home-sider"
      collapse-mode="width"
      show-trigger="bar"
    >
      <!-- Logo 或 系统标题 -->
      <div class="home-logo-container">
        <img :class="theme" class="home-logo" src="@/assets/img/logo-w.webp" />
      </div>
      <!-- 菜单 -->
      <n-spin :show="menuLoading">
        <n-menu
          ref="menuRef"
          v-model:value="menuSelected"
          :collapsed-width="70"
          :indent="16"
          :options="menuList"
          :render-label="renderMenuLabel"
          :root-indent="32"
          children-field="children"
          key-field="id"
          label-field="name"
        />
      </n-spin>
    </n-layout-sider>
    <n-layout>
      <n-layout-header :style="'--n-color: ' + themeVars.bodyColor" class="home-header">
        <!-- 顶部栏 -->
        <div class="home-header-top">
          <div class="header-section breadcrumb-section">
            <strix-breadcrumb />
          </div>
          <div class="header-divider"></div>
          <div class="header-section tabs-section">
            <strix-tabs-bar />
          </div>
          <div class="header-divider"></div>
          <div class="header-section toolbar-section">
            <strix-tool-bar />
          </div>
        </div>
      </n-layout-header>
      <n-layout-content
        :native-scrollbar="false"
        :scrollbar-props="{ xScrollable: true }"
        :style="'--n-color: ' + themeVars.actionColor"
        class="home-content"
        content-style="padding: 24px;"
        embedded
      >
        <!-- 路由名称显示 -->
        <!-- <n-h3 prefix="bar" align-text type="success">
          <n-text type="success">{{ route.meta._title || route.meta.title }}</n-text>
        </n-h3> -->
        <!-- 动态路由区域 -->
        <div v-if="routerViewShow" :style="'--s-bg-color: ' + themeVars.cardColor" class="home-content-view">
          <router-view v-slot="{ Component, route }">
            <transition name="strix-zoom-in-top">
              <!-- 根据组件名称缓存组件，DynamicWrapper 路由会被动态包装 -->
              <keep-alive :include="tabsBarStore.cachedRouteNames">
                <component :is="wrapDynamicComponent(Component, route)" :key="route.fullPath" />
              </keep-alive>
            </transition>
          </router-view>
        </div>
      </n-layout-content>
    </n-layout>
    <!-- 快捷工具栏 -->
    <strix-quick-menu />
    <!-- 水印 -->
    <n-watermark
      :font-size="16"
      :height="384"
      :line-height="16"
      :rotate="-15"
      :width="384"
      :x-offset="12"
      :y-offset="60"
      content="Powered By ProjectAn Strix"
      cross
      font-color="rgba(128, 128, 128, .05)"
      fullscreen
    />
  </n-layout>
</template>
<script lang="ts" setup>
import StrixBreadcrumb from '@/components/StrixBreadcrumb.vue'
import StrixQuickMenu from '@/components/StrixQuickMenu.vue'
import StrixTabsBar from '@/components/StrixTabBar.vue'
import StrixToolBar from '@/components/StrixToolBar.vue'
import { http } from '@/plugins/axios'
import { EventBus } from '@/plugins/event-bus'
import { useResizeDetector } from '@/plugins/resize-detector'
import { type LoginInfoStore, useLoginInfoStore } from '@/stores/login-info'
import { useStrixSettingsStore } from '@/stores/strix-settings'
import { useTabsBarStore } from '@/stores/tabs-bar'
import { initStrixLoadingBar } from '@/utils/strix-loading-bar'
import { initStrixMessage } from '@/utils/strix-message'
import { deepSearch } from '@/utils/strix-tools'
import { kebabCase } from 'lodash-es'
import { type MenuInst, type MenuOption, useOsTheme, useThemeVars } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import StrixIcon from '@/components/Icon/StrixIcon.vue'
import { replaceDynamicName } from '@/utils/dynamic-component-util'
import type { Component } from 'vue'

const route = useRoute()
const osTheme = useOsTheme()
const themeVars = useThemeVars()

// 缓存动态包装组件，确保同一路由使用相同的组件定义（引用稳定）
const dynamicComponentCache = new Map<string, Component>()

/**
 * 为 DynamicWrapper 路由创建动态命名的包装组件
 * 这样 keep-alive 可以区分不同参数的动态路由
 */
const wrapDynamicComponent = (Component: Component, route: any): Component => {
  // 非 DynamicWrapper 路由直接返回原组件
  if (!route.meta.isDynamicWrapper) {
    return Component
  }

  // 生成动态组件名称
  const dynamicComponentName = replaceDynamicName(route.meta.dynamicComponentNameTemplate as string, route.params)

  // 从缓存中获取或创建包装组件
  if (!dynamicComponentCache.has(dynamicComponentName)) {
    dynamicComponentCache.set(
      dynamicComponentName,
      defineComponent({
        name: dynamicComponentName,
        setup() {
          return () => h(Component)
        }
      })
    )
  }

  return dynamicComponentCache.get(dynamicComponentName)!
}

initStrixLoadingBar(useLoadingBar())
initStrixMessage()

const tabsBarStore = useTabsBarStore()
const globalSettingsStore = useStrixSettingsStore()
const loginInfoStore = useLoginInfoStore()

const theme = computed(() => (globalSettingsStore.theme === 'auto' ? osTheme.value : globalSettingsStore.theme))
const { loginInfo, loginTokenExpire } = storeToRefs(loginInfoStore) as LoginInfoStore

// 左侧菜单栏折叠
const siderCollapsed = ref(globalSettingsStore.siderCollapsed)
watch(siderCollapsed, (value) => {
  globalSettingsStore.setSiderCollapsed(value)
})

// Token续期
const renewToken = () => {
  // 如果token过期时间小于30天，则续期  (yyyy-MM-dd格式的字符串)
  if (
    loginTokenExpire.value &&
    new Date(loginTokenExpire.value).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000
  ) {
    http.post('system/renewToken', null, { meta: { operate: '续期 Token ', notify: false } }).then(({ data: res }) => {
      loginInfoStore.updateLoginInfo(res)
      loginInfo.value = res.data.info
    })
  }
}
onMounted(renewToken)

// 点击任意地方的全局通知
const clickContainer = () => {
  EventBus.emit('click-container')
}
// 强制刷新所有组件
const routerViewShow = ref(true)
const reloadAll = () => {
  routerViewShow.value = false
  nextTick(() => {
    routerViewShow.value = true
  })
}
onMounted(() => {
  EventBus.on('reload-all', reloadAll)
})

// 加载系统主菜单
const menuRef = ref<MenuInst | null>(null)
const menuLoading = ref(false)
const menuList = ref<any[]>([])
const getMenuList = () => {
  menuLoading.value = true
  http
    .get('system/menus', { meta: { operate: '加载系统主菜单' } })
    .then(({ data: res }) => {
      menuList.value = handleMenuIconField(res.data.menuList)
      syncCurrentSelectMenu()
    })
    .finally(() => {
      menuLoading.value = false
    })
}
onMounted(getMenuList)
// 监听来自其他页面的刷新菜单事件
onMounted(() => {
  EventBus.on('refresh-menu', getMenuList)
})
// 监听路由变化以同步menu选中项
const menuSelected = ref('')
const syncCurrentSelectMenu = () => {
  if (menuList.value && menuList.value.length > 0) {
    const currentMenu = deepSearch(menuList.value, route.path, 'url')
    if (currentMenu) {
      menuSelected.value = currentMenu.id
      nextTick(() => menuRef.value?.showOption())
    }
  }
}
watch(() => route.path, syncCurrentSelectMenu, {
  immediate: true
})

// 对系统菜单api的响应结果进行二次处理
const handleMenuIconField = (list: any[]) => {
  for (const child of list) {
    if (child.icon) {
      if (!child.iconName) {
        // 在这里将icon组件根据name缓存，解决被反复渲染
        child.iconName = child.icon
      }
      child.icon = () => {
        return h(StrixIcon, { icon: kebabCase(child.iconName) })
      }
    } else {
      child.icon = null
    }
    if (child.children.length > 0) {
      handleMenuIconField(child.children)
    } else {
      child.children = null
    }
  }
  return list
}

const renderMenuLabel = (option: MenuOption): any => {
  if (!option.children) {
    return h(RouterLink, { to: option.url as string }, { default: () => option.name })
  }
  return option.name
}

// 监听窗口大小变化
useResizeDetector(document.getElementById('app'), (element) => {
  globalSettingsStore.setIsSmallWindow(element.offsetWidth < 640)
  if (element.offsetWidth < 640) {
    siderCollapsed.value = true
  }
})
</script>

<style lang="scss" scoped>
.home-layout {
  height: 100vh;

  .home-sider {
    .home-logo-container {
      box-sizing: border-box;
      padding: 20px 0;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      height: 75px;

      .home-title {
        font-size: 18px;
        font-weight: bold;
        color: var(--n-text-1);
        user-select: none;
        white-space: nowrap;
        text-align: center;
      }

      .home-logo {
        width: 60%;
        -webkit-user-drag: none;
        user-select: none;
        transition: filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .home-logo.light {
        filter: invert(1) brightness(1);
      }
    }

    ::v-deep(.n-menu .n-menu-item-content a) {
      -webkit-user-drag: none !important;
      user-select: none;
    }
  }

  .home-header {
    height: 60px;

    .home-header-top {
      height: 60px;
      margin: 0 20px;
      display: flex;
      align-items: center;
      gap: 16px;

      .header-section {
        height: 60px;
        display: flex;
        align-items: center;
      }

      .breadcrumb-section {
        flex-shrink: 0;
        max-width: 280px;
        min-width: 0;
        overflow: hidden;

        @media (max-width: 1280px) {
          display: none;
        }
      }

      .tabs-section {
        flex: 1;
        min-width: 200px;
        overflow: hidden;
      }

      .toolbar-section {
        flex-shrink: 0;
        width: auto;
      }

      .header-divider {
        width: 1px;
        height: 24px;
        background-color: var(--n-border-color);
        opacity: 0.3;
        transition: opacity 0.3s var(--n-bezier);

        @media (max-width: 1280px) {
          &:first-of-type {
            display: none;
          }
        }
      }
    }
  }

  .home-content {
    height: calc(100vh - 60px - 12px);
    border-radius: 16px;
    margin: 0 12px 12px 0;
    box-sizing: border-box;

    .home-content-view {
      user-select: text;

      .strix-zoom-in-top-enter-active,
      .strix-zoom-in-top-leave-active {
        filter: none;
        transition:
          filter 0.4s ease,
          transform 0.4s ease;
      }

      .strix-zoom-in-top-enter-from,
      .strix-zoom-in-top-leave-from {
        filter: blur(20px);
      }

      .strix-zoom-in-top-leave-active {
        display: none;
      }
    }
  }

  /* .home-footer {
    height: 100px;
  } */
}
</style>
