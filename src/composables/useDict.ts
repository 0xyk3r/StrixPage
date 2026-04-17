import type { Ref } from 'vue'
import { type DictItem, useDictStore } from '@/stores/dict.ts'

/**
 * 字典数据 Composable (完整版)
 * 支持缓存 + 并发请求去重
 * @param dictName 字典名称
 * @returns 响应式字典数据、加载状态及错误信息
 */
export function useDictFull(dictName: string) {
  const dictStore = useDictStore()

  const data = shallowRef<DictItem[]>([])
  const loading = ref(true)
  const error = ref<Error | null>(null)

  // 立即开始加载
  dictStore
    .getDictData(dictName)
    .then((result) => {
      data.value = result
    })
    .catch((e) => {
      error.value = e
    })
    .finally(() => {
      loading.value = false
    })

  return {
    data,
    loading,
    error
  }
}

/**
 * 字典数据 Composable（简化版，向后兼容）
 * 仅返回字典数据 ref
 * @param dictName 字典名称
 * @returns 响应式字典数据
 */
export function useDict(dictName: string) {
  return useDictFull(dictName).data
}

/**
 * @deprecated 请使用 useDict
 */
export const useDictData = useDict

/**
 * 级联字典数据 Composable
 * 根据父级值过滤子级字典数据
 * @param childDictName 子级字典名称
 * @param parentValue 响应式的父级值
 * @returns 过滤后的字典数据
 */
export function useCascadeDict(childDictName: string, parentValue: Ref<string | number | null>) {
  const fullData = useDict(childDictName)
  return computed(() => {
    if (parentValue.value == null) return fullData.value
    return fullData.value.filter((item) => item.parentValue === String(parentValue.value))
  })
}
