<template>
  <n-config-provider
    :date-locale="dateZhCN"
    :locale="zhCN"
    :theme="currentTheme"
    :theme-overrides="currentTheme === null ? lightThemeOverrides : darkThemeOverrides"
  >
    <n-loading-bar-provider>
      <n-notification-provider>
        <n-message-provider>
          <n-dialog-provider>
            <StrixSwNotify />
            <router-view />
          </n-dialog-provider>
        </n-message-provider>
      </n-notification-provider>
    </n-loading-bar-provider>
    <n-global-style />
  </n-config-provider>
</template>

<script lang="ts" setup>
import { useStrixSettingsStore } from '@/stores/strix-settings'
import {
  darkTheme,
  dateZhCN,
  type GlobalThemeOverrides,
  NConfigProvider,
  NDialogProvider,
  NGlobalStyle,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  useOsTheme,
  zhCN
} from 'naive-ui'
import StrixSwNotify from './components/system/StrixSwNotify.vue'
import { EventBus } from './plugins/event-bus'

const globalSettingsStore = useStrixSettingsStore()
const osTheme = useOsTheme()
const themeSetting = ref(globalSettingsStore.theme)

// 监听主题改变事件
EventBus.on('changeTheme', () => {
  if (themeSetting.value === 'auto') {
    themeSetting.value = osTheme.value === 'dark' ? 'light' : 'dark'
  } else {
    themeSetting.value = themeSetting.value === 'dark' ? 'light' : 'dark'
  }
  globalSettingsStore.setTheme(themeSetting.value)
})

// 亮色主题覆盖
const lightThemeOverrides: GlobalThemeOverrides = {}

// 暗色主题覆盖
const darkThemeOverrides: GlobalThemeOverrides = {
  Layout: {
    color: 'rgb(24, 24, 28)'
  }
}

// 计算当前主题
const currentTheme = computed(() => {
  if (themeSetting.value === 'auto') {
    return osTheme.value === 'dark' ? darkTheme : null
  } else {
    return themeSetting.value === 'dark' ? darkTheme : null
  }
})
</script>

<style lang="scss" scoped></style>
