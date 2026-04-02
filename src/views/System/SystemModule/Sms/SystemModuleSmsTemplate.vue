<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input
                v-model:value="getDataListParams.keyword"
                clearable
                placeholder="请输入搜索关键字（模板Code、名称）"
              />
              <n-button ghost type="primary" @click="getDataList"> 搜索</n-button>
            </n-input-group>
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
              :options="smsTemplateStatusRef"
              clearable
              placeholder="请选择状态"
              @update:value="getDataList"
            />
          </n-form-item-gi>
          <n-form-item-gi label="类型" path="type" span="6 s:3 m:2">
            <n-select
              v-model:value="getDataListParams.type"
              :options="smsTemplateTypeRef"
              clearable
              placeholder="请选择类型"
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
      :pagination="dataPagination"
      :remote="true"
      :row-key="dataRowKey"
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
import { usePage } from '@/composables/usePage.ts'
import { useDict } from '@/composables/useDict.ts'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import StrixIcon from '@/components/icon/StrixIcon.vue'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import { type DataTableColumns } from 'naive-ui'

// 本页面操作提示关键词
const _baseName = '短信模板'
const showExportDialog = ref(false)
const fetchAllData = createPaginatedFetcher(smsApi.urls.templateList, 'templates', () => getDataListParams.value)

// 加载字典
const smsTemplateTypeRef = useDict('SmsTemplateType')
const smsTemplateStatusRef = useDict('SmsTemplateStatus')

const { getDataListParams, clearSearch, dataPagination, dataRowKey } = usePage(
  {
    keyword: null,
    configKey: null,
    type: null,
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
  { key: 'code', title: '模板 Code', width: 160 },
  { key: 'name', title: '模板名称', width: 240 },
  { key: 'configKey', title: '短信配置 Key', width: 140 },
  {
    key: 'type',
    title: '类型',
    width: 120,
    align: 'center',
    dictName: 'SmsTemplateType',
    render(row: any) {
      return h(StrixTag, { value: row.type, dictName: 'SmsTemplateType' })
    }
  },
  {
    key: 'status',
    title: '状态',
    width: 120,
    align: 'center',
    dictName: 'SmsTemplateStatus',
    render(row: any) {
      return h(StrixTag, { value: row.status, dictName: 'SmsTemplateStatus' })
    }
  },
  { key: 'content', title: '模板内容', width: 600 },
  { title: '创建时间', key: 'createdTime', width: 180 }
]

// 列可见性与排序
const { visibleColumns, showPanel: showColumnPanel } = useTableColumns(dataColumns)

// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  smsApi
    .templateList(getDataListParams.value)
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.templates
      dataPagination.itemCount = res.data.total
    })
}
onMounted(getDataList)

// 加载短信配置选项
const smsConfigSelectList = ref([])
const getSmsConfigSelectList = () => {
  smsApi.configSelect().then(({ data: res }) => {
    smsConfigSelectList.value = res.data.options
  })
}
onMounted(getSmsConfigSelectList)
</script>

<style lang="scss" scoped></style>
