<template>
  <div>
    <n-spin :show="loading" size="small">
      <span>{{ dataName }}</span>
    </n-spin>
  </div>
</template>
<script lang="ts" setup>
import type { StrixNameFetcherProps } from '@/@types/components/StrixNameFetcher'
import { callOnce } from '@/utils/strix-cache-call'
import { http } from '@/plugins/axios'

const { dataType, dataId } = defineProps<StrixNameFetcherProps>()

const loading = ref(true)
const dataName = ref('')

async function fetchName(dataType: string, dataId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http
      .get(`system/common/namefetcher`, {
        params: { dataType, dataId },
        meta: { operate: '数据 ID 映射' }
      })
      .then(({ data: res }) => {
        if (!res.data) {
          reject(new Error('数据 ID 映射失败'))
        }
        resolve(res.data)
      })
  })
}

onMounted(() => {
  callOnce(fetchName, dataType, dataId)
    .then((name) => {
      dataName.value = name
    })
    .catch(() => {
      dataName.value = `未知 (${dataId})`
    })
    .finally(() => {
      loading.value = false
    })
})
</script>
<style lang="scss" scoped></style>
