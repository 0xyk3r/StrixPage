<template>
  <div>
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" clearable placeholder="按操作名称搜索" />
              <n-button ghost type="primary" @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="getDataListParams" :show-feedback="false" label-placement="left" label-width="auto">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi label="操作类型" path="operationType" span="6 s:3 m:2">
            <n-select
              v-model:value="getDataListParams.operationType"
              :options="systemLogOperTypeRef"
              clearable
              placeholder="请选择操作类型"
              @update:value="getDataList"
            />
          </n-form-item-gi>
          <!-- <n-form-item-gi span="6 s:3 m:2" label="操作分组" path="operationGroup">
            <n-select v-model:value="getDataListParams.operationGroup" :options="smsSignStatusOptions"
              placeholder="请选择操作分组" clearable @update:value="getDataList" />
          </n-form-item-gi>
          <n-form-item-gi span="6 s:3 m:2" label="响应状态码" path="responseCode">
            <n-select v-model:value="getDataListParams.responseCode" :options="smsSignStatusOptions"
              placeholder="请选择响应状态码" clearable @update:value="getDataList" />
          </n-form-item-gi> -->
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
import type { NTagType } from '@/@types/naive-ui'
import NebulaTag from '@/components/common/NebulaTag.vue'
import StrixBlock from '@/components/common/StrixBlock.vue'
import { http } from '@/plugins/axios'
import { useDict } from '@/composables/useDict.ts'
import { cloneDeep } from 'lodash-es'
import { type DataTableColumns } from 'naive-ui'
import { usePagination } from '@/composables/usePagination.ts'

// 本页面操作提示关键词
const _baseName = '系统日志'

// 加载字典
const systemLogOperTypeRef = useDict('SystemLogOperType')

// 获取列表请求参数
const initGetDataListParams = {
  keyword: null,
  operationType: null,
  operationGroup: null,
  responseCode: null,
  pageIndex: 1,
  pageSize: 10
}
const getDataListParams = ref(cloneDeep(initGetDataListParams))
const clearSearch = () => {
  getDataListParams.value = cloneDeep(initGetDataListParams)
  getDataList()
}
// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'operationGroup', title: '操作模块', width: 140, ellipsis: { tooltip: true } },
  {
    key: 'operationName',
    title: '操作名称',
    width: 180,
    ellipsis: { tooltip: true }
  },
  {
    key: 'operationMethod',
    title: '请求方式',
    width: 90,
    align: 'center',
    ellipsis: { tooltip: false },
    render(row: any) {
      return h(
        NebulaTag,
        { type: row.operationMethod === 'POST' ? 'info' : 'default', bordered: false },
        {
          default: () => row.operationMethod
        }
      )
    }
  },
  {
    key: 'operationUrl',
    title: '请求地址',
    width: 200,
    ellipsis: {
      tooltip: {
        contentStyle: { maxWidth: '480px' }
      }
    }
  },
  {
    key: 'operationParam',
    title: '操作参数',
    width: 200,
    ellipsis: {
      tooltip: {
        contentStyle: { maxWidth: '720px' }
      }
    }
  },
  {
    key: 'clientUsername',
    title: '操作用户',
    width: 120,
    ellipsis: { tooltip: true }
  },
  {
    key: 'clientIp',
    title: '操作IP',
    width: 100,
    ellipsis: { tooltip: true }
  },
  {
    key: 'clientDevice',
    title: '操作设备',
    width: 120,
    ellipsis: { tooltip: true }
  },
  { key: 'operationTime', title: '发生时间', width: 180 },
  {
    key: 'operationSpend',
    title: '响应时间',
    width: 90,
    align: 'center',
    ellipsis: { tooltip: false },
    render(row: any) {
      let type: NTagType
      if (row.operationMethod === 'GET') {
        type =
          row.operationSpend < 500
            ? 'success'
            : row.operationSpend < 1500
              ? 'info'
              : row.operationSpend < 5000
                ? 'warning'
                : 'error'
      } else {
        type =
          row.operationSpend < 2000
            ? 'success'
            : row.operationSpend < 5000
              ? 'info'
              : row.operationSpend < 10000
                ? 'warning'
                : 'error'
      }
      return h(
        NebulaTag,
        { type, bordered: false },
        {
          default: () => (row.operationSpend ? row.operationSpend + 'ms' : '失败')
        }
      )
    }
  },
  {
    key: 'responseCode',
    title: '响应状态',
    width: 90,
    align: 'center',
    ellipsis: { tooltip: false },
    render(row: any) {
      let type: NTagType = 'warning'
      if (row.responseCode === 200) {
        type = 'success'
      } else if (row.responseCode === 500) {
        type = 'error'
      }
      return h(
        NebulaTag,
        { type, bordered: false },
        {
          default: () => row.responseCode
        }
      )
    }
  },
  {
    key: 'responseMsg',
    title: '响应消息',
    width: 200,
    ellipsis: {
      tooltip: {
        contentStyle: { maxWidth: '480px' }
      }
    }
  }
]
// 分页配置
const dataPagination = usePagination(getDataListParams, () => {
  getDataList()
})
// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  http
    .get('system/monitor/log', {
      params: getDataListParams.value,
      meta: { operate: `加载${_baseName}列表` }
    })
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.items
      dataPagination.itemCount = res.data.total
    })
}
onMounted(getDataList)
const dataRowKey = (row: any) => row.id
</script>

<style lang="scss" scoped></style>
