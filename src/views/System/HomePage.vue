<template>
  <n-layout class="home-layout" has-sider @click="clickContainer">
    <n-layout-sider
      v-model:collapsed="siderCollapsed"
      collapse-mode="width"
      show-trigger="bar"
      class="home-sider"
      :width="240"
      :collapsed-width="70"
      :native-scrollbar="false"
      :style="'--n-color: ' + themeVars.bodyColor"
    >
      <!-- Logo -->
      <div class="home-logo-container">
        <img class="home-logo" :class="theme" src="@/assets/img/logo-w.webp" />
      </div>
      <!-- 菜单 -->
      <n-spin :show="menuLoading">
        <n-menu
          ref="menuRef"
          v-model:value="menuSelected"
          key-field="id"
          label-field="name"
          children-field="children"
          :options="menuList"
          :indent="16"
          :root-indent="32"
          :collapsed-width="70"
          :render-label="renderMenuLabel"
        />
      </n-spin>
    </n-layout-sider>
    <n-layout>
      <n-layout-header class="home-header" :style="'--n-color: ' + themeVars.bodyColor">
        <!-- 顶部栏 -->
        <n-grid class="home-header-top" cols="24" item-responsive responsive="screen">
          <n-gi span="0 m:0 l:6"><strix-breadcrumb /> </n-gi>
          <n-gi span="0 m:0 l:12"><strix-tabs-bar /> </n-gi>
          <n-gi span="24 m:24 l:6"><strix-tool-bar /> </n-gi>
        </n-grid>
      </n-layout-header>
      <n-layout-content
        class="home-content"
        content-style="padding: 24px;"
        :native-scrollbar="false"
        :scrollbar-props="{ xScrollable: true }"
        :style="'--n-color: ' + themeVars.actionColor"
        embedded
      >
        <!-- 路由名称显示 -->
        <!-- <n-h3 prefix="bar" align-text type="success">
          <n-text type="success">{{ route.meta._title || route.meta.title }}</n-text>
        </n-h3> -->
        <!-- 动态路由区域 -->
        <div
          v-if="routerViewShow"
          class="home-content-view"
          :style="'--s-bg-color: ' + themeVars.cardColor"
        >
          <router-view v-slot="{ Component, route }">
            <transition name="strix-zoom-in-top">
              <!-- 根据 fullPath 缓存组件 解决组件复用问题 -->
              <keep-alive :include="tabsBarStore.cachedRouteNames">
                <component :is="Component" :key="route.fullPath" />
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
      content="Powered By ProjectAn Strix"
      cross
      fullscreen
      :font-size="16"
      :line-height="16"
      :width="384"
      :height="384"
      :x-offset="12"
      :y-offset="60"
      :rotate="-15"
      font-color="rgba(128, 128, 128, .05)"
    />
  </n-layout>
</template>
<script setup lang="ts">
import StrixBreadcrumb from '@/components/StrixBreadcrumb.vue'
import StrixQuickMenu from '@/components/StrixQuickMenu.vue'
import StrixTabsBar from '@/components/StrixTabBar.vue'
import StrixToolBar from '@/components/StrixToolBar.vue'
import { http } from '@/plugins/axios'
import { EventBus } from '@/plugins/event-bus'
import { useResizeDetector } from '@/plugins/resize-detector'
import { useLoginInfoStore, type LoginInfoStore } from '@/stores/login-info'
import { useStrixSettingsStore } from '@/stores/strix-settings'
import { useTabsBarStore } from '@/stores/tabs-bar'
import { initStrixLoadingBar } from '@/utils/strix-loading-bar'
import { initStrixMessage } from '@/utils/strix-message'
import { deepSearch } from '@/utils/strix-tools'
import { Icon } from '@iconify/vue'
import { kebabCase } from 'lodash'
import { useOsTheme, useThemeVars, type MenuInst, type MenuOption } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'

const route = useRoute()
const osTheme = useOsTheme()
const themeVars = useThemeVars()

initStrixLoadingBar(useLoadingBar())
initStrixMessage()

const tabsBarStore = useTabsBarStore()
const globalSettingsStore = useStrixSettingsStore()
const loginInfoStore = useLoginInfoStore()

const theme = computed(() =>
  globalSettingsStore.theme === 'auto' ? osTheme.value : globalSettingsStore.theme
)
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
    http
      .post('system/renewToken', null, { meta: { operate: '续期 Token ', notify: false } })
      .then(({ data: res }) => {
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
        return h(Icon, { icon: kebabCase(child.iconName) })
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
    return h(
      RouterLink,
      {
        to: option.url as string
      },
      { default: () => option.name }
    )
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
      padding: 15px 0;
      width: 100%;
      display: flex;
      justify-content: center;

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
      align-content: center;

      & > div {
        height: 60px;
      }
    }
  }

  .home-content {
    height: calc(100vh - 60px - 12px);
    border-radius: 16px;
    margin: 0 12px 12px 0;
    box-sizing: border-box;

    .home-content-view {
      min-width: 1024px;
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
