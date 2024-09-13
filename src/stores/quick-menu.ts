import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface QuickMenuInfo {
  id: string
  name: string
  tips?: string
  icon?: string
  color?: string
  callback: () => void
}

export const useQuickMenuStore = defineStore('quickMenu', () => {
  const quickMenus = ref<QuickMenuInfo[]>([])

  function addQuickMenu(quickMenu: QuickMenuInfo) {
    if (!quickMenu.color) {
      quickMenu.color = 'primary'
    }
    quickMenus.value.push(quickMenu)
  }

  function delQuickMenu(quickMenuId: string) {
    let forCount = quickMenus.value.length
    for (let i = 0; i < forCount; i++) {
      const item = quickMenus.value[i]
      if (item.id === quickMenuId) {
        quickMenus.value.splice(i, 1)
        i--
        forCount--
      }
    }
  }

  function delAllQuickMenu() {
    quickMenus.value = []
  }

  return {
    quickMenus,
    addQuickMenu,
    delQuickMenu,
    delAllQuickMenu
  }
})
