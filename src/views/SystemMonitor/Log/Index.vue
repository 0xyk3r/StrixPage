<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">
        {{ _baseName }}管理
      </n-text>
    </n-h3>
    <strix-block style="margin-bottom: 20px" show-clear-button @clear-search="clearSearch">
      <template #show>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" placeholder="按操作名称搜索" clearable />
              <n-button type="primary" ghost @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="getDataListParams" label-placement="left" label-width="auto" :show-feedback="false">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi span="6 s:3 m:2" label="操作类型" path="operationType">
            <n-select v-model:value="getDataListParams.operationType" :options="smsConfigSelectList" placeholder="请选择操作类型"
              clearable @update:value="getDataList" @clear="getDataListParams.configKey = ''" />
          </n-form-item-gi>
          <n-form-item-gi span="6 s:3 m:2" label="操作分组" path="operationGroup">
            <n-select v-model:value="getDataListParams.operationGroup" :options="smsSignStatusOptions"
              placeholder="请选择操作分组" clearable @update:value="getDataList"
              @clear="getDataListParams.operationGroup = ''" />
          </n-form-item-gi>
          <n-form-item-gi span="6 s:3 m:2" label="响应状态码" path="responseCode">
            <n-select v-model:value="getDataListParams.responseCode" :options="smsSignStatusOptions"
              placeholder="请选择响应状态码" clearable @update:value="getDataList" @clear="getDataListParams.responseCode = ''" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table :remote="true" :loading="dataLoading" :columns="dataColumns" :data="dataRef" :pagination="dataPagination"
      :row-key="dataRowKey" />
  </div>
</template>

<script setup>
import StrixBlock from '@/components/StrixBlock.vue'
import { createPagination } from '@/plugins/pagination.js'
import { NButton, NDataTable, NTag } from 'naive-ui'
import { getCurrentInstance, h, onMounted, ref } from 'vue'

const { proxy } = getCurrentInstance()

// 本页面操作提示关键词
const _baseName = '系统日志'

defineProps({
  isSmallWindow: {
    type: Boolean, default: false
  }
})

// 获取列表请求参数
const getDataListParams = ref({
  keyword: '',
  operationType: '',
  operationGroup: '',
  responseCode: '',
  pageIndex: 1,
  pageSize: 10
})
const clearSearch = () => {
  getDataListParams.value.keyword = ''
  getDataListParams.value.operationType = ''
  getDataListParams.value.operationGroup = ''
  getDataListParams.value.responseCode = ''
  getDataList()
}
// 展示列信息
const dataColumns = [
  { key: 'operationGroup', title: '操作分组', width: 100 },
  { key: 'operationName', title: '操作名称', width: 130 },
  {
    key: 'operationSpend', title: '响应时间', width: 80, render(row) {
      const type = row.operationSpend < 100 ? 'success' : row.operationSpend < 200 ? 'info' : row.operationSpend < 500 ? 'warning' : 'error'
      return h(NTag, { type, bordered: false }, {
        default: () => row.operationSpend + 'ms'
      })
    }
  },
  {
    key: 'operationMethod', title: '请求方式', width: 80, render(row) {
      return h(NTag, { type: row.operationMethod === 'POST' ? 'info' : 'default', bordered: false }, {
        default: () => row.operationMethod
      })
    }
  },
  { key: 'operationUrl', title: '请求地址', width: 200 },
  { key: 'operationParam', title: '操作参数', width: 300 },
  { key: 'clientUsername', title: '操作用户', width: 100 },
  { key: 'clientIp', title: '操作IP', width: 80 },
  { key: 'clientLocation', title: '操作位置', width: 120 },
  { key: 'clientDevice', title: '操作设备', width: 120 },
  {
    key: 'responseCode', title: '响应状态', width: 100, render(row) {
      let type = 'warning'
      if (row.responseCode === 200) {
        type = 'success'
      } else if (row.responseCode === 500) {
        type = 'error'
      }
      return h(NTag, { type, bordered: false }, {
        default: () => row.responseCode
      })
    }
  },
  { key: 'operationTime', title: '创建时间', width: 160 }
]
// 分页配置
const dataPagination = createPagination(getDataListParams, () => { getDataList() })
// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  proxy.$http.get('system/monitor/log', { params: getDataListParams.value, operate: `加载${_baseName}列表` }).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.items
    dataPagination.itemCount = res.data.total
    console.log(res.data.total)
    console.log(dataPagination)
  })
}
onMounted(getDataList)
const dataRowKey = (rowData) => rowData.id

</script>
<script>
export default {
  name: 'SystemMonitorLogIndex'
}
</script>

<style lang="scss" scoped></style>
