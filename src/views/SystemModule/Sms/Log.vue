<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">
        {{ _baseName }}管理
      </n-text>
    </n-h3>
    <strix-block style="margin-bottom: 20px" show-clear-button @clear-search="clearSearch">
      <template #show>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen" style="margin-bottom: 15px">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" placeholder="按手机号码搜索" clearable />
              <n-button type="primary" ghost @click="getDataList">
                搜索
              </n-button>
            </n-input-group>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="getDataListParams" label-placement="left" label-width="auto" :show-feedback="false">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi span="6 s:3 m:2" label="配置 Key" path="configKey">
            <n-select v-model:value="getDataListParams.configKey" :options="smsConfigSelectList" placeholder="请选择短信配置 Key"
              clearable @update:value="getDataList" @clear="getDataListParams.configKey = ''" />
          </n-form-item-gi>
          <n-form-item-gi span="6 s:3 m:2" label="发送状态" path="status">
            <n-select v-model:value="getDataListParams.status" :options="strixSmsLogStatusRef" placeholder="请选择短信发送状态"
              clearable @update:value="getDataList" @clear="getDataListParams.status = null" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table :remote="true" :loading="dataLoading" :columns="dataColumns" :data="dataRef"
      :pagination="dataPagination" :row-key="dataRowKey" />
  </div>
</template>

<script setup>
import StrixBlock from '@/components/StrixBlock.vue'
import StrixTag from '@/components/StrixTag.vue'
import { createPagination } from '@/plugins/pagination.js'
import { useDictsStore } from '@/stores/dicts'
import { NButton, NDataTable } from 'naive-ui'
import { getCurrentInstance, h, onMounted, provide, ref } from 'vue'

const { proxy } = getCurrentInstance()
const dictsStore = useDictsStore()

// 本页面操作提示关键词
const _baseName = '短信日志'

defineProps({
  isSmallWindow: {
    type: Boolean, default: false
  }
})

// 加载字典
const strixSmsPlatformRef = ref([])
const strixSmsLogStatusRef = ref([])
provide('StrixSmsPlatformDict', strixSmsPlatformRef)
provide('StrixSmsLogStatusDict', strixSmsLogStatusRef)
onMounted(() => {
  dictsStore.getDictData('StrixSmsPlatform', strixSmsPlatformRef)
  dictsStore.getDictData('StrixSmsLogStatus', strixSmsLogStatusRef)
})

// 获取列表请求参数
const getDataListParams = ref({
  keyword: '',
  status: null,
  pageIndex: 1,
  pageSize: 10
})
const clearSearch = () => {
  getDataListParams.value.keyword = ''
  getDataListParams.value.status = null
  getDataList()
}
// 展示列信息
const dataColumns = [
  { key: 'configKey', title: '短信配置 Key', width: 120 },
  { key: 'phoneNumber', title: '手机号码', width: 150 },
  {
    key: 'platform',
    title: '短信平台',
    width: 100,
    render(row) {
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
    render(row) {
      return h(StrixTag, { value: row.status, dictName: 'StrixSmsLogStatus' })
    }
  },
  { key: 'platformResponse', title: '平台响应', width: 250 },
  { key: 'createTime', title: '时间', width: 160 },
]
// 分页配置
const dataPagination = createPagination(getDataListParams, () => { getDataList() })
// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  proxy.$http.get('system/sms/log', { params: getDataListParams.value, operate: `加载${_baseName}列表` }).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.logs
    dataPagination.itemCount = res.data.total
  })
}
onMounted(getDataList)
const dataRowKey = (rowData) => rowData.id

// 加载短信配置选项
const smsConfigSelectList = ref([])
const getSmsConfigSelectList = () => {
  proxy.$http.get('system/sms/config/select', { operate: '加载短信配置下拉列表' }).then(({ data: res }) => {
    smsConfigSelectList.value = res.data.options
  })
}
onMounted(getSmsConfigSelectList)

</script>
<script>
export default {
  name: 'SystemModuleSmsLog'
}
</script>

<style lang="scss" scoped></style>
