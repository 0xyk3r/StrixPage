import type { DataTableColumn } from 'naive-ui'
import { http } from '@/plugins/axios'
import { useDictStore } from '@/stores/dict'

export type ExportFormat = 'xlsx' | 'csv'
export type ExportScope = 'current' | 'all' | 'selected'

export interface ExportableColumn {
  key: string
  title: string
  enabled: boolean
  dictName?: string
  valueMap?: Record<string, string>
  valueResolver?: (val: any, row: any) => string | Promise<string>
}

export interface ExportConfig {
  scope: ExportScope
  format: ExportFormat
  columns: ExportableColumn[]
  filename: string
}

/**
 * 从 n-data-table 的列定义中提取可导出列
 * 过滤掉 selection / expand / actions 等非数据列
 */
export function extractExportableColumns(columns: DataTableColumn[]): ExportableColumn[] {
  return columns
    .filter((col): col is DataTableColumn & { key: string; title: string } => {
      if ('type' in col && (col.type === 'selection' || col.type === 'expand')) return false
      if (!('key' in col) || !('title' in col)) return false
      if (col.key === 'actions' || col.key === 'action') return false
      if ('exportable' in col && col.exportable === false) return false
      return typeof col.key === 'string' && typeof col.title === 'string'
    })
    .map((col) => ({
      key: col.key,
      title: col.title,
      enabled: true,
      ...('dictName' in col && col.dictName ? { dictName: col.dictName } : {}),
      ...('valueMap' in col && col.valueMap ? { valueMap: col.valueMap } : {}),
      ...('valueResolver' in col && col.valueResolver ? { valueResolver: col.valueResolver } : {})
    }))
}

/**
 * 将表格数据导出为文件
 * 支持字典解析、静态值映射和自定义解析器（含异步）
 */
export async function exportData(data: any[], config: ExportConfig) {
  const enabledColumns = config.columns.filter((c) => c.enabled)
  if (enabledColumns.length === 0 || data.length === 0) return

  const dictStore = useDictStore()

  // 预解析 valueResolver 列（按唯一值批量解析，避免重复调用）
  const preResolvedMaps = new Map<string, Map<string, string>>()
  for (const col of enabledColumns) {
    if (col.valueResolver) {
      const uniqueEntries = new Map<string, { val: any; row: any }>()
      for (const row of data) {
        const val = row[col.key]
        const key = val === null || val === undefined ? '\0' : String(val)
        if (!uniqueEntries.has(key)) uniqueEntries.set(key, { val, row })
      }
      const resolvedMap = new Map<string, string>()
      await Promise.all(
        [...uniqueEntries.entries()].map(async ([key, { val, row }]) => {
          try {
            resolvedMap.set(key, await Promise.resolve(col.valueResolver!(val, row)))
          } catch {
            resolvedMap.set(key, val == null ? '' : String(val))
          }
        })
      )
      preResolvedMaps.set(col.key, resolvedMap)
    }
  }

  // 构建表头
  const headers = enabledColumns.map((c) => c.title)
  // 构建数据行
  const rows = data.map((row) =>
    enabledColumns.map((col) => {
      const val = row[col.key]

      // 优先使用预解析结果（valueResolver）
      if (preResolvedMaps.has(col.key)) {
        const key = val === null || val === undefined ? '\0' : String(val)
        return preResolvedMaps.get(col.key)!.get(key) ?? ''
      }

      if (val === null || val === undefined) return ''

      // 静态值映射
      if (col.valueMap) {
        return col.valueMap[String(val)] ?? String(val)
      }

      // 字典解析
      if (col.dictName) {
        const dictData = dictStore.dictMap[col.dictName]
        if (dictData?.dictDataList) {
          const item = dictData.dictDataList.find((d) => d.value === val)
          if (item) return item.label
        }
      }

      return String(val)
    })
  )

  const sheetData = [headers, ...rows]
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.aoa_to_sheet(sheetData)

  // 自动列宽
  ws['!cols'] = enabledColumns.map((col) => {
    const maxLen = Math.max(
      col.title.length * 2,
      ...rows.map((r) => {
        const idx = enabledColumns.indexOf(col)
        return String(r[idx] || '').length
      })
    )
    return { wch: Math.min(Math.max(maxLen + 2, 10), 50) }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, config.filename.slice(0, 31))

  if (config.format === 'csv') {
    XLSX.writeFile(wb, `${config.filename}.csv`, { bookType: 'csv' })
  } else {
    XLSX.writeFile(wb, `${config.filename}.xlsx`, { bookType: 'xlsx' })
  }
}

/**
 * 生成默认文件名：页面标题_日期
 */
export function generateFilename(title: string): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${title}_${y}-${m}-${d}`
}

/**
 * 创建分页全量数据获取函数
 * 自动遍历所有分页获取完整数据集，用于导出全部数据
 */
export function createPaginatedFetcher(
  url: string | (() => string),
  listKey: string,
  getParams: () => Record<string, any>
): () => Promise<any[]> {
  return async () => {
    const allData: any[] = []
    let pageIndex = 1
    const pageSize = 200
    let total = Infinity

    const resolvedUrl = typeof url === 'function' ? url() : url

    while (allData.length < total) {
      const { data: res } = await http.get(resolvedUrl, {
        params: { ...getParams(), pageIndex, pageSize },
        meta: { operate: '导出全部数据' }
      })
      const items = res.data[listKey] || []
      allData.push(...items)
      total = res.data.total ?? items.length
      pageIndex++
      if (items.length === 0 || items.length < pageSize) break
    }

    return allData
  }
}
