<template>
  <div>
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" clearable placeholder="按签名搜索" />
              <n-button ghost type="primary" @click="getDataList"> 搜索</n-button>
            </n-input-group>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="getDataListParams" :show-feedback="false" label-placement="left" label-width="auto">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi label="配置 Key" path="configKey" span="6 s:3 m:2">
            <n-select
              v-model:value="getDataListParams.configKey"
              :options="smsConfigSelectList"
              clearable
              placeholder="请选择短信配置 Key"
              @update:value="getDataList"
            />
          </n-form-item-gi>
          <n-form-item-gi label="状态" path="status" span="6 s:3 m:2">
            <n-select
              v-model:value="getDataListParams.status"
              :options="strixSmsSignStatusRef"
              clearable
              placeholder="请选择状态"
              @update:value="getDataList"
            />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table
      :columns="dataColumns"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="dataPagination"
      :remote="true"
      :row-key="dataRowKey"
      table-layout="fixed"
    />
  </div>
</template>

<script lang="ts" setup>
import StrixBlock from '@/components/common/StrixBlock.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import { http } from '@/plugins/axios'
import { usePage } from '@/composables/usePage.ts'
import { useDict } from '@/composables/useDict.ts'
import { type DataTableColumns } from 'naive-ui'

// 本页面操作提示关键词
const _baseName = '短信签名'

// 加载字典
const strixSmsSignStatusRef = useDict('StrixSmsSignStatus')

const { getDataListParams, clearSearch, dataPagination, dataRowKey } = usePage(
  {
    keyword: null,
    configKey: null,
    status: null,
    pageIndex: 1,
    pageSize: 10
  },
  () => {
    getDataList()
  },
  null,
  null
)
// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'configKey', title: '短信配置 Key', width: 180 },
  { key: 'name', title: '签名', width: 240 },
  {
    key: 'status',
    title: '状态',
    width: 120,
    align: 'center',
    render(row: any) {
      return h(StrixTag, { value: row.status, dictName: 'StrixSmsSignStatus' })
    }
  }
]
// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  http
    .get('system/sms/sign', {
      params: getDataListParams.value,
      meta: { operate: `加载${_baseName}列表` }
    })
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.signs
      dataPagination.itemCount = res.data.total
    })
}
onMounted(getDataList)

// 加载短信配置选项
const smsConfigSelectList = ref([])
const getSmsConfigSelectList = () => {
  http.get('system/sms/config/select', { meta: { operate: '加载短信配置下拉列表' } }).then(({ data: res }) => {
    smsConfigSelectList.value = res.data.options
  })
}
onMounted(getSmsConfigSelectList)
</script>

<style lang="scss" scoped></style>
