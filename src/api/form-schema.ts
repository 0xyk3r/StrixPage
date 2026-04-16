import type { RetResult } from './types'
import { http } from '@/plugins/axios'

/** 字段 Schema 定义 */
export interface FieldSchema {
  type?: 'text' | 'select' | 'password' | 'email' | 'number'
  label?: string
  required?: boolean
  requiredGroups?: ('insert' | 'update')[]
  groups?: ('insert' | 'update')[]
  min?: number
  max?: number
  pattern?: string
  dictName?: string
  complexity?: boolean
}

/** 表单 Schema 响应 */
export interface FormSchemaResp {
  dtoName: string
  fields: Record<string, FieldSchema>
}

/** Schema 覆盖定义 */
export interface SchemaOverride {
  /** 完全替换该字段的规则 */
  replace?: import('naive-ui').FormItemRule[]
  /** 在 schema 规则后追加额外规则 */
  append?: import('naive-ui').FormItemRule[]
}

/** 字段 → 覆盖映射 */
export type SchemaOverrides = Record<string, SchemaOverride>

export const formSchemaApi = {
  get: (dtoName: string) =>
    http.get<RetResult<FormSchemaResp>>(`system/form-schema/${dtoName}`, {
      meta: { operate: '加载表单 Schema' }
    })
}
