<template>
  <n-layout class="home-layout" has-sider @click="clickContainer">
    <n-layout-sider
      v-model:collapsed="siderCollapsed"
      :width="240"
      :collapsed-width="70"
      collapse-mode="width"
      show-trigger="arrow-circle"
      class="home-sider"
      bordered=""
      :native-scrollbar="false"
    >
      <!-- Logo -->
      <div class="home-logo-container">
        <img v-if="theme === 'dark'" class="home-logo" src="@/assets/img/logo-w.png" />
        <img v-else class="home-logo" src="@/assets/img/logo.png" />
      </div>
      <!-- 侧边菜单区域 -->
      <n-spin :show="menuLoading">
        <n-menu
          ref="menuRef"
          v-model:value="menuSelected"
          key-field="id"
          label-field="name"
          children-field="children"
          :collapsed-width="70"
          :root-indent="32"
          :indent="16"
          :render-label="renderMenuLabel"
          :options="menuList"
        />
      </n-spin>
    </n-layout-sider>
    <n-layout>
      <n-layout-header class="home-header">
        <n-grid class="home-header-top">
          <n-gi :span="12">
            <div class="home-header-top-left">
              <!-- 面包屑导航 -->
              <strix-breadcrumb />
            </div>
          </n-gi>
          <n-gi :span="12">
            <div class="home-header-top-right">
              <n-space v-if="!isSmallWindow">
                <Icon icon="ion:contrast" :width="18" @click="changeTheme" />
                <Icon icon="ion:expand" :width="18" @click="switchFullscreen" />
                <Icon icon="ion:refresh" :width="18" @click="reloadAll" />
              </n-space>
              <n-dropdown
                trigger="hover"
                placement="bottom-start"
                :options="avatarDropdownOptions"
                @select="handleAvatarDropdownSelect"
              >
                <span class="avatar-dropdown">
                  <img v-if="!isSmallWindow" class="user-avatar" src="@/assets/img/avatar.png" alt="" />
                  <span class="user-name">
                    {{ loginManagerInfo ? loginManagerInfo.nickname : '未知' }}
                  </span>
                </span>
              </n-dropdown>
            </div>
          </n-gi>
        </n-grid>
        <!-- 标签栏 -->
        <strix-tabs-bar />
      </n-layout-header>
      <n-layout-content class="home-content" content-style="padding: 24px;" :native-scrollbar="false" embedded>
        <!-- 动态路由区域 -->
        <div v-if="routerViewShow" class="app-main-height">
          <router-view v-slot="{ Component, route }">
            <transition name="strix-zoom-in-top">
              <!-- 根据 fullPath 缓存组件 解决动态路由缓存问题 -->
              <keep-alive :include="cachedRoutes">
                <component :is="Component" :key="route.fullPath" />
              </keep-alive>
            </transition>
          </router-view>
        </div>
      </n-layout-content>
      <!-- <n-layout-footer class="home-footer">footer</n-layout-footer> -->
    </n-layout>

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
      font-color="rgba(128, 128, 128, .06)"
    />
  </n-layout>
</template>
<script setup>
import StrixBreadcrumb from '@/components/StrixBreadcrumb.vue'
import StrixQuickMenu from '@/components/StrixQuickMenu.vue'
import StrixTabsBar from '@/components/StrixTabBar.vue'
import { useStrixSettingsStore } from '@/stores/strix-settings'
import { useTabsBarStore } from '@/stores/tabs-bar'
import { initStrixLoadingBar } from '@/utils/strix-loading-bar'
import { createStrixMessage, initStrixMessage } from '@/utils/strix-message'
import { setToken } from '@/utils/strix-token-util'
import { deepSearch } from '@/utils/strix-tools'
import { Icon } from '@iconify/vue'
import elementResizeDetectorMaker from 'element-resize-detector'
import { kebabCase } from 'lodash'
import { useLoadingBar, useOsTheme } from 'naive-ui'
import ScreenFull from 'screenfull'
import { computed, getCurrentInstance, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

const { proxy } = getCurrentInstance()
const $router = useRouter()
const osTheme = useOsTheme()

initStrixLoadingBar(useLoadingBar())
initStrixMessage()

const tabsBarStore = useTabsBarStore()
const globalSettingsStore = useStrixSettingsStore()

const theme = computed(() => (globalSettingsStore.theme === 'auto' ? osTheme.value : globalSettingsStore.theme))
const isSmallWindow = computed(() => globalSettingsStore.isSmallWindow)

// 左侧菜单栏折叠
const siderCollapsed = ref(globalSettingsStore.siderCollapsed)
watch(siderCollapsed, (value) => {
  globalSettingsStore.setSiderCollapsed(value)
})

// 加载路由信息
const visitedRoutes = tabsBarStore.visitedRoutes
// 需要缓存的路由
const cachedRoutes = computed(() => {
  return visitedRoutes.filter((route) => !route.meta.noKeepAlive).map((route) => route.name)
})

const loginManagerInfo = ref(null)
// 获取本地存储中的用户信息
onMounted(() => {
  const cacheManagerInfo = window.localStorage.getItem('strix_login_info')
  loginManagerInfo.value = JSON.parse(cacheManagerInfo || '')
})

// 登出
const logout = () => {
  proxy.$http.post('system/logout', null, { operate: '登出 ', notify: false }).finally(() => {
    window.localStorage.removeItem('strix_login_token')
    window.localStorage.removeItem('strix_login_token_expire')
    window.localStorage.removeItem('strix_login_info')
    $router.push('/login')
  })
}
// Token续期
const renewToken = () => {
  // 如果token过期时间小于30天，则续期  (tokenExpire是yyyy-MM-dd格式的字符串)
  const tokenExpire = window.localStorage.getItem('strix_login_token_expire')
  if (new Date(tokenExpire).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000) {
    proxy.$http.post('system/renewToken', null, { operate: '续期 Token ', notify: false }).then(({ data: res }) => {
      setToken(res)
      loginManagerInfo.value = res.data.info
    })
  }
}
onMounted(renewToken)

// 点击任意地方的全局通知
const clickContainer = () => {
  proxy.$EventBus.emit('click-container')
}

// 切换全屏状态
const switchFullscreen = () => {
  if (!ScreenFull.isEnabled) {
    return createStrixMessage('warning', '进入全屏失败', '您的浏览器不支持或拒绝了全屏操作，请您手动使用F11进入全屏')
  }
  ScreenFull.toggle()
}

// 强制刷新所有组件
const routerViewShow = ref(true)
const reloadAll = () => {
  routerViewShow.value = false
  nextTick(() => {
    routerViewShow.value = true
  })
}
// 监听mitt通知并刷新所有组件
onMounted(() => {
  proxy.$EventBus.on('reload-router-view', () => {
    reloadAll()
  })
})

// 切换主题
const changeTheme = () => {
  proxy.$EventBus.emit('changeTheme')
}

// 加载系统主菜单
const menuRef = ref(null)
const menuLoading = ref(false)
const menuList = ref([])
const getMenuList = () => {
  menuLoading.value = true
  proxy.$http
    .get('system/menus', { operate: '加载系统主菜单' })
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
  proxy.$EventBus.on('refresh-menu', () => {
    getMenuList()
  })
})
// 监听路由变化以同步menu选中项
const menuSelected = ref('')
const syncCurrentSelectMenu = () => {
  if (menuList.value && menuList.value.length > 0) {
    const currentMenu = deepSearch(menuList.value, $router.currentRoute.value.path, 'url')
    if (currentMenu) {
      menuSelected.value = currentMenu.id
      nextTick(() => menuRef.value?.showOption())
    }
  }
}
watch(() => $router.currentRoute.value.path, syncCurrentSelectMenu, {
  immediate: true,
  deep: true
})

// 对系统菜单api的响应结果进行二次处理
const handleMenuIconField = (list) => {
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

const renderMenuLabel = (option) => {
  if (!option.children) {
    return h(
      RouterLink,
      {
        to: option.url
      },
      { default: () => option.name }
    )
  }
  return option.name
}

// 右上角头像下拉菜单
const avatarDropdownOptions = [
  { key: 'setting', label: '个人设置' },
  { key: 'logout', label: '退出登录' }
]
const handleAvatarDropdownSelect = (key) => {
  switch (key) {
    case 'setting':
      createStrixMessage('warning', '操作失败', '该功能暂未开放，敬请期待')
      break
    case 'logout':
      logout()
      break
  }
}

const windowWidth = ref(0)
watch(windowWidth, (value) => {
  globalSettingsStore.setIsSmallWindow(value < 640)
  if (value < 640) {
    siderCollapsed.value = true
  }
})
let erd = null
onMounted(() => {
  erd = elementResizeDetectorMaker({ strategy: 'scroll' })
  erd.listenTo(document.getElementById('app'), (element) => {
    windowWidth.value = element.offsetWidth
  })
})
onBeforeUnmount(() => {
  erd.uninstall(document.getElementById('app'))
})
</script>

<script>
export default {
  name: 'SystemRegionIndex'
}
</script>

<style lang="less" scoped>
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
      }
    }

    ::v-deep(.n-menu .n-menu-item-content a) {
      -webkit-user-drag: none !important;
      user-select: none;
    }
  }

  .home-header {
    height: 110px;

    .home-header-top {
      height: 60px;
      margin: 0 20px;
      align-content: center;

      .home-header-top-left {
        display: flex;
        align-items: center;
      }

      .home-header-top-right {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        height: 60px;
        margin-right: 50px;

        .n-space {
          margin-top: 8px;
        }

        .n-space .iconify:hover {
          color: #63e2b7;
        }

        .avatar-dropdown {
          display: flex;
          align-content: center;
          align-items: center;
          justify-content: center;
          justify-items: center;
          height: 60px;
          padding-left: 10px;

          .user-avatar {
            width: 40px;
            height: 40px;
            cursor: pointer;
            border-radius: 50%;
          }

          .user-name {
            position: relative;
            margin-left: 5px;
            cursor: pointer;

            &:hover {
              color: #63e2b7;
            }
          }
        }
      }
    }
  }

  .home-content {
    height: calc(100vh - 110px);
  }

  //
  //.home-footer {
  //  height: 100px;
  //}
}
</style>
