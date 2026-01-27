<template>
  <div ref="toolbarContainerRef" class="toolbar-container">
    <n-flex :size="10" :wrap="false">
      <!-- 通知 -->
      <StrixNotification />

      <!-- Teleport 插入位置 -->
      <span id="strix-tool-bar-item"></span>

      <!-- 更改主题 -->
      <n-icon-wrapper
        :border-radius="5"
        :color="themeVars.actionColor"
        :icon-color="themeVars.textColorBase"
        :size="32"
      >
        <n-icon :size="18">
          <StrixIcon icon="contrast" @click="changeTheme" />
        </n-icon>
      </n-icon-wrapper>

      <!-- 切换全屏 -->
      <n-icon-wrapper
        :border-radius="5"
        :color="themeVars.actionColor"
        :icon-color="themeVars.textColorBase"
        :size="32"
      >
        <n-icon :size="18">
          <StrixIcon icon="expand" @click="switchFullscreen" />
        </n-icon>
      </n-icon-wrapper>

      <!-- 刷新全部 -->
      <n-icon-wrapper
        :border-radius="5"
        :color="themeVars.actionColor"
        :icon-color="themeVars.textColorBase"
        :size="32"
      >
        <n-icon :size="18">
          <StrixIcon icon="refresh-cw" @click="reloadAll" />
        </n-icon>
      </n-icon-wrapper>
    </n-flex>

    <n-dropdown
      :options="avatarDropdownOptions"
      placement="bottom-start"
      trigger="hover"
      @select="handleAvatarDropdownSelect"
    >
      <span class="user-dropdown">
        <span class="user-name">
          {{ loginInfo.nickname || '未知' }}
        </span>
      </span>
    </n-dropdown>
  </div>
</template>

<script lang="ts" setup>
import { http } from '@/plugins/axios'
import { EventBus } from '@/plugins/event-bus'
import { type LoginInfoStore, useLoginInfoStore } from '@/stores/login-info'
import { createStrixMessage } from '@/utils/strix-message'
import { useThemeVars } from 'naive-ui'
import { storeToRefs } from 'pinia'
import screenfull from 'screenfull'

const router = useRouter()
const loginInfoStore = useLoginInfoStore()
const themeVars = useThemeVars()

const { loginInfo } = storeToRefs(loginInfoStore) as LoginInfoStore

// 切换全屏状态
const switchFullscreen = () => {
  if (!screenfull.isEnabled) {
    return createStrixMessage('warning', '进入全屏失败', '您的浏览器不支持或拒绝了全屏操作，请您手动使用F11进入全屏')
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
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;

  .n-icon .strix-icon:hover {
    color: #63e2b7;
  }

  .user-dropdown {
    height: 100%;
    display: flex;
    align-items: center;

    .user-name {
      cursor: pointer;
      white-space: nowrap;

      &:hover {
        color: #63e2b7;
      }
    }
  }
}
</style>
