/** 通用 API 响应包装 */
export interface RetResult<T = any> {
  code: number
  msg: string
  data: T
}
