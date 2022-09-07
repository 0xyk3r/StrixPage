<template>
  <n-layout class="home-layout" has-sider @click="clickContainer">
    <n-layout-sider v-model:collapsed="siderCollapsed" :width="240" :collapsed-width="70" collapse-mode="width"
      show-trigger="arrow-circle" class="home-sider" bordered="" :native-scrollbar="false">
      <!-- Logo -->
      <div class="home-logo-container">
        <img v-if="theme.name === 'dark'" class="home-logo" src="../assets/img/logo-w.png" />
        <img v-else class="home-logo" src="../assets/img/logo.png" />
      </div>
      <!-- 侧边菜单区域 -->
      <n-spin :show="menuList.length == 0">
        <n-menu ref="menuRef" key-field="id" label-field="name" children-field="children" :collapsed-width="70"
          :render-label="renderMenuLabel" :options="menuList" v-model:value="menuSelected" />
      </n-spin>
    </n-layout-sider>
    <n-layout>
      <n-layout-header class="home-header">
        <n-grid class="home-header-top">
          <n-gi :span="12">
            <div class="home-header-top-left">
              <!-- 面包屑导航 -->
              <strix-breadcrumb></strix-breadcrumb>
            </div>
          </n-gi>
          <n-gi :span="12">
            <div class="home-header-top-right">
              <n-space v-if="!isSmallWindow">
                <n-icon size="18">
                  <contrast @click="changeTheme" />
                </n-icon>
                <n-icon size="18">
                  <expand @click="switchFullscreen" />
                </n-icon>
                <n-icon size="18" @click="reloadAll">
                  <refresh />
                </n-icon>
              </n-space>
              <n-dropdown trigger="hover" placement="bottom-start" :options="avatarDropdownOptions"
                @select="handleAvatarDropdownSelect">
                <span class="avatar-dropdown">
                  <img v-if="!isSmallWindow" class="user-avatar" src="../assets/img/avatar.png" alt="" />
                  <span class="user-name">
                    {{ loginManagerInfo ? loginManagerInfo.nickname : '未知' }}
                  </span>
                </span>
              </n-dropdown>
            </div>
          </n-gi>
        </n-grid>
        <!-- 标签栏 -->
        <strix-tabs-bar></strix-tabs-bar>
      </n-layout-header>
      <n-layout-content class="home-content" content-style="padding: 24px;" :native-scrollbar="false">
        <!-- 动态路由区域 -->
        <div v-if="routerViewShow" class="app-main-height">
          <router-view v-slot="{ Component }" @refresh-menu="getMenuList">
            <transition name="strix-zoom-in-top">
              <keep-alive :include="cachedRoutes">
                <component :is="Component" />
              </keep-alive>
            </transition>
          </router-view>
        </div>
      </n-layout-content>
      <!-- <n-layout-footer class="home-footer">footer</n-layout-footer> -->
    </n-layout>

    <strix-quick-menu></strix-quick-menu>
    <!-- 水印 -->
    <n-watermark content="Powered By ProjectAn Strix" cross fullscreen :font-size="16" :line-height="16" :width="384"
      :height="384" :x-offset="12" :y-offset="60" :rotate="-15" font-color="rgba(128, 128, 128, .06)" />
  </n-layout>
</template>
<script setup>
import StrixBreadcrumb from '@/components/StrixBreadcrumb.vue'
import StrixQuickMenu from '@/components/StrixQuickMenu.vue'
import StrixTabsBar from '@/components/StrixTabBar.vue'
import { useGlobalSettingsStore } from '@/stores/global-settings'
import { useTabsBarStore } from '@/stores/tabs-bar'
import { dateToString, getDiff } from '@/utils/strix-date-util'
import useCurrentInstance from '@/utils/strix-instance-tool'
import { initStrixLoadingBar } from '@/utils/strix-loading-bar'
import { createStrixNotify, initStrixNotify } from '@/utils/strix-notify'
import { deepSearch } from '@/utils/strix-tools'
import { Contrast, Expand, Refresh, CubeOutline } from '@vicons/ionicons5'
import _ from 'lodash'
import { NIcon, useDialog, useLoadingBar } from 'naive-ui'
import ScreenFull from 'screenfull'
import { computed, defineAsyncComponent, h, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

const { proxy } = useCurrentInstance()
const $router = useRouter()

const dialog = useDialog()
initStrixLoadingBar(useLoadingBar())
initStrixNotify()

const tabsBarStore = useTabsBarStore()
const globalSettingsStore = useGlobalSettingsStore()

const isSmallWindow = computed(() => globalSettingsStore.isSmallWindow)
// 左侧菜单栏折叠
const siderCollapsed = ref(globalSettingsStore.siderCollapsed)
watch(siderCollapsed, (value) => {
  globalSettingsStore.setSiderCollapsed(value)
})

// 加载路由信息
const visitedRoutes = tabsBarStore.visitedRoutes
const cachedRoutes = computed(() => {
  const cachedRoutesArr = ['EmptyLayout']
  visitedRoutes.forEach((item) => {
    if (!item.meta.noKeepAlive) {
      cachedRoutesArr.push(item.name)
    }
  })
  return cachedRoutesArr
})

const loginManagerInfo = ref(null)
// 获取本地存储中的用户信息
onMounted(() => {
  const cacheManagerInfo = window.localStorage.getItem('login_info')
  loginManagerInfo.value = JSON.parse(cacheManagerInfo || '')
})

// 登出
const logout = () => {
  window.localStorage.clear()
  $router.push('/login')
}
// Token续期
const renewToken = (force) => {
  const nowDateStr = dateToString(new Date())
  const expireMinute = getDiff(nowDateStr, window.localStorage.getItem('token_expire'), 'minute')
  // 当剩余有效期小于3天则续期
  if (expireMinute < 4320 || force) {
    proxy.$http.post('system/renewToken').then(({ data: res }) => {
      if (res.code !== 200) {
        createStrixNotify('error', 'Token续期失败', (res.msg ? res.msg : '未知错误'))
      } else {
        window.localStorage.setItem('token', res.data.token)
        window.localStorage.setItem('token_expire', res.data.tokenExpire)
        window.localStorage.setItem('login_info', JSON.stringify(res.data.info))
        loginManagerInfo.value = res.data.info
      }
    }).catch(() => {
      createStrixNotify('error', 'Token续期失败', '网络异常')
    })
  }
}
onMounted(() => {
  renewToken()
})

// 点击任意地方的全局通知
const clickContainer = () => {
  proxy.$EventBus.emit('click-container')
}

// 切换全屏状态
const switchFullscreen = () => {
  if (!ScreenFull.isEnabled) {
    createStrixNotify('warning', '进入全屏失败', '您的浏览器不支持或拒绝了全屏操作，请您手动使用F11进入全屏')
    return false
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
  // TODO 全屏loading动画
  proxy.$http.get('system/menus').then(({ data: res }) => {
    menuLoading.value = true
    if (res.code !== 200) {
      createStrixNotify('error', '加载菜单数据时出错', (res.msg ? res.msg : '未知错误'))
    } else {
      menuList.value = handleMenuIconField(res.data.menuList)
      syncCurrentSelectMenu()
    }
  }).catch(() => {
    createStrixNotify('error', '加载菜单数据失败', '加载菜单数据时出错')
    menuLoading.value = false
  })
}
onMounted(getMenuList)
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
watch(() => $router.currentRoute.value.path,
  syncCurrentSelectMenu,
  {
    immediate: true,
    deep: true
  }
)

// 对系统菜单api的响应结果进行二次处理
const handleMenuIconField = (list) => {
  for (const child of list) {
    child.icon = () => {
      return h(NIcon, null, { default: () => h(CubeOutline) })
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
    return h(RouterLink, {
      to: option.url
    }, { default: () => option.name })
  }
  return option.name
}

// 右上角头像下拉菜单
const avatarDropdownOptions = [
  {
    key: 'setting',
    label: '个人设置'
  }, {
    key: 'logout',
    label: '退出登录'
  }
]
const handleAvatarDropdownSelect = (key) => {
  switch (key) {
    case 'setting':
      createStrixNotify('warning', '操作失败', '该功能暂未开放，敬请期待')
      break
    case 'logout':
      logout()
      break
  }
}

// 检查可视区域是否过小
const ignoreCheckMinimumScreenLimitWarn = ref(false)
const checkMinimumScreenLimit = () => {
  if (!globalSettingsStore.ignoreScreenSizeWarning) {
    dialog.warning({
      title: '提示',
      content: '您的浏览器窗口过小，可能无法获得正常的使用体验',
      positiveText: '不再提示',
      negativeText: '哦',
      onPositiveClick: () => {
        globalSettingsStore.setIgnoreScreenSizeWarning(true)
      }
    })
  }
}
onMounted(() => handleWindowSizeChange())
const handleWindowSizeChange = _.throttle(function () {
  const clientWidth = document.documentElement.clientWidth
  globalSettingsStore.setIsSmallWindow(clientWidth < 768)
  if (clientWidth < 768) {
    siderCollapsed.value = true
    if (!ignoreCheckMinimumScreenLimitWarn.value) {
      ignoreCheckMinimumScreenLimitWarn.value = true
      checkMinimumScreenLimit()
    }
  }
}, 100)
onMounted(() => {
  window.onresize = () => {
    handleWindowSizeChange()
  }
})

const theme = proxy.$Theme

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
      }
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

        .n-space .n-icon:hover {
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
