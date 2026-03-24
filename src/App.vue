<template>
  <n-config-provider
    :date-locale="dateZhCN"
    :locale="zhCN"
    :theme="currentNaiveTheme"
    :theme-overrides="currentNaiveTheme === null ? lightThemeOverrides : darkThemeOverrides"
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

// 解析当前实际主题名
const resolvedTheme = computed(() => {
  if (themeSetting.value === 'auto') {
    return osTheme.value === 'dark' ? 'dark' : 'light'
  }
  return themeSetting.value
})

// 同步 data-theme 到 <html> 元素
watchEffect(() => {
  document.documentElement.dataset.theme = resolvedTheme.value
})

// 监听主题改变事件
EventBus.on('changeTheme', () => {
  if (themeSetting.value === 'auto') {
    themeSetting.value = osTheme.value === 'dark' ? 'light' : 'dark'
  } else {
    themeSetting.value = themeSetting.value === 'dark' ? 'light' : 'dark'
  }
  globalSettingsStore.setTheme(themeSetting.value)

  // 添加主题过渡动画
  document.documentElement.classList.add('theme-transitioning')
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning')
  }, 400)
})

// 亮色主题覆盖 — 与 Nebula 设计系统对齐
const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#2db48c',
    primaryColorHover: '#3bc49d',
    primaryColorPressed: '#24a07c',
    primaryColorSuppl: '#3bb5a5',
    bodyColor: '#f5f6fa',
    cardColor: '#ffffff',
    modalColor: '#ffffff',
    popoverColor: '#ffffff',
    tableColor: 'rgba(0, 0, 0, 0.02)',
    inputColor: 'rgba(0, 0, 0, 0.03)',
    actionColor: 'rgba(0, 0, 0, 0.03)',
    hoverColor: 'rgba(0, 0, 0, 0.06)',
    borderColor: 'rgba(0, 0, 0, 0.09)',
    dividerColor: 'rgba(0, 0, 0, 0.09)',
    borderRadius: '10px',
    borderRadiusSmall: '6px',
    fontFamily: "'Manrope', system-ui, -apple-system, sans-serif"
  }
}

// 暗色主题覆盖 — 与 Nebula 设计系统对齐
const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#63e2b7',
    primaryColorHover: '#7ee8c6',
    primaryColorPressed: '#5acea8',
    primaryColorSuppl: '#4ecdc4',
    bodyColor: '#0a0b14',
    cardColor: '#0f1019',
    modalColor: '#12131e',
    popoverColor: '#12131e',
    tableColor: 'rgba(255, 255, 255, 0.022)',
    inputColor: 'rgba(255, 255, 255, 0.035)',
    actionColor: 'rgba(255, 255, 255, 0.035)',
    hoverColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    dividerColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    borderRadiusSmall: '6px',
    fontFamily: "'Manrope', system-ui, -apple-system, sans-serif"
  }
}

// 计算当前 NaiveUI 主题
const currentNaiveTheme = computed(() => {
  return resolvedTheme.value === 'dark' ? darkTheme : null
})
</script>

<style lang="scss" scoped></style>
