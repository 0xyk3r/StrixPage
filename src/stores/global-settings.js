import { defineStore } from 'pinia'

export const useGlobalSettingsStore = defineStore('globalSettings', {
  state: () => ({
    siderCollapsed: false,
    ignoreScreenSizeWarning: false,
    isSmallWindow: false
  }),
  getters: {
  },
  actions: {
    set(key, value) {
      this[key] = value
    },
    setSiderCollapsed(value) {
      this.set('siderCollapsed', value)
    },
    setIgnoreScreenSizeWarning(value) {
      this.set('ignoreScreenSizeWarning', value)
    },
    setIsSmallWindow(value) {
      this.set('isSmallWindow', value)
    }
  },
  persist: {
    key: '$global-settings',
    storage: localStorage
  }
})
