<template>
  <div class="nebula-toolbar">
    <!-- 通知 -->
    <StrixNotification />

    <!-- 工具按钮组 -->
    <div class="nebula-toolbar__group">
      <!-- 主题切换 -->
      <button class="nebula-toolbar__btn" title="切换主题" @click="changeTheme">
        <StrixIcon icon="contrast" :size="15" />
      </button>

      <!-- 全屏切换 -->
      <button class="nebula-toolbar__btn" title="全屏" @click="switchFullscreen">
        <StrixIcon icon="expand" :size="15" />
      </button>

      <!-- 刷新全部 -->
      <button class="nebula-toolbar__btn" title="刷新" @click="reloadAll">
        <StrixIcon icon="refresh-cw" :size="15" />
      </button>
    </div>

    <!-- 用户信息 -->
    <div class="nebula-toolbar__user" @click.stop="toggleUserMenu">
      <div class="nebula-toolbar__avatar">
        {{ avatarLetter }}
      </div>
      <span class="nebula-toolbar__name">{{ loginInfo.nickname || '未知' }}</span>
      <StrixIcon icon="chevron-down" :size="12" :class="['nebula-toolbar__chevron', { open: showUserMenu }]" />

      <!-- 用户下拉菜单 -->
      <Transition name="nebula-overlay">
        <div v-if="showUserMenu" class="nebula-user-dropdown" @click.stop>
          <div class="nebula-user-dropdown__item" @click="handleUserAction('setting')">
            <StrixIcon icon="settings" :size="14" />
            <span>个人设置</span>
          </div>
          <div
            class="nebula-user-dropdown__item nebula-user-dropdown__item--danger"
            @click="handleUserAction('logout')"
          >
            <StrixIcon icon="log-out" :size="14" />
            <span>退出登录</span>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { http } from '@/plugins/axios.ts'
import { EventBus } from '@/plugins/event-bus.ts'
import { type LoginInfoStore, useLoginInfoStore } from '@/stores/login-info.ts'
import { createStrixMessage } from '@/utils/strix-message.ts'
import { storeToRefs } from 'pinia'
import screenfull from 'screenfull'

const router = useRouter()
const loginInfoStore = useLoginInfoStore()

const { loginInfo } = storeToRefs(loginInfoStore) as LoginInfoStore

// 头像首字母
const avatarLetter = computed(() => {
  const name = loginInfo.value.nickname || '?'
  return name.charAt(0).toUpperCase()
})

// 用户菜单
const showUserMenu = ref(false)
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

// 全局点击关闭菜单
const closeUserMenu = () => {
  showUserMenu.value = false
}
onMounted(() => {
  document.addEventListener('click', closeUserMenu)
})
onUnmounted(() => {
  document.removeEventListener('click', closeUserMenu)
})

// 切换全屏
const switchFullscreen = () => {
  if (!screenfull.isEnabled) {
    return createStrixMessage('warning', '进入全屏失败', '您的浏览器不支持或拒绝了全屏操作，请您手动使用F11进入全屏')
  }
  screenfull.toggle()
}

// 切换主题
const changeTheme = () => {
  EventBus.emit('changeTheme')
}

// 刷新全部
const reloadAll = () => {
  EventBus.emit('reload-all')
}

onMounted(() => {
  EventBus.on('reload-router-view', reloadAll)
})

// 用户菜单操作
const handleUserAction = (key: string) => {
  showUserMenu.value = false
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
