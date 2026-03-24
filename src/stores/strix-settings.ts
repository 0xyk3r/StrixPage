import { defineStore } from 'pinia'

export const useStrixSettingsStore = defineStore(
  'globalSettings',
  () => {
    const ignoreScreenSizeWarning = ref(false)
    const isSmallWindow = ref(false)
    const theme = ref('auto')

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
      ignoreScreenSizeWarning,
      isSmallWindow,
      theme,
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
