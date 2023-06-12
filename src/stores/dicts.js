import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getCurrentInstance } from 'vue';
import { throttle } from 'lodash';

export const useDictsStore = defineStore('dicts', () => {
  const { proxy } = getCurrentInstance()

  const versionMap = ref([]);
  const dictMap = ref({});

  /**
   * 刷新字典版本
   * *限流* 1s内仅在第一次调用时执行一次
   */
  const refreshVersion = throttle(async function refreshVersion() {
    const { data: res } = await proxy.$http.get('system/common/dict/_version', { operate: '刷新字典版本', notify: false })
    versionMap.value = res.data.items
  }, 1000, { leading: true, trailing: false })

  /**
   * 加载服务端字典数据
   */
  async function loadDictData(key) {
    const { data: res } = await proxy.$http.get(`system/common/dict/${key}`, { operate: '获取字典数据', notify: false })
    if (res) {
      dictMap.value[key] = res.data;
      return res.data.dictDataList;
    } else {
      return [];
    }
  }

  /**
   * 获取字典数据
   */
  async function getDictData(key) {
    if (dictMap.value[key]) {
      await refreshVersion();
      const cache = dictMap.value[key];
      const version = versionMap.value.find(item => item.key === key);
      if (version && version.version === cache.version) {
        return dictMap.value[key].dictDataList;
      }
    }
    return loadDictData(key);
  }

  return {
    versionMap,
    dictMap,
    refreshVersion,
    loadDictData,
    getDictData
  };
}, {
  persist: {
    key: '$strix-dicts',
    storage: localStorage
  }
})
