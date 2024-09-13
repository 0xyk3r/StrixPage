/**
 * 获取路由的动态名称
 * @param nameTemplate 动态名称模板
 * @param params 路由参数
 * @returns 动态名称
 */
export const replaceDynamicName = (nameTemplate: string, params: Record<string, any>): string => {
  return nameTemplate.replace(/\{(.+?)\}/g, (_, key) => params[key.trim()] ?? `{${key}}`)
}

export const replaceDynamicPath = (path: string, params: Record<string, any>): string => {
  return path.replace(/\{(.+?)\}/g, (_, key) => params[key.trim()] ?? `:{${key}}`)
}
