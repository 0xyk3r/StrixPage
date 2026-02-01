/**
 * 通用 API 响应类型
 */
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

/**
 * 分页响应数据类型
 */
export interface PageData<T = any> {
  items: T[]
  total: number
}

/**
 * 分页响应类型
 */
export type PageResponse<T = any> = ApiResponse<PageData<T>>
