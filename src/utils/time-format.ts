/**
 * 时间格式化工具函数
 */

/**
 * 将时间字符串转换为相对时间
 * @param dateString - ISO 8601 格式的时间字符串
 * @returns 相对时间字符串，如"刚刚"、"5分钟前"、"昨天 14:30"等
 */
export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  // 1分钟内
  if (diffSeconds < 60) {
    return '刚刚'
  }

  // 1小时内
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  }

  // 今天
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (date >= todayStart) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `今天 ${hours}:${minutes}`
  }

  // 昨天
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000)
  if (date >= yesterdayStart) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `昨天 ${hours}:${minutes}`
  }

  // 7天内
  if (diffDays < 7) {
    return `${diffDays}天前`
  }

  // 今年内
  if (date.getFullYear() === now.getFullYear()) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  }

  // 跨年
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}
