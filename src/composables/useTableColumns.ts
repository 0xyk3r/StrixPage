import type { DataTableColumn, DataTableColumns } from 'naive-ui'
import type { InjectionKey, Ref } from 'vue'
import { useTableColumnsStore } from '@/stores/table-columns'

export interface ColumnConfigItem {
  key: string
  title: string
  visible: boolean
}

export const COLUMN_PANEL_KEY = Symbol() as InjectionKey<{
  configs: Ref<ColumnConfigItem[]>
  reset: () => void
}>

function isFixedColumn(col: any): boolean {
  if (col.type === 'expand' || col.type === 'selection') return true
  if (col.key === 'actions' || col.key === 'action') return true
  return false
}

/**
 * 表格列可见性与排序管理
 * 自动持久化到 Pinia store，支持拖拽排序和显隐切换
 */
export function useTableColumns(rawColumns: DataTableColumns, tableId?: string) {
  const store = useTableColumnsStore()
  const route = useRoute()
  const id = tableId ?? route.path

  const showPanel = ref(false)

  // 分离固定列（不可切换）和可切换列
  const fixedStartColumns = rawColumns.filter((col: any) => col.type === 'expand' || col.type === 'selection')
  const fixedEndColumns = rawColumns.filter((col: any) => col.key === 'actions' || col.key === 'action')
  const toggleableRawColumns = rawColumns.filter((col: any) => !isFixedColumn(col) && col.key && col.title)

  const columnConfigs = ref<ColumnConfigItem[]>([])

  const initConfigs = () => {
    const stored = store.getConfig(id)
    if (stored?.length) {
      const result: ColumnConfigItem[] = []
      const usedKeys = new Set<string>()

      // 按存储顺序恢复列配置
      for (const sc of stored) {
        const raw = toggleableRawColumns.find((c: any) => c.key === sc.key)
        if (raw) {
          result.push({ key: sc.key, title: (raw as any).title as string, visible: sc.visible })
          usedKeys.add(sc.key)
        }
      }

      // 新增的列追加到末尾
      for (const raw of toggleableRawColumns) {
        const col = raw as any
        if (!usedKeys.has(col.key)) {
          result.push({ key: col.key, title: col.title as string, visible: true })
        }
      }

      columnConfigs.value = result
    } else {
      columnConfigs.value = toggleableRawColumns.map((col: any) => ({
        key: col.key as string,
        title: col.title as string,
        visible: true
      }))
    }
  }

  initConfigs()

  // 自动保存到 store
  watch(
    columnConfigs,
    () => {
      store.setConfig(
        id,
        columnConfigs.value.map((c, i) => ({ key: c.key, visible: c.visible, order: i }))
      )
    },
    { deep: true }
  )

  // 按配置过滤和排序后的列（供 n-data-table 使用）
  const visibleColumns = computed<DataTableColumns>(() => {
    const result: DataTableColumn[] = [...fixedStartColumns]
    for (const config of columnConfigs.value) {
      if (config.visible) {
        const rawCol = rawColumns.find((c: any) => c.key === config.key)
        if (rawCol) result.push(rawCol)
      }
    }
    result.push(...fixedEndColumns)
    return result
  })

  const resetToDefault = () => {
    store.removeConfig(id)
    initConfigs()
  }

  const visibleCount = computed(() => columnConfigs.value.filter((c) => c.visible).length)

  // 路由切换时关闭面板
  watch(
    () => route.path,
    () => {
      showPanel.value = false
    }
  )

  // 通过 provide 向 StrixColumnPanel 提供数据
  provide(COLUMN_PANEL_KEY, { configs: columnConfigs, reset: resetToDefault })

  return { visibleColumns, showPanel, columnConfigs, visibleCount, resetToDefault }
}
