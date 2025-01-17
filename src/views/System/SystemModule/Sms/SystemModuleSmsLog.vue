<template>
  <div>
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input
                v-model:value="getDataListParams.keyword"
                clearable
                placeholder="按手机号码搜索"
              />
              <n-button ghost type="primary" @click="getDataList"> 搜索</n-button>
            </n-input-group>
          </n-gi>
        </n-grid>
      </template>
      <n-form
        :model="getDataListParams"
        :show-feedback="false"
        label-placement="left"
        label-width="auto"
      >
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
          <n-form-item-gi label="发送状态" path="status" span="6 s:3 m:2">
            <n-select
              v-model:value="getDataListParams.status"
              :options="strixSmsLogStatusRef"
              clearable
              placeholder="请选择短信发送状态"
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
import StrixBlock from '@/components/StrixBlock.vue'
import StrixTag from '@/components/StrixTag.vue'
import { http } from '@/plugins/axios'
import { usePage } from '@/utils/common-page-util'
import { useDict } from '@/utils/strix-dict-util'
import { type DataTableColumns } from 'naive-ui'

// 本页面操作提示关键词
const _baseName = '短信日志'

// 加载字典
const strixSmsLogStatusRef = useDict('StrixSmsLogStatus')

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
  { key: 'configKey', title: '短信配置 Key', width: 140 },
  { key: 'phoneNumber', title: '手机号码', width: 160 },
  {
    key: 'platform',
    title: '短信平台',
    width: 120,
    align: 'center',
    render(row: any) {
      return h(StrixTag, { value: row.platform, dictName: 'StrixSmsPlatform' })
    }
  },
  { key: 'signName', title: '签名', width: 160 },
  { key: 'templateCode', title: '模板 Code', width: 160 },
  { key: 'templateParam', title: '模板参数', width: 260 },
  { key: 'requesterIp', title: 'IP 地址', width: 120 },
  {
    key: 'status',
    title: '状态',
    width: 120,
    align: 'center',
    render(row: any) {
      return h(StrixTag, { value: row.status, dictName: 'StrixSmsLogStatus' })
    }
  },
  { key: 'platformResponse', title: '平台响应', width: 240 },
  { key: 'createdTime', title: '时间', width: 180 }
]
// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  http
    .get('system/sms/log', {
      params: getDataListParams.value,
      meta: { operate: `加载${_baseName}列表` }
    })
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.logs
      dataPagination.itemCount = res.data.total
    })
}
onMounted(getDataList)

// 加载短信配置选项
const smsConfigSelectList = ref([])
const getSmsConfigSelectList = () => {
  http
    .get('system/sms/config/select', { meta: { operate: '加载短信配置下拉列表' } })
    .then(({ data: res }) => {
      smsConfigSelectList.value = res.data.options
    })
}
onMounted(getSmsConfigSelectList)
</script>

<style lang="scss" scoped></style>
