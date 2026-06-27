import type { CommonDictDataItem, CommonDictResp, DictVersionItem } from '@/api/common'
import { commonApi } from '@/api/common'
import { throttle } from 'lodash-es'
import { defineStore } from 'pinia'

export interface DictItem {
  id: string
  key: string
  label: string
  value: string | number
  sort: number
  style: string
  status: number
  remark: string
  parentValue?: string
  isDefault?: number
  [k: string]: unknown
}

export const useDictStore = defineStore(
  'dict',
  () => {
    const versionMap = ref<DictVersionItem[]>([])
    const dictMap = ref<Record<string, CommonDictResp>>({})

    // 请求去重 Map，避免并发重复请求
    const pendingMap = new Map<string, Promise<DictItem[]>>()

    /**
     * 刷新字典版本
     * *限流* 1s内仅在第一次调用时执行一次
     */
    const refreshVersion = throttle(
      async function refreshVersion() {
        const { data: res } = await commonApi.dictVersion()
        versionMap.value = res.data.items
      },
      1000,
      { leading: true, trailing: false }
    )

    /**
     * 从服务端加载字典数据
     */
    async function fetchDictData(key: string): Promise<DictItem[]> {
      const { data: res } = await commonApi.dictData(key)
      if (res?.data) {
        dictMap.value[key] = res.data

        res.data.dictDataList.forEach((item: CommonDictDataItem) => {
          if (item.value != null) {
            ;(item as Record<string, any>).value = convertType(item.value, res.data.dataType)
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
      const version = versionMap.value.find((item) => item.key === key)
      return !!version && version.version === cache.version
    }

    /**
     * 获取字典数据（支持缓存 + 并发去重）
     * @param key 字典key
     * @returns 字典数据列表
     */
    async function getDictData(key: string): Promise<DictItem[]> {
      // 检查缓存是否有效
      if (await isCacheValid(key)) {
        return dictMap.value[key]!.dictDataList
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

    /**
     * SSE 触发的字典刷新：跳过缓存校验，直接拉取最新数据覆盖写入
     */
    async function refreshDictByKey(key: string): Promise<void> {
      await fetchDictData(key)
      console.log('Dict: 已刷新字典数据, key=', key)
    }

    /**
     * 获取字典默认值
     */
    async function getDefaultValue(key: string): Promise<DictItem['value'] | null> {
      const items = await getDictData(key)
      const defaultItem = items.find((item) => item.isDefault === 1)
      return defaultItem?.value ?? null
    }

    return {
      versionMap,
      dictMap,
      refreshVersion,
      getDictData,
      getDefaultValue,
      refreshDictByKey
    }
  },
  {
    persist: {
      key: '$strix-dict',
      storage: localStorage
    }
  }
)

/** 字典数据类型枚举（与后端 DictDataType 枚举对应） */
const enum DictDataType {
  STRING = 1,
  INTEGER = 2,
  LONG = 3,
  FLOAT = 4,
  DOUBLE = 5,
  BOOLEAN = 6,
  SHORT = 7,
  BYTE = 8,
  DATE = 9,
  JSON = 10,
  ENUM_SET = 11
}

function convertType(value: string, typeName: number) {
  switch (typeName) {
    case DictDataType.STRING:
      return String(value)
    case DictDataType.INTEGER:
    case DictDataType.LONG:
      return Number(value)
    case DictDataType.FLOAT:
    case DictDataType.DOUBLE:
      return parseFloat(value)
    case DictDataType.BOOLEAN:
      return Boolean(value)
    case DictDataType.SHORT:
    case DictDataType.BYTE:
      return parseInt(value)
    case DictDataType.DATE:
      return value // DATE: keep as ISO string
    case DictDataType.JSON: {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    case DictDataType.ENUM_SET:
      return value.split(',')
    default:
      return value
  }
}
