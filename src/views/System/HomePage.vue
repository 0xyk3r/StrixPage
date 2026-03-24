<template>
  <div class="nebula-app" @click="clickContainer">
    <!-- 极光背景 -->
    <nebula-bg />

    <!-- 顶部栏 -->
    <header class="nebula-header">
      <!-- Logo 按钮 -->
      <div :class="['nebula-logo-btn', { 'drawer-open': drawerOpen }]" @click.stop="toggleDrawer">
        <span class="nebula-logo-text">Strix</span>
        <span class="nebula-logo-dot" />
        <span class="nebula-logo-hint">Ctrl+/</span>
      </div>

      <!-- 面包屑 -->
      <div class="nebula-header__breadcrumb">
        <strix-breadcrumb />
      </div>

      <!-- 标签栏 -->
      <div class="nebula-header__tabs">
        <strix-tabs-bar />
      </div>

      <!-- 工具栏 -->
      <div class="nebula-header__toolbar">
        <strix-tool-bar />
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="nebula-main">
      <div v-if="routerViewShow" class="nebula-content-view">
        <router-view v-slot="{ Component, route }">
          <transition name="nebula-page">
            <keep-alive :include="tabsBarStore.cachedRouteNames">
              <component :is="wrapDynamicComponent(Component, route)" :key="route.fullPath" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </main>

    <!-- 抽屉菜单 -->
    <strix-drawer-menu />

    <!-- 命令面板 -->
    <strix-command-palette />

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
  </div>
</template>

<script lang="ts" setup>
import NebulaBg from '@/components/system/NebulaBg.vue'
import StrixBreadcrumb from '@/components/system/StrixBreadcrumb.vue'
import StrixCommandPalette from '@/components/system/StrixCommandPalette.vue'
import StrixDrawerMenu from '@/components/system/StrixDrawerMenu.vue'
import StrixQuickMenu from '@/components/common/StrixQuickMenu.vue'
import StrixTabsBar from '@/components/system/StrixTabBar.vue'
import StrixToolBar from '@/components/system/StrixToolBar.vue'
import { useCommandPalette } from '@/composables/useCommandPalette'
import { useDrawer } from '@/composables/useDrawer'
import { useDynamicComponent } from '@/composables/useDynamicComponent'
import { useHomeMenu } from '@/composables/useHomeMenu'
import { useTokenRenewal } from '@/composables/useTokenRenewal'
import { EventBus } from '@/plugins/event-bus'
import { useResizeDetector } from '@/plugins/resize-detector'
import { useStrixSettingsStore } from '@/stores/strix-settings'
import { useTabsBarStore } from '@/stores/tabs-bar'
import { initStrixLoadingBar } from '@/utils/strix-loading-bar'
import { initStrixMessage } from '@/utils/strix-message'

// 初始化全局工具
initStrixLoadingBar(useLoadingBar())
initStrixMessage()

// Stores
const tabsBarStore = useTabsBarStore()
const globalSettingsStore = useStrixSettingsStore()

// 使用 Composables
useHomeMenu()
const { wrapDynamicComponent } = useDynamicComponent()
useTokenRenewal()
const { toggle: toggleDrawer, close: closeDrawer, drawerOpen } = useDrawer()
const { toggle: toggleCommandPalette, close: closeCommandPalette, isOpen: isCommandPaletteOpen } = useCommandPalette()

// 全局点击事件
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

onUnmounted(() => {
  EventBus.off('reload-all', reloadAll)
})

// 监听窗口大小变化
useResizeDetector(document.getElementById('app'), (element) => {
  globalSettingsStore.setIsSmallWindow(element.offsetWidth < 640)
})

// 键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  // ESC 关闭当前打开的弹出层
  if (e.key === 'Escape') {
    if (isCommandPaletteOpen.value) {
      e.preventDefault()
      closeCommandPalette()
      return
    }
    if (drawerOpen.value) {
      e.preventDefault()
      closeDrawer()
      return
    }
  }
  // Ctrl+/ 打开/关闭菜单面板
  if (e.ctrlKey && e.key === '/') {
    e.preventDefault()
    toggleDrawer()
  }
  // Ctrl+K 打开/关闭命令面板
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault()
    toggleCommandPalette()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>
