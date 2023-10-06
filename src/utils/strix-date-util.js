/**
 * 格式化日期 yyyy-MM-dd
 * @param {*} date Date 对象
 * @returns String yyyy-MM-dd 格式的日期字符串
 */
export const getFormattedDate = (date = new Date()) => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取日期差
 * @param {*} start 开始日期
 * @param {*} end 结束日期
 * @param {*} diffType 日期差结果单位 second minute hour day
 * @returns Number 日期差
 */
export const getDiff = (start, end, diffType) => {
  const divNums = {
    second: 1000,
    minute: 1000 * 60,
    hour: 1000 * 3600,
    day: 1000 * 3600 * 24
  }

  const sTime = new Date(start)
  const eTime = new Date(end)
  const divNum = divNums[diffType.toLowerCase()] || 1

  return (eTime.getTime() - sTime.getTime()) / divNum
}
