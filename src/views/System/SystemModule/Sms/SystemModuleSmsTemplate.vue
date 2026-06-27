<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block
      cleanable
      :active-filters="activeFilters"
      :active-filter-count="activeFilterCount"
      @clear="clearSearch"
      @clear-filter="clearFilter"
    >
      <template #search>
        <n-input
          v-model:value="listParams.keyword"
          clearable
          placeholder="请输入搜索关键字（模板Code、名称）"
          @keydown.enter="handleKeywordEnter"
        />
      </template>
      <template #actions>
        <n-button quaternary type="primary" @click="showColumnPanel = !showColumnPanel">
          <template #icon>
            <strix-icon icon="columns-3" :size="16" />
          </template>
          列配置
        </n-button>
        <n-button quaternary type="primary" @click="showExportDialog = true">
          <template #icon>
            <strix-icon icon="download" :size="16" />
          </template>
          导出
        </n-button>
      </template>
      <n-form :model="listParams" :show-feedback="false" label-placement="left" label-width="auto">
        <n-form-item label="配置 Key" path="configKey">
          <n-select
            v-model:value="listParams.configKey"
            :options="smsConfigSelectList"
            clearable
            placeholder="请选择短信配置 Key"
            @update:value="getDataList"
          />
        </n-form-item>
        <n-form-item label="状态" path="status">
          <n-select
            v-model:value="listParams.status"
            :options="smsTemplateStatusRef"
            clearable
            placeholder="请选择状态"
            @update:value="getDataList"
          />
        </n-form-item>
        <n-form-item label="类型" path="type">
          <n-select
            v-model:value="listParams.type"
            :options="smsTemplateTypeRef"
            clearable
            placeholder="请选择类型"
            @update:value="getDataList"
          />
        </n-form-item>
      </n-form>
    </strix-block>

    <n-data-table
      :columns="visibleColumns"
      :scroll-x="scrollX"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="pagination"
      :row-key="rowKey"
      remote
      table-layout="fixed"
    />

    <strix-export-dialog
      v-model:show="showExportDialog"
      :columns="dataColumns as unknown as DataTableColumns"
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
import type { SmsTemplateItem } from '@/api/sms'
import { smsApi } from '@/api/sms'
import type { SelectDataItem } from '@/api/types'
import { useCrud } from '@/composables/useCrud'
import { useDict } from '@/composables/useDict'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import StrixIcon from '@/components/icon/StrixIcon.vue'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import { type DataTableColumns } from 'naive-ui'

// 本页面操作提示关键词
const _baseName = '短信模板'
const showExportDialog = ref(false)
const fetchAllData = createPaginatedFetcher(smsApi.urls.templateList, 'templates', () => listParams.value)

// 加载字典
const smsTemplateTypeRef = useDict('SmsTemplateType')
const smsTemplateStatusRef = useDict('SmsTemplateStatus')

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
  list: { keyword: null, configKey: null, type: null, status: null, pageIndex: 1, pageSize: 10 },
  fetchList: () => getDataList(),
  filters: [
    { key: 'keyword', label: '关键词' },
    { key: 'configKey', label: '配置Key', options: smsConfigSelectList },
    { key: 'type', label: '类型', dictName: 'SmsTemplateType' },
    { key: 'status', label: '状态', dictName: 'SmsTemplateStatus' }
  ],
  urlSync: true
})

// 展示列信息
const dataColumns: DataTableColumns<SmsTemplateItem> = [
  { key: 'code', title: '模板 Code', width: 160 },
  { key: 'name', title: '模板名称', width: 240 },
  { key: 'configKey', title: '短信配置 Key', width: 140 },
  {
    key: 'type',
    title: '类型',
    width: 120,
    align: 'center',
    dictName: 'SmsTemplateType',
    render(row) {
      return h(StrixTag, { value: row.type, dictName: 'SmsTemplateType' })
    }
  },
  {
    key: 'status',
    title: '状态',
    width: 120,
    align: 'center',
    dictName: 'SmsTemplateStatus',
    render(row) {
      return h(StrixTag, { value: row.status, dictName: 'SmsTemplateStatus' })
    }
  },
  { key: 'content', title: '模板内容', width: 600 },
  { title: '创建时间', key: 'createdTime', width: 180 }
]

// 列可见性与排序
const {
  visibleColumns,
  scrollX,
  showPanel: showColumnPanel
} = useTableColumns(dataColumns as unknown as DataTableColumns)

// 加载列表
const dataRef = ref<SmsTemplateItem[]>()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  smsApi.templateList(listParams.value).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.templates
    pagination.itemCount = res.data.total
  })
}
onMounted(getDataList)
</script>

<style lang="scss" scoped></style>
