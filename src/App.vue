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
import useCurrentInstance from '@/utils/strix-instance-tool';
import { darkTheme, dateZhCN, NConfigProvider, NGlobalStyle, useOsTheme, zhCN } from 'naive-ui';
import { computed, ref } from 'vue';

const { proxy } = useCurrentInstance()
const globalSettingsStore = useGlobalSettingsStore()
const osTheme = useOsTheme()
const themeSetting = ref(globalSettingsStore.theme)

// 监听主题改变事件
proxy?.$EventBus.on('changeTheme', () => {
  if (themeSetting.value === 'auto') {
    if (osTheme.value === 'dark') {
      themeSetting.value = 'light'
    } else {
      themeSetting.value = 'dark'
    }
  } else {
    if (themeSetting.value === 'dark') {
      themeSetting.value = 'light'
    } else {
      themeSetting.value = 'dark'
    }
  }
  globalSettingsStore.setTheme(themeSetting.value)
})

const currentTheme = computed(() => {
  if (themeSetting.value === 'auto') {
    return osTheme.value === 'dark' ? darkTheme : null
  } else if (themeSetting.value === 'dark') {
    return darkTheme
  } else {
    return null
  }
})
</script>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
