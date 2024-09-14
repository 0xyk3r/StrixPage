<template>
  <div>
    <strix-block style="margin-bottom: 20px" cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input
                v-model:value="getDataListParams.keyword"
                placeholder="按操作名称搜索"
                clearable
              />
              <n-button type="primary" ghost @click="getDataList">搜索</n-button>
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
          <n-form-item-gi span="6 s:3 m:2" label="操作类型" path="operationType">
            <n-select
              v-model:value="getDataListParams.operationType"
              :options="sysLogOperTypeRef"
              placeholder="请选择操作类型"
              clearable
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
import type { NTagType } from '@/@types/naive-ui'
import StrixBlock from '@/components/StrixBlock.vue'
import { http } from '@/plugins/axios'
import { createPagination } from '@/utils/common-page-util'
import { useDict } from '@/utils/strix-dict-util'
import { cloneDeep } from 'lodash'
import { NTag, type DataTableColumns } from 'naive-ui'
import { h, onMounted, ref } from 'vue'

// 本页面操作提示关键词
const _baseName = '系统日志'

// 加载字典
const sysLogOperTypeRef = useDict('SysLogOperType')

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
  { key: 'operationGroup', title: '操作分组', width: 100 },
  { key: 'operationName', title: '操作名称', width: 130 },
  {
    key: 'operationSpend',
    title: '响应时间',
    width: 80,
    render(row: any) {
      const type: NTagType =
        row.operationSpend < 100
          ? 'success'
          : row.operationSpend < 200
            ? 'info'
            : row.operationSpend < 500
              ? 'warning'
              : 'error'
      return h(
        NTag,
        { type, bordered: false },
        {
          default: () => row.operationSpend + 'ms'
        }
      )
    }
  },
  {
    key: 'operationMethod',
    title: '请求方式',
    width: 80,
    render(row: any) {
      return h(
        NTag,
        { type: row.operationMethod === 'POST' ? 'info' : 'default', bordered: false },
        {
          default: () => row.operationMethod
        }
      )
    }
  },
  { key: 'operationUrl', title: '请求地址', width: 200 },
  { key: 'operationParam', title: '操作参数', width: 300 },
  { key: 'clientUsername', title: '操作用户', width: 100 },
  { key: 'clientIp', title: '操作IP', width: 80 },
  { key: 'clientLocation', title: '操作位置', width: 120 },
  { key: 'clientDevice', title: '操作设备', width: 120 },
  {
    key: 'responseCode',
    title: '响应状态',
    width: 100,
    render(row: any) {
      let type: NTagType = 'warning'
      if (row.responseCode === 200) {
        type = 'success'
      } else if (row.responseCode === 500) {
        type = 'error'
      }
      return h(
        NTag,
        { type, bordered: false },
        {
          default: () => row.responseCode
        }
      )
    }
  },
  { key: 'operationTime', title: '创建时间', width: 160 }
]
// 分页配置
const dataPagination = createPagination(getDataListParams, () => {
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
