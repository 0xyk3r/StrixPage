export type DateDiffType = 'second' | 'minute' | 'hour' | 'day'

/**
 * 格式化日期 yyyy-MM-dd
 * @param {Date} date Date对象
 * @returns String yyyy-MM-dd 格式的日期字符串
 */
export const getFormattedDate = (date = new Date()) => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化 ISO 日期时间字符串为 yyyy-MM-dd HH:mm:ss
 * 兼容形如 "2024-01-01T12:00:00" 和 "2024-01-01 12:00:00" 的输入
 * @param time ISO 日期时间字符串，为空时返回 '-'
 */
export const formatISODateTime = (time: string | null | undefined): string => {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 19)
}

/**
 * 获取日期差
 * @param {string} start 开始日期
 * @param {string} end 结束日期
 * @param {'second'|'minute'|'hour'|'day'} diffType 日期差结果单位
 * @returns {number} 日期差
 */
export const getDiff = (start: string, end: string, diffType: DateDiffType): number => {
  const divNums: { [key in DateDiffType]: number } = {
    second: 1000,
    minute: 1000 * 60,
    hour: 1000 * 3600,
    day: 1000 * 3600 * 24
  }

  const sTime = new Date(start).getTime()
  const eTime = new Date(end).getTime()
  const divNum = divNums[diffType] || 1

  return (eTime - sTime) / divNum
}
