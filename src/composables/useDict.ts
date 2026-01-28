import { useDictStore } from '@/stores/dict.ts'

/**
 * 字典数据 Composable (完整版)
 * 支持缓存 + 并发请求去重
 * @param dictName 字典名称
 * @returns 响应式字典数据、加载状态及错误信息
 */
export function useDictFull(dictName: string) {
  const dictStore = useDictStore()

  const data = shallowRef<any[]>([])
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
