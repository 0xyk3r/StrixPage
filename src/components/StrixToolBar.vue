<template>
  <div v-show="!isSmallWindow" ref="toolbarContainerRef" class="toolbar-container">
    <n-flex :size="10" :wrap="false">
      <span id="strix-tool-bar-item"></span>

      <!-- 更改主题 -->
      <n-icon-wrapper
        :size="32"
        :border-radius="5"
        :color="themeVars.actionColor"
        :icon-color="themeVars.textColorBase"
      >
        <n-icon :size="18"><Icon icon="ion:contrast" @click="changeTheme" /></n-icon>
      </n-icon-wrapper>

      <!-- 切换全屏 -->
      <n-icon-wrapper
        :size="32"
        :border-radius="5"
        :color="themeVars.actionColor"
        :icon-color="themeVars.textColorBase"
      >
        <n-icon :size="18"><Icon icon="ion:expand" @click="switchFullscreen" /></n-icon>
      </n-icon-wrapper>

      <!-- 刷新全部 -->
      <n-icon-wrapper
        :size="32"
        :border-radius="5"
        :color="themeVars.actionColor"
        :icon-color="themeVars.textColorBase"
      >
        <n-icon :size="18"><Icon icon="ion:refresh" @click="reloadAll" /></n-icon>
      </n-icon-wrapper>
    </n-flex>

    <n-dropdown
      trigger="hover"
      placement="bottom-start"
      :options="avatarDropdownOptions"
      @select="handleAvatarDropdownSelect"
    >
      <span class="avatar-dropdown">
        <span class="user-name">
          {{ loginInfo.nickname || '未知' }}
        </span>
      </span>
    </n-dropdown>
  </div>
</template>

<script setup lang="ts">
import { http } from '@/plugins/axios'
import { EventBus } from '@/plugins/event-bus'
import { useLoginInfoStore, type LoginInfoStore } from '@/stores/login-info'
import { useStrixSettingsStore } from '@/stores/strix-settings'
import { createStrixMessage } from '@/utils/strix-message'
import { Icon } from '@iconify/vue'
import { useThemeVars } from 'naive-ui'
import { storeToRefs } from 'pinia'
import screenfull from 'screenfull'

const router = useRouter()
const loginInfoStore = useLoginInfoStore()
const globalSettingsStore = useStrixSettingsStore()
const themeVars = useThemeVars()

const { loginInfo } = storeToRefs(loginInfoStore) as LoginInfoStore
const { isSmallWindow } = storeToRefs(globalSettingsStore)

// 切换全屏状态
const switchFullscreen = () => {
  if (!screenfull.isEnabled) {
    return createStrixMessage(
      'warning',
      '进入全屏失败',
      '您的浏览器不支持或拒绝了全屏操作，请您手动使用F11进入全屏'
    )
  }
  screenfull.toggle()
}

// 监听mitt通知并刷新所有组件
onMounted(() => {
  EventBus.on('reload-router-view', reloadAll)
})

// 切换主题
const changeTheme = () => {
  EventBus.emit('changeTheme')
}

// 切换主题
const reloadAll = () => {
  EventBus.emit('reload-all')
}

// 右上角头像下拉菜单
const avatarDropdownOptions = [
  { key: 'setting', label: '个人设置' },
  { key: 'logout', label: '退出登录' }
]
const handleAvatarDropdownSelect = (key: string) => {
  switch (key) {
    case 'setting':
      createStrixMessage('warning', '操作失败', '该功能暂未开放，敬请期待')
      break
    case 'logout':
      logout()
      break
  }
}

// 登出
const logout = () => {
  http.post('system/logout', null, { meta: { operate: '登出 ', notify: false } }).finally(() => {
    loginInfoStore.clearLoginInfo()
    router.push('/login')
  })
}
</script>

<style lang="scss" scoped>
.toolbar-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 60px;
  margin-right: 50px;

  .n-icon .iconify:hover {
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
      white-space: nowrap;

      &:hover {
        color: #63e2b7;
      }
    }
  }
}
</style>
