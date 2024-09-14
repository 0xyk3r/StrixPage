<template>
  <n-config-provider :theme="currentTheme" :locale="zhCN" :date-locale="dateZhCN">
    <n-loading-bar-provider>
      <n-message-provider :keep-alive-on-hover="true">
        <n-dialog-provider>
          <router-view />
        </n-dialog-provider>
      </n-message-provider>
    </n-loading-bar-provider>

    <ReloadPrompt></ReloadPrompt>
    <n-global-style />
  </n-config-provider>
</template>

<script setup lang="ts">
import { useStrixSettingsStore } from '@/stores/strix-settings'
import {
  darkTheme,
  dateZhCN,
  NConfigProvider,
  NDialogProvider,
  NGlobalStyle,
  NLoadingBarProvider,
  NMessageProvider,
  useOsTheme,
  zhCN
} from 'naive-ui'
import { computed, ref } from 'vue'
import { EventBus } from './plugins/event-bus'
import ReloadPrompt from './components/ReloadPrompt.vue'

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

const currentTheme = computed(() => {
  if (themeSetting.value === 'auto') {
    return osTheme.value === 'dark' ? darkTheme : null
  } else {
    return themeSetting.value === 'dark' ? darkTheme : null
  }
})
</script>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
