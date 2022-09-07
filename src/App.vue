<template>
  <n-config-provider :theme="themeNew" :locale="zhCN" :date-locale="dateZhCN">
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
import useCurrentInstance from '@/utils/strix-instance-tool';
import { darkTheme, dateZhCN, NConfigProvider, NGlobalStyle, useOsTheme, zhCN } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';

const { proxy } = useCurrentInstance()
const osTheme = useOsTheme()
const currentTheme = ref(osTheme.value)

onMounted(() => {
  if (proxy) {
    proxy.$Theme.name = currentTheme.value
  }
})

// 监听主题改变事件
proxy?.$EventBus.on('changeTheme', () => {
  if (currentTheme.value === 'dark') {
    currentTheme.value = 'light'
  } else {
    currentTheme.value = 'dark'
  }
  proxy.$Theme.name = currentTheme.value
})

const themeNew = computed(() => (currentTheme.value === 'dark' ? darkTheme : null))
</script>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
