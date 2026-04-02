/** 通用 API 响应包装 */
export interface RetResult<T = any> {
  code: number
  msg: string
  data: T
}

/** 下拉选择项 */
export interface SelectDataItem {
  value: string
  label: string
  attach: string
}

/** 下拉选择响应 */
export interface SelectDataResp {
  options: SelectDataItem[]
}

/** 穿梭框数据项 */
export interface TransferDataItem {
  value: string
  label: string
  status: number
}

/** 穿梭框数据响应 */
export interface TransferDataResp {
  transferData: TransferDataItem[]
}

/** 树形数据项 */
export interface TreeDataItem {
  value: string
  label: string
  children: TreeDataItem[]
  isLeaf: boolean
}

/** 树形数据响应 */
export interface TreeDataResp {
  tree: TreeDataItem[]
}

/** 级联选择数据项 */
export interface CascaderDataItem {
  value: string
  label: string
  children: CascaderDataItem[]
}

/** 级联选择数据响应 */
export interface CascaderDataResp {
  options: CascaderDataItem[]
}
