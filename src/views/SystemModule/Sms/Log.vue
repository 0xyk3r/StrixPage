<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">
        {{ funName }}管理
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
              value-field="id" label-field="name" @update:value="getDataList" @clear="getDataListParams.configKey = ''"
              clearable />
          </n-form-item-gi>
          <n-form-item-gi span="6 s:3 m:2" label="发送状态" path="status">
            <n-select v-model:value="getDataListParams.status" :options="smsLogStatusOptions" placeholder="请选择短信发送状态"
              @update:value="getDataList" @clear="getDataListParams.status = ''" clearable />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table :remote="true" :loading="dataLoading" :columns="dataColumns" :data="dataData"
      :pagination="dataPagination" :row-key="dataRowKey" />

  </div>
</template>

<script setup>
import StrixBlock from '@/components/StrixBlock.vue'
import { h, onMounted, reactive, ref } from 'vue'
import { createStrixNotify } from '@/utils/strix-notify'
import { NButton, NTag, NDataTable, NPopconfirm } from 'naive-ui'
import useCurrentInstance from '@/utils/strix-instance-tool'
import _ from 'lodash'

const { proxy } = useCurrentInstance()

// 本页面操作提示关键词
const funName = '短信日志'

defineProps({
  isSmallWindow: {
    type: Boolean, default: false
  }
})

// 获取列表请求参数
const getDataListParams = ref({
  keyword: '',
  status: '',
  parentId: '',
  current: 1,
  size: 10
})
// 展示列信息
const dataColumns = [
  { key: 'configKey', title: '短信配置 Key', width: 120 },
  { key: 'phoneNumber', title: '手机号码', width: 150 },
  {
    key: 'platform',
    title: '短信平台',
    width: 100,
    render(row) {
      const option = _.find(smsConfigPlatformOptions, function (o) { return o.value === row.platform })
      return h(NTag, {
        type: option?.type || 'default',
        bordered: false
      }, {
        default: () => option?.label || '未知'
      })
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
      const option = _.find(smsLogStatusOptions, function (o) { return o.value === row.status })
      return h(NTag, {
        type: option?.type || 'default',
        bordered: false
      }, {
        default: () => option?.label || '未知'
      })
    }
  },
  { key: 'platformResponse', title: '平台响应', width: 250 },
  { key: 'createTime', title: '时间', width: 160 },
]
// 分页配置
const dataPagination = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 50, 100],
  prefix({ itemCount }) {
    return `共 ${itemCount} 条`
  },
  onChange: (page) => {
    dataPagination.page = page
    getDataListParams.value.current = page
    getDataList()
  },
  onUpdatePageSize: (pageSize) => {
    dataPagination.pageSize = pageSize
    dataPagination.page = 1
    getDataListParams.value.size = pageSize
    getDataListParams.value.current = 1
    getDataList()
  }
})
// 加载列表
const dataData = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  proxy.$http.get('system/sms/log', { params: getDataListParams.value }).then(({ data: res }) => {
    if (res.code !== 200) {
      createStrixNotify('warning', `获取${funName}列表失败`, res.msg)
    }
    dataLoading.value = false
    dataData.value = res.data.logs
    dataPagination.itemCount = res.data.total
  })
}
onMounted(() => {
  getDataList()
})
const dataRowKey = (rowData) => rowData.id
const clearSearch = () => {
  getDataListParams.value.keyword = ''
  getDataListParams.value.status = ''
  getDataList()
}


// 加载短信配置选项
const smsConfigSelectList = ref([])
const getSmsConfigSelectList = () => {
  proxy.$http.get('system/sms/config/select').then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', '加载短信配置下拉列表失败', res.msg)
    }
    smsConfigSelectList.value = res.data.options
  })
}
onMounted(getSmsConfigSelectList)

const smsConfigPlatformOptions = [
  { value: '', label: '未选择' },
  { value: 1, label: '阿里云', type: 'warning' },
  { value: 2, label: '腾讯云', type: 'primary' },
]
const smsLogStatusOptions = [
  { value: '', label: '未选择' },
  { value: 1, label: '待发送', type: 'warning' },
  { value: 2, label: '已发送', type: 'success' },
  { value: 3, label: '发送失败', type: 'error' },
]

</script>
<script>
export default {
  name: 'SystemModuleSmsLog'
}
</script>

<style lang="scss" scoped></style>
