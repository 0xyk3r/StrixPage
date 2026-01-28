import { http } from '@/plugins/axios'
import { throttle } from 'lodash-es'
import { defineStore } from 'pinia'

export interface DictItem {
  label: string
  value: string | number | boolean
  [key: string]: any
}

export const useDictStore = defineStore(
  'dict',
  () => {
    const versionMap = ref<any>([])
    const dictMap = ref<Record<string, any>>({})

    // 请求去重 Map，避免并发重复请求
    const pendingMap = new Map<string, Promise<DictItem[]>>()

    /**
     * 刷新字典版本
     * *限流* 1s内仅在第一次调用时执行一次
     */
    const refreshVersion = throttle(
      async function refreshVersion() {
        const { data: res } = await http.get('system/common/dict/_version', {
          meta: { operate: '刷新字典版本', notify: false }
        })
        versionMap.value = res.data.items
      },
      1000,
      { leading: true, trailing: false }
    )

    /**
     * 从服务端加载字典数据
     */
    async function fetchDictData(key: string): Promise<DictItem[]> {
      const { data: res } = await http.get(`system/common/dict/${key}`, {
        meta: { operate: '获取字典数据', notify: false }
      })
      if (res?.data) {
        dictMap.value[key] = res.data

        res.data.dictDataList.forEach((item: any) => {
          if (item.value != null) {
            item.value = convertType(item.value, res.data.dataType)
          }
        })

        return res.data.dictDataList
      }
      return []
    }

    /**
     * 检查缓存是否有效
     */
    async function isCacheValid(key: string): Promise<boolean> {
      if (!dictMap.value[key]) return false
      await refreshVersion()
      const cache = dictMap.value[key]
      const version = versionMap.value.find((item: any) => item.key === key)
      return version && version.version === cache.version
    }

    /**
     * 获取字典数据（支持缓存 + 并发去重）
     * @param key 字典key
     * @returns 字典数据列表
     */
    async function getDictData(key: string): Promise<DictItem[]> {
      // 检查缓存是否有效
      if (await isCacheValid(key)) {
        return dictMap.value[key].dictDataList
      }

      // 如果已有相同 key 的请求在进行中，复用该 Promise
      if (pendingMap.has(key)) {
        return pendingMap.get(key)!
      }

      // 创建新请求并缓存 Promise
      const promise = fetchDictData(key).finally(() => {
        pendingMap.delete(key)
      })
      pendingMap.set(key, promise)

      return promise
    }

    return {
      versionMap,
      dictMap,
      refreshVersion,
      getDictData
    }
  },
  {
    persist: {
      key: '$strix-dict',
      storage: localStorage
    }
  }
)

function convertType(value: string, typeName: any) {
  switch (typeName) {
    case 1:
      return String(value)
    case 2:
      return Number(value)
    case 3:
      return Number(value)
    case 4:
      return parseFloat(value)
    case 5:
      return parseFloat(value)
    case 6:
      return Boolean(value)
    case 7:
      return parseInt(value)
    case 8:
      return parseInt(value)
    default:
      return value
  }
}
