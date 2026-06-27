import { isEqual } from 'lodash-es'
import { useDictStore } from '@/stores/dict'
import { deepSearch } from '@/utils/strix-tools'

export interface FilterDefinition {
  /** listParams 中的字段名 */
  key: string
  /** 中文显示标签 */
  label: string
  /** 字典名称，自动解析 value → label */
  dictName?: string
  /** 选项数据（select / cascader），支持响应式 */
  options?: Ref<Array<{ label: string; value: string | number }>> | Array<{ label: string; value: string | number }>
  /** 级联选项（树形结构，用 deepSearch 查找标签） */
  cascader?: boolean
  /** 自定义值显示转换 */
  transform?: (value: string | number | boolean | null) => string
  /** 清除此筛选时需要一同清除的关联字段 */
  excludeKeys?: string[]
}

export interface ActiveFilter {
  key: string
  label: string
  value: any
  displayValue: string
}

const PAGINATION_KEYS = ['pageIndex', 'pageSize']

/**
 * 筛选状态管理
 * 计算活跃筛选条件、解析显示标签、支持单条清除
 */
export function useFilterState(config: {
  definitions: FilterDefinition[]
  params: Ref<Record<string, any>>
  defaults: Record<string, any>
  onClear?: () => void
}) {
  const { definitions, params, defaults, onClear } = config
  const dictStore = useDictStore()

  /** 解析筛选值的显示文本 */
  function resolveDisplayValue(def: FilterDefinition, value: any): string {
    if (def.transform) return def.transform(value)

    if (def.dictName) {
      const cached = dictStore.dictMap[def.dictName]
      if (cached?.dictDataList) {
        const item = cached.dictDataList.find((d) => d.value === value || String(d.value) === String(value))
        if (item) return item.label
      }
    }

    if (def.options) {
      const opts = isRef(def.options) ? def.options.value : def.options
      if (def.cascader) {
        const node = deepSearch(opts, value, 'value')
        if (node) return node.label
      } else {
        const item = opts.find((o) => o.value === value)
        if (item) return item.label
      }
    }

    return String(value ?? '')
  }

  /** 活跃筛选条件列表 */
  const activeFilters = computed<ActiveFilter[]>(() => {
    const result: ActiveFilter[] = []
    for (const def of definitions) {
      if (PAGINATION_KEYS.includes(def.key)) continue
      const current = params.value[def.key]
      const defaultVal = defaults[def.key]
      if (current == null || current === '' || isEqual(current, defaultVal)) continue
      result.push({
        key: def.key,
        label: def.label,
        value: current,
        displayValue: resolveDisplayValue(def, current)
      })
    }
    return result
  })

  /** 活跃筛选条件数量 */
  const activeFilterCount = computed(() => activeFilters.value.length)

  /** 清除单个筛选条件 */
  function clearFilter(key: string) {
    const def = definitions.find((d) => d.key === key)
    params.value[key] = defaults[key] ?? null

    if (def?.excludeKeys) {
      for (const extraKey of def.excludeKeys) {
        params.value[extraKey] = defaults[extraKey] ?? null
      }
    }

    onClear?.()
  }

  return {
    activeFilters,
    activeFilterCount,
    clearFilter
  }
}
