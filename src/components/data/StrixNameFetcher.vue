<template>
  <div>
    <n-spin :show="loading" size="small">
      <n-popover trigger="hover">
        <template #trigger>
          <n-badge :offset="[11, 11]" color="grey" dot>
            <span>{{ dataName }}</span>
          </n-badge>
        </template>
        <span class="selectable">{{ 'ID: ' + dataId }}</span>
      </n-popover>
    </n-spin>
  </div>
</template>
<script lang="ts" setup>
import type { StrixNameFetcherProps } from '@/@types/components/StrixNameFetcher'
import { callOnce } from '@/utils/strix-cache-call'
import { commonApi } from '@/api/common'

const { dataType, dataId } = defineProps<StrixNameFetcherProps>()

const loading = ref(true)
const dataName = ref('加载中...')

async function fetchName(dataType: string, dataId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    commonApi.nameFetcher({ dataType, dataId }).then(({ data: res }) => {
      if (!res.data || !res.data.name) {
        reject(new Error('数据 ID 映射失败'))
      }
      resolve(res.data.name)
    })
  })
}

onMounted(() => {
  callOnce(fetchName, dataType, dataId)
    .then((name) => {
      dataName.value = name
    })
    .catch(() => {
      dataName.value = '未知'
    })
    .finally(() => {
      loading.value = false
    })
})
</script>
<style lang="scss" scoped></style>
