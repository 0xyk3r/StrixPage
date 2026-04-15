import { debounce, isEqual } from 'lodash-es'

export interface FilterUrlConfig {
  /** 字段类型提示（用于 URL 反序列化） */
  types?: Record<string, 'string' | 'number'>
  /** 额外排除不同步到 URL 的字段 */
  exclude?: string[]
}

const ALWAYS_EXCLUDE = ['pageIndex', 'pageSize']

/**
 * 筛选条件 URL 持久化
 * 双向同步 listParams ↔ URL query string
 */
export function useFilterUrl(config: {
  params: Ref<Record<string, any>>
  defaults: Record<string, any>
  urlConfig?: FilterUrlConfig
}) {
  const { params, defaults, urlConfig } = config
  const router = useRouter()
  const route = useRoute()

  const excludeKeys = new Set([...ALWAYS_EXCLUDE, ...(urlConfig?.exclude ?? [])])

  /** 根据默认值或类型提示推断字段类型 */
  function coerceValue(key: string, raw: string): any {
    const typeHint = urlConfig?.types?.[key]
    if (typeHint === 'number') return Number(raw)
    if (typeHint === 'string') return raw

    const defaultVal = defaults[key]
    if (typeof defaultVal === 'number') return Number(raw)
    return raw
  }

  /** 从 URL 读取筛选条件并合并到 params */
  function readFromUrl() {
    const query = route.query
    let hasUrlParams = false

    for (const [key, value] of Object.entries(query)) {
      if (excludeKeys.has(key)) continue
      if (value == null || value === '') continue
      if (!(key in defaults)) continue

      const rawValue = Array.isArray(value) ? value[0] : value
      if (rawValue == null) continue

      params.value[key] = coerceValue(key, rawValue as string)
      hasUrlParams = true
    }

    return hasUrlParams
  }

  /** 将非默认值的筛选条件写入 URL */
  const writeToUrl = debounce(() => {
    const query: Record<string, string> = {}

    for (const [key, value] of Object.entries(params.value)) {
      if (excludeKeys.has(key)) continue
      if (value == null || value === '') continue
      if (isEqual(value, defaults[key])) continue
      query[key] = String(value)
    }

    const currentQuery: Record<string, string> = {}
    for (const [k, v] of Object.entries(route.query)) {
      if (!excludeKeys.has(k) && k in defaults) continue
      if (v != null) currentQuery[k] = String(v)
    }

    const merged = { ...currentQuery, ...query }

    if (!isEqual(merged, route.query)) {
      router.replace({ query: merged })
    }
  }, 300)

  // 初始化：从 URL 读取
  const hasUrlParams = readFromUrl()

  // 监听 params 变化，同步到 URL
  watch(params, writeToUrl, { deep: true })

  return { hasUrlParams }
}
