export type NTagType = 'default' | 'error' | 'success' | 'warning' | 'primary' | 'info'

declare module 'naive-ui/es/data-table/src/interface' {
  interface CommonColumnInfo {
    dictName?: string
    valueMap?: Record<string, string>
    valueResolver?: (val: any, row: any) => string | Promise<string>
    exportable?: boolean
  }
}
