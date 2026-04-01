import * as XLSX from 'xlsx'
import type { DataTableColumn } from 'naive-ui'
import { http } from '@/plugins/axios'

export type ExportFormat = 'xlsx' | 'csv'
export type ExportScope = 'current' | 'all' | 'selected'

export interface ExportableColumn {
  key: string
  title: string
  enabled: boolean
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
    .filter((col: any) => {
      if (col.type === 'selection' || col.type === 'expand') return false
      if (col.key === 'actions' || col.key === 'action') return false
      return col.key && col.title
    })
    .map((col: any) => ({
      key: col.key as string,
      title: col.title as string,
      enabled: true
    }))
}

/**
 * 将表格数据导出为文件
 */
export function exportData(data: any[], config: ExportConfig, dictResolver?: (dictName: string, value: any) => string) {
  const enabledColumns = config.columns.filter((c) => c.enabled)
  if (enabledColumns.length === 0 || data.length === 0) return

  // 构建表头
  const headers = enabledColumns.map((c) => c.title)
  // 构建数据行
  const rows = data.map((row) =>
    enabledColumns.map((col) => {
      const val = row[col.key]
      if (val === null || val === undefined) return ''
      return String(val)
    })
  )

  const sheetData = [headers, ...rows]
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
