<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success"> {{ _baseName }}管理 </n-text>
    </n-h3>
    <strix-block style="margin-bottom: 20px" cleanable @clear="clearSearch">
      <template #body>
        <n-grid
          :cols="6"
          :x-gap="20"
          :y-gap="5"
          item-responsive
          responsive="screen"
          style="margin-bottom: 15px"
        >
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input
                v-model:value="getDataListParams.keyword"
                placeholder="按手机号码搜索"
                clearable
              />
              <n-button type="primary" ghost @click="getDataList"> 搜索 </n-button>
            </n-input-group>
          </n-gi>
        </n-grid>
      </template>
      <n-form
        :model="getDataListParams"
        label-placement="left"
        label-width="auto"
        :show-feedback="false"
      >
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi span="6 s:3 m:2" label="配置 Key" path="configKey">
            <n-select
              v-model:value="getDataListParams.configKey"
              :options="smsConfigSelectList"
              placeholder="请选择短信配置 Key"
              clearable
              @update:value="getDataList"
            />
          </n-form-item-gi>
          <n-form-item-gi span="6 s:3 m:2" label="发送状态" path="status">
            <n-select
              v-model:value="getDataListParams.status"
              :options="strixSmsLogStatusRef"
              placeholder="请选择短信发送状态"
              clearable
              @update:value="getDataList"
            />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table
      :remote="true"
      :loading="dataLoading"
      :columns="dataColumns"
      :data="dataRef"
      :pagination="dataPagination"
      :row-key="dataRowKey"
    />
  </div>
</template>

<script setup lang="ts">
import StrixBlock from '@/components/StrixBlock.vue'
import StrixTag from '@/components/StrixTag.vue'
import { http } from '@/plugins/axios'
import { usePage } from '@/utils/common-page-util'
import { useDict } from '@/utils/strix-dict-util'
import { type DataTableColumns } from 'naive-ui'
import { h, onMounted, ref } from 'vue'

// 本页面操作提示关键词
const _baseName = '短信日志'

// 加载字典
const strixSmsPlatformRef = useDict('StrixSmsPlatform')
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
  { key: 'configKey', title: '短信配置 Key', width: 120 },
  { key: 'phoneNumber', title: '手机号码', width: 150 },
  {
    key: 'platform',
    title: '短信平台',
    width: 100,
    render(row: any) {
      return h(StrixTag, { value: row.platform, dictName: 'StrixSmsPlatform' })
    }
  },
  { key: 'signName', title: '签名', width: 150 },
  { key: 'templateCode', title: '模板 Code', width: 150 },
  { key: 'templateParam', title: '模板参数', width: 250 },
  { key: 'requesterIp', title: 'IP 地址', width: 100 },
  {
    key: 'status',
    title: '状态',
    width: 120,
    render(row: any) {
      return h(StrixTag, { value: row.status, dictName: 'StrixSmsLogStatus' })
    }
  },
  { key: 'platformResponse', title: '平台响应', width: 250 },
  { key: 'createTime', title: '时间', width: 160 }
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
