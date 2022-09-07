export const dateToString = (date) => {
  const separator = '-'
  const year = date.getFullYear()
  let month = date.getMonth() + 1
  let strDate = date.getDate()
  if (month >= 1 && month <= 9) {
    month = '0' + month
  }
  if (strDate >= 0 && strDate <= 9) {
    strDate = '0' + strDate
  }
  return year + separator + month + separator + strDate
}

export const getDiff = (start, end, diffType) => {
  diffType = diffType.toLowerCase()
  const sTime = new Date(start)
  const eTime = new Date(end)
  let divNum = 1
  switch (diffType) {
    case 'second':
      divNum = 1000
      break
    case 'minute':
      divNum = 1000 * 60
      break
    case 'hour':
      divNum = 1000 * 3600
      break
    case 'day':
      divNum = 1000 * 3600 * 24
      break
    default:
      break
  }
  return (eTime.getTime() - sTime.getTime()) / divNum
}
