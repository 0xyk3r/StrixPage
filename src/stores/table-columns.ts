import { defineStore } from 'pinia'

export interface ColumnConfig {
  key: string
  visible: boolean
  order: number
}

export const useTableColumnsStore = defineStore(
  'tableColumns',
  () => {
    const configs = ref<Record<string, ColumnConfig[]>>({})

    const getConfig = (tableId: string): ColumnConfig[] | undefined => {
      return configs.value[tableId]
    }

    const setConfig = (tableId: string, config: ColumnConfig[]) => {
      configs.value[tableId] = config
    }

    const removeConfig = (tableId: string) => {
      delete configs.value[tableId]
    }

    return { configs, getConfig, setConfig, removeConfig }
  },
  {
    persist: {
      key: '$table-columns',
      storage: localStorage
    }
  }
)
