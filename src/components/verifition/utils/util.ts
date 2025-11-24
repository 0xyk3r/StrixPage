/**
 * 解析尺寸字符串，支持百分比和像素值
 * @param size - 尺寸字符串（如 '400px' 或 '80%'）
 * @param containerSize - 容器尺寸（用于百分比计算）
 * @returns 解析后的像素值字符串
 */
export function parseSize(size: string, containerSize: number): string {
  if (size.includes('%')) {
    return (parseInt(size) / 100) * containerSize + 'px'
  }
  return size
}

/**
 * 格式化时间为秒
 * @param milliseconds - 毫秒数
 * @returns 格式化后的秒数字符串（保留2位小数）
 */
export function formatDuration(milliseconds: number): string {
  return (milliseconds / 1000).toFixed(2)
}
