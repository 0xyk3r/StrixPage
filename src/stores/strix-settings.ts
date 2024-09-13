import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStrixSettingsStore = defineStore(
  'globalSettings',
  () => {
    const siderCollapsed = ref(false)
    const ignoreScreenSizeWarning = ref(false)
    const isSmallWindow = ref(false)
    const theme = ref('auto')

    const setSiderCollapsed = (value: boolean) => {
      siderCollapsed.value = value
    }

    const setIgnoreScreenSizeWarning = (value: boolean) => {
      ignoreScreenSizeWarning.value = value
    }

    const setIsSmallWindow = (value: boolean) => {
      isSmallWindow.value = value
    }

    const setTheme = (value: any) => {
      theme.value = value
    }

    return {
      siderCollapsed,
      ignoreScreenSizeWarning,
      isSmallWindow,
      theme,
      setSiderCollapsed,
      setIgnoreScreenSizeWarning,
      setIsSmallWindow,
      setTheme
    }
  },
  {
    persist: {
      key: '$strix-settings',
      storage: localStorage
    }
  }
)
