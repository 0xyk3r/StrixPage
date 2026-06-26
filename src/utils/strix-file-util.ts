import type { AxiosResponse } from 'axios'

/**
 * 下载图像文件
 * @param {object} res 通过 axios 请求得到的 blob 响应结果
 * @param {string} fileName 下载的文件名
 */
export const downloadBlob = (res: AxiosResponse<Blob>, fileName: string) => {
  const blobURL = convertBlob(res)
  // 创建 a 标签，用于跳转至下载链接
  const tempLink = document.createElement('a')
  tempLink.style.display = 'none'
  tempLink.href = blobURL
  tempLink.setAttribute('download', fileName)
  // 兼容：某些浏览器不支持 HTML5 的 download 属性
  if (typeof tempLink.download === 'undefined') {
    tempLink.setAttribute('target', '_blank')
  }
  // 挂载 a 标签
  document.body.appendChild(tempLink)
  tempLink.click()
  document.body.removeChild(tempLink)
  // 释放 blob URL 地址
  URL.revokeObjectURL(blobURL)
}

/**
 * 通过 blob 响应结果创建一个 blob url
 * @param {object} res 通过 axios 请求得到的 blob 响应结果
 * @returns {string} blob url
 */
export const convertBlob = (res: AxiosResponse<Blob>): string => {
  const contentType = res.headers['content-type']

  const blob = new Blob([res.data], {
    type: typeof contentType === 'string' ? contentType : undefined
  })

  return URL.createObjectURL(blob)
}

/**
 * 格式化文件大小
 * @param {*} bytes  文件大小，单位为字节
 * @returns  {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = (bytes / Math.pow(k, i)).toFixed(2)
  return `${size} ${sizes[i]}`
}
