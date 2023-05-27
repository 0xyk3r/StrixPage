<template>
  <n-config-provider :theme="currentTheme" :locale="zhCN" :date-locale="dateZhCN">
    <n-loading-bar-provider>
      <n-notification-provider>
        <n-dialog-provider>
          <router-view />
        </n-dialog-provider>
      </n-notification-provider>
    </n-loading-bar-provider>
    <n-global-style />
  </n-config-provider>
</template>

<script setup>
import { useGlobalSettingsStore } from '@/stores/global-settings';
import { darkTheme, dateZhCN, NConfigProvider, NGlobalStyle, useOsTheme, zhCN } from 'naive-ui';
import { computed, getCurrentInstance, ref } from 'vue';

const { proxy } = getCurrentInstance()
const globalSettingsStore = useGlobalSettingsStore()
const osTheme = useOsTheme()
const themeSetting = ref(globalSettingsStore.theme)

// 监听主题改变事件
proxy?.$EventBus.on('changeTheme', () => {
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
