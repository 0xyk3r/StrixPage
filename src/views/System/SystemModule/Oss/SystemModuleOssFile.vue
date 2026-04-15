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
            <n-input v-model:value="listParams.keyword" clearable placeholder="按文件名搜索"
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
          <n-form-item-gi label="存储配置 Key" path="configKey" span="6 s:3 m:2">
            <n-select
              v-model:value="listParams.configKey"
              :options="ossConfigSelectList"
              clearable
              placeholder="请选择存储配置 Key"
              @update:value="getOssFileGroupSelectList($event)"
            />
          </n-form-item-gi>
          <n-form-item-gi label="文件组 Key" path="groupKey" span="6 s:3 m:2">
            <n-select
              v-model:value="listParams.groupKey"
              :options="ossFileGroupSelectList"
              clearable
              placeholder="请选择文件组 Key"
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
import { ossApi } from '@/api/oss'
import type { SelectDataItem } from '@/api/types'
import { commonApi } from '@/api/common'
import { useCrud } from '@/composables/useCrud'
import { downloadBlob, formatFileSize } from '@/utils/strix-file-util'
import { handleOperate } from '@/utils/strix-table-tool'
import type { DataTableColumns } from 'naive-ui'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixIcon from '@/components/icon/StrixIcon.vue'

// 本页面操作提示关键词
const _baseName = '存储文件'
const showExportDialog = ref(false)

// 加载存储配置选项
const ossConfigSelectList = ref<SelectDataItem[]>([])
// 加载文件组配置选项
const ossFileGroupSelectList = ref<SelectDataItem[]>([])

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
  list: { keyword: null, configKey: null, groupKey: null, pageIndex: 1, pageSize: 10 },
  fetchList: () => getDataList(),
  filters: [
    { key: 'keyword', label: '关键词' },
    { key: 'configKey', label: '存储配置', options: ossConfigSelectList },
    { key: 'groupKey', label: '文件组', options: ossFileGroupSelectList }
  ],
  urlSync: true
})

const fetchAllData = createPaginatedFetcher(ossApi.urls.fileList, 'files', () => listParams.value)

// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'path', title: '文件路径', width: 360 },
  { key: 'configKey', title: '存储配置 Key', width: 140 },
  { key: 'groupKey', title: '文件组配置 Key', width: 160 },
  {
    key: 'size',
    title: '文件大小',
    width: 120,
    valueResolver: (val: any) => formatFileSize(val),
    render: (row: any) => formatFileSize(row.size)
  },
  { key: 'ext', title: '文件拓展名', width: 100 },
  { key: 'createdTime', title: '上传时间', width: 180 },
  {
    key: 'actions',
    title: '操作',
    width: 130,
    align: 'center',
    render(row: any) {
      return handleOperate([
        {
          type: 'primary',
          label: '下载文件',
          icon: 'download',
          onClick: () => downloadFile(row.id)
        },
        {
          type: 'error',
          label: '删除文件',
          icon: 'trash',
          onClick: () => deleteFile(row.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据且同时从远程存储服务中删除该文件? 该操作不可恢复!'
        }
      ])
    }
  }
]

// 列可见性与排序
const { visibleColumns, showPanel: showColumnPanel } = useTableColumns(dataColumns)

// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  ossApi.fileList(listParams.value).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.files
    pagination.itemCount = res.data.total
  })
}
onMounted(getDataList)

const getOssConfigSelectList = () => {
  ossApi.configSelect().then(({ data: res }) => {
    ossConfigSelectList.value = res.data.options
  })
}
onMounted(getOssConfigSelectList)
const getOssFileGroupSelectList = (configKey?: string) => {
  if (configKey) {
    listParams.value.groupKey = null
    getDataList()
  }
  const request = configKey ? ossApi.fileGroupSelectByConfig(configKey) : ossApi.fileGroupSelect()
  request.then(({ data: res }) => {
    ossFileGroupSelectList.value = res.data.options
  })
}
onMounted(getOssFileGroupSelectList)

const downloadFile = (id: string) => {
  commonApi.fileDownload(id).then((res) => {
    downloadBlob(res, id)
  })
}
const deleteFile = (id: string) => {
  ossApi.fileRemove(id).then(() => {
    getDataList()
  })
}
</script>

<style lang="scss" scoped></style>
