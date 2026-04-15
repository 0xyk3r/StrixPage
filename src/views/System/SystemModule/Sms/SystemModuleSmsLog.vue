<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block
      cleanable
      :active-filters="activeFilters"
      :active-filter-count="activeFilterCount"
      @clear="clearSearch"
      @clear-filter="clearFilter"
    >
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input v-model:value="listParams.keyword" clearable placeholder="按手机号码搜索"
                     @keydown.enter="handleKeywordEnter" />
          </n-gi>
          <n-gi span="6 s:3 m:4" class="nebula-export__trigger-gi">
            <n-button quaternary type="primary" @click="showColumnPanel = !showColumnPanel">
              <template #icon><strix-icon icon="columns-3" :size="16" /></template>
              列配置
            </n-button>
            <n-button quaternary type="primary" @click="showExportDialog = true">
              <template #icon><strix-icon icon="download" :size="16" /></template>
              导出
            </n-button>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="listParams" :show-feedback="false" label-placement="left" label-width="auto">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi label="配置 Key" path="configKey" span="6 s:3 m:2">
            <n-select
              v-model:value="listParams.configKey"
              :options="smsConfigSelectList"
              clearable
              placeholder="请选择短信配置 Key"
              @update:value="getDataList"
            />
          </n-form-item-gi>
          <n-form-item-gi label="发送状态" path="status" span="6 s:3 m:2">
            <n-select
              v-model:value="listParams.status"
              :options="smsLogStatusRef"
              clearable
              placeholder="请选择短信发送状态"
              @update:value="getDataList"
            />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table
      :columns="visibleColumns"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="pagination"
      :remote="true"
      :row-key="rowKey"
      table-layout="fixed"
    />

    <strix-export-dialog
      v-model:show="showExportDialog"
      :columns="dataColumns"
      :data="dataRef || []"
      :fetch-all-data="fetchAllData"
      :title="_baseName"
    />

    <strix-column-panel v-model:show="showColumnPanel" />
  </div>
</template>

<script lang="ts" setup>
import StrixBlock from '@/components/common/StrixBlock.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import { smsApi } from '@/api/sms'
import type { SelectDataItem } from '@/api/types'
import { useCrud } from '@/composables/useCrud'
import { useDict } from '@/composables/useDict.ts'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixIcon from '@/components/icon/StrixIcon.vue'
import { type DataTableColumns } from 'naive-ui'

// 本页面操作提示关键词
const _baseName = '短信日志'
const showExportDialog = ref(false)
const fetchAllData = createPaginatedFetcher(smsApi.urls.logList, 'logs', () => listParams.value)

// 加载字典
const smsLogStatusRef = useDict('SmsLogStatus')

// 加载短信配置选项
const smsConfigSelectList = ref<SelectDataItem[]>([])
const getSmsConfigSelectList = () => {
  smsApi.configSelect().then(({ data: res }) => {
    smsConfigSelectList.value = res.data.options
  })
}
onMounted(getSmsConfigSelectList)

const {
  listParams,
  clearSearch,
  pagination,
  rowKey,
  activeFilters,
  activeFilterCount,
  clearFilter,
  handleKeywordEnter
} = useCrud({
  list: { keyword: null, configKey: null, status: null, pageIndex: 1, pageSize: 10 },
  fetchList: () => getDataList(),
  filters: [
    { key: 'keyword', label: '关键词' },
    { key: 'configKey', label: '配置Key', options: smsConfigSelectList },
    { key: 'status', label: '发送状态', dictName: 'SmsLogStatus' }
  ],
  urlSync: true
})

// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'configKey', title: '短信配置 Key', width: 140 },
  { key: 'phoneNumber', title: '手机号码', width: 160 },
  {
    key: 'platform',
    title: '短信平台',
    width: 120,
    align: 'center',
    dictName: 'SmsPlatform',
    render(row: any) {
      return h(StrixTag, { value: row.platform, dictName: 'SmsPlatform' })
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
    dictName: 'SmsLogStatus',
    render(row: any) {
      return h(StrixTag, { value: row.status, dictName: 'SmsLogStatus' })
    }
  },
  { key: 'platformResponse', title: '平台响应', width: 240 },
  { key: 'createdTime', title: '时间', width: 180 }
]

// 列可见性与排序
const { visibleColumns, showPanel: showColumnPanel } = useTableColumns(dataColumns)
// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  smsApi.logList(listParams.value).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.logs
    pagination.itemCount = res.data.total
  })
}
onMounted(getDataList)
</script>

<style lang="scss" scoped></style>
