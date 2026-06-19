/**
 * Strix 业务异常
 *
 * 保留后端返回的完整错误信息，供调用方根据错误码做差异化处理。
 */
export class StrixError extends Error {
  /** 后端业务错误码 */
  public readonly code: number
  /** 后端具体错误信息 */
  public readonly detail: string
  /** 原始请求操作描述 */
  public readonly operate: string

  constructor(operate: string, code: number, detail: string) {
    super(`${operate}失败: ${detail}`)
    this.name = 'StrixError'
    this.code = code
    this.detail = detail
    this.operate = operate
  }
}
