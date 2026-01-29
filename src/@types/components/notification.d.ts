/**
 * 通知系统类型定义
 */

/**
 * 跳转类型
 */
export type JumpType = 'PAGE' | 'URL' | 'NONE'

/**
 * 通知项
 */
export interface NotificationItem {
  /** 接收记录 ID */
  id: string
  /** 通知 ID */
  notificationId: string
  /** 业务类型 */
  bizType: string
  /** 业务 ID */
  bizId: string
  /** 通知标题 */
  title: string
  /** 通知内容 */
  content: string
  /** 跳转类型 */
  jumpType: JumpType
  /** 跳转目标 (路由名称或 URL) */
  jumpTarget: string
  /** 跳转参数 (JSON) */
  jumpParams: string
  /** 发送人 ID */
  senderId: string
  /** 已读状态 (0未读 1已读) */
  readStatus: 0 | 1
  /** 已读时间 */
  readAt: string | null
  /** 有效状态 (1有效 2失效) */
  validStatus: 1 | 2
  /** 创建时间 */
  createdTime: string
}

/**
 * 查询通知列表请求参数
 */
export interface ListNotificationReq {
  /** 分页大小 */
  pageSize: number
  /** 分页页码 */
  pageIndex: number
  /** 已读状态 (0未读 1已读，null查询全部) */
  readStatus?: 0 | 1 | null
  /** 有效状态 (0无效 1有效，null查询全部) */
  validStatus?: 0 | 1 | null
}

/**
 * 通知列表响应
 */
export interface NotificationListResp {
  /** 总数 */
  total: number
  /** 通知列表 */
  items: NotificationItem[]
}

/**
 * 未读通知数量响应
 */
export interface UnreadCountResp {
  /** 未读通知数量 */
  unreadCount: number
}
