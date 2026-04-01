<template>
  <div>
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.workflowId" clearable placeholder="请输入搜索条件" />
              <n-button ghost type="primary" @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi span="6 s:3 m:4" class="nebula-export__trigger-gi">
            <n-button quaternary type="primary" @click="showExportDialog = true">
              <template #icon><strix-icon icon="download" :size="16" /></template>
              导出
            </n-button>
          </n-gi>
        </n-grid>
      </template>
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

    <strix-export-dialog
      v-model:show="showExportDialog"
      :columns="dataColumns"
      :data="dataRef || []"
      :fetch-all-data="fetchAllData"
      :title="_baseName"
    />
  </div>
</template>

<script lang="ts" setup>
import StrixTag from '@/components/common/StrixTag.vue'
import { http } from '@/plugins/axios'
import { usePage } from '@/composables/usePage.ts'
import { type DataTableColumns } from 'naive-ui'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import StrixIcon from '@/components/icon/StrixIcon.vue'

// 本页面操作提示关键词
const _baseName = '工作流程列表'
const _baseApiPrefix = 'system/workflow'
const showExportDialog = ref(false)
const fetchAllData = createPaginatedFetcher(
  'system/workflow/initiated',
  'systemUserList',
  () => getDataListParams.value
)

// 加载字典
// const systemUserStatusRef = useDict('SystemUserStatus')

const { getDataListParams, clearSearch, dataPagination, dataRowKey } = usePage(
  {
    workflowId: '',
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
  { key: 'nickname', title: '用户昵称', width: 200 },
  { key: 'phoneNumber', title: '手机号码', width: 200 },
  {
    key: 'status',
    title: '用户状态',
    width: 140,
    align: 'center',
    render(row: any) {
      return h(StrixTag, { value: row.status, dictName: 'SystemUserStatus' })
    }
  }
]

// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  http
    .get(`${_baseApiPrefix}/initiated`, {
      params: getDataListParams.value,
      meta: { operate: `加载${_baseName}列表` }
    })
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.systemUserList
      dataPagination.itemCount = res.data.total
    })
}
onMounted(getDataList)
</script>

<style lang="scss" scoped></style>
