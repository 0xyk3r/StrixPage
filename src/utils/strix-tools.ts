/**
 * 深度搜索value 树状数据搜索
 * @param {Array} data - 树状数据
 * @param {string} value - 要搜索的值
 * @param {string} key - 搜索的键名，默认为 `id`
 * @param {string} sub - 子节点的键名，默认为 `children`
 * @returns {Object} - 返回搜索到的节点或false
 */
export const deepSearch = (data: any[], value: string, key: string = 'id', sub: string = 'children'): any => {
  if (!value || !data) {
    return false
  }
  for (const node of data) {
    if (node[key] === value) {
      return node
    }
    const found = deepSearch(node[sub], value, key, sub)
    if (found) {
      return found
    }
  }
  return null
}

/**
 * 深度搜索key 树状数据搜索 类似于.map(d => d[key]) 但是会递归子节点
 * @param {Array} data - 树状数据
 * @param {string} key - 映射的键名，默认为 `id`
 * @param {string} sub - 子节点的键名，默认为 `children`
 * @returns {Array} - 返回映射后的数组
 */
export const deepMap = (data: any[], key: string = 'id', sub: string = 'children'): Array<any> => {
  if (!data) return []
  const results: any[] = data.flatMap((d) => [d[key], ...(d[sub] ? deepMap(d[sub], key, sub) : [])])
  return results.filter(Boolean)
}

export const flatTree = (data: any[], sub = 'children', res: any[] = []) => {
  data.forEach((item) => {
    res.push(item)
    if (item[sub] && item[sub].length > 0) {
      flatTree(item.children, sub, res)
    }
  })
  return res
}
