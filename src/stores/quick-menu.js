import { defineStore } from 'pinia'

export const useQuickMenuStore = defineStore('quickMenu', {
  state: () => ({
    quickMenus: []
  }),
  getters: {
  },
  actions: {
    addQuickMenu(quickMenu) {
      if (!quickMenu.color) {
        quickMenu.color = 'primary'
      }
      this.quickMenus.push(quickMenu)
    },
    delQuickMenu(quickMenuId) {
      let forCount = this.quickMenus.length
      for (let i = 0; i < forCount; i++) {
        const item = this.quickMenus[i]
        if (item.id === quickMenuId) {
          this.quickMenus.splice(i, 1)
          i--
          forCount--
        }
      }
    },
    delAllQuickMenu() {
      this.$reset()
    }
  }
})
