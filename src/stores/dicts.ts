import { http } from '@/plugins/axios'
import { throttle } from 'lodash'
import { defineStore } from 'pinia'
import { type Ref } from 'vue'

export const useDictsStore = defineStore(
  'dicts',
  () => {
    const versionMap = ref<any>([])
    const dictMap = ref<any>({})

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
     * 加载服务端字典数据
     * *限流* 1s内仅在第一次调用时执行一次
     */
    const loadDictData = throttle(
      async function loadDictData(key) {
        const { data: res } = await http.get(`system/common/dict/${key}`, {
          meta: { operate: '获取字典数据', notify: false }
        })
        if (res) {
          dictMap.value[key] = res.data

          res.data.dictDataList.forEach((item: any) => {
            if (item.value != null) {
              item.value = convertType(item.value, res.data.dataType)
            }
          })

          return res.data.dictDataList
        } else {
          return []
        }
      },
      1000,
      { leading: true, trailing: false }
    )

    /**
     * 获取字典数据
     * @param {string} key 字典key
     * @param {ref} resultRef 结果存储的ref
     */
    async function getDictData(key: string, resultRef: Ref<any>) {
      let result = null
      if (dictMap.value[key]) {
        await refreshVersion()
        const cache = dictMap.value[key]
        const version = versionMap.value.find((item: any) => item.key === key)
        if (version && version.version === cache.version) {
          result = dictMap.value[key].dictDataList
          if (isRef(resultRef)) {
            resultRef.value = result
          }
          return result
        }
      }
      result = await loadDictData(key)
      if (isRef(resultRef)) {
        resultRef.value = result
      }
      return result
    }

    return {
      versionMap,
      dictMap,
      refreshVersion,
      loadDictData,
      getDictData
    }
  },
  {
    persist: {
      key: '$strix-dicts',
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
    default:
      return value
  }
}
