<template>
  <n-layout class="home-layout" has-sider @click="clickContainer">
    <!-- 侧边栏 -->
    <n-layout-sider
      v-model:collapsed="siderCollapsed"
      :collapsed-width="70"
      :native-scrollbar="false"
      :width="240"
      class="home-sider"
      collapse-mode="width"
      show-trigger="bar"
    >
      <!-- Logo -->
      <div class="home-logo-container">
        <img :class="['home-logo', { 'home-logo--light': isLightTheme }]" alt="Logo" src="@/assets/img/logo-w.webp" />
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

    <!-- 主内容区 -->
    <n-layout>
      <!-- 顶部栏 -->
      <n-layout-header class="home-header">
        <div class="home-header-top">
          <div class="header-section breadcrumb-section">
            <strix-breadcrumb />
          </div>
          <div class="header-section tabs-section">
            <strix-tabs-bar />
          </div>
          <div class="header-section toolbar-section">
            <strix-tool-bar />
          </div>
        </div>
      </n-layout-header>

      <!-- 内容区域 -->
      <n-layout-content
        :native-scrollbar="false"
        :scrollbar-props="{ xScrollable: true }"
        class="home-content"
        content-style="padding: 20px;"
        embedded
      >
        <div v-if="routerViewShow" class="home-content-view">
          <router-view v-slot="{ Component, route }">
            <transition name="strix-fade-slide">
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
import StrixBreadcrumb from '@/components/system/StrixBreadcrumb.vue'
import StrixQuickMenu from '@/components/common/StrixQuickMenu.vue'
import StrixTabsBar from '@/components/system/StrixTabBar.vue'
import StrixToolBar from '@/components/system/StrixToolBar.vue'
import { useDynamicComponent } from '@/composables/useDynamicComponent'
import { useHomeMenu } from '@/composables/useHomeMenu'
import { useTokenRenewal } from '@/composables/useTokenRenewal'
import { EventBus } from '@/plugins/event-bus'
import { useResizeDetector } from '@/plugins/resize-detector'
import { useStrixSettingsStore } from '@/stores/strix-settings'
import { useTabsBarStore } from '@/stores/tabs-bar'
import { initStrixLoadingBar } from '@/utils/strix-loading-bar'
import { initStrixMessage } from '@/utils/strix-message'
import { useOsTheme } from 'naive-ui'

// 初始化全局工具
initStrixLoadingBar(useLoadingBar())
initStrixMessage()

// Stores
const tabsBarStore = useTabsBarStore()
const globalSettingsStore = useStrixSettingsStore()

// 主题相关
const osTheme = useOsTheme()
const currentTheme = computed(() => (globalSettingsStore.theme === 'auto' ? osTheme.value : globalSettingsStore.theme))
const isLightTheme = computed(() => currentTheme.value === 'light')

// 使用 Composables
const { menuRef, menuLoading, menuList, menuSelected, renderMenuLabel } = useHomeMenu()
const { wrapDynamicComponent } = useDynamicComponent()
useTokenRenewal()

// 侧边栏折叠状态
const siderCollapsed = ref(globalSettingsStore.siderCollapsed)
watch(siderCollapsed, (value) => {
  globalSettingsStore.setSiderCollapsed(value)
})

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

        &--light {
          filter: invert(1) brightness(1);
        }
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

      .strix-fade-slide-enter-active,
      .strix-fade-slide-leave-active {
        transition:
          opacity 0.25s var(--n-bezier),
          transform 0.25s var(--n-bezier);
      }

      .strix-fade-slide-enter-from {
        opacity: 0;
        transform: translateY(-8px);
      }

      .strix-fade-slide-leave-active {
        display: none;
      }
    }
  }
}
</style>
