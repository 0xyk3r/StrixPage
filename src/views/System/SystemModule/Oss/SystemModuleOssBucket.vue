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
            <n-input v-model:value="listParams.keyword" clearable placeholder="按名称搜索"
                     @keydown.enter="handleKeywordEnter" />
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAdd()"> 添加{{ _baseName }}</n-button>
          </n-gi>
          <n-gi span="6 s:2 m:3" class="nebula-export__trigger-gi">
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

    <n-modal
      :show="addModal"
      :title="'添加' + _baseName"
      class="strix-form-modal"
      preset="card"
      @update:show="tryCloseAdd"
      size="huge"
      @after-leave="resetForms"
    >
      <n-form
        ref="addFormRef"
        :model="addForm"
        :rules="formRules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="存储配置 Key" path="configKey">
          <n-select
            v-model:value="addForm.configKey"
            :options="ossConfigSelectList"
            clearable
            placeholder="请选择存储配置 Key"
          />
        </n-form-item>
        <n-form-item label="Bucket 名称" path="name">
          <n-input v-model:value="addForm.name" clearable placeholder="请输入 Bucket 名称" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="tryCloseAdd">取消</n-button>
          <n-button type="primary" @click="submitAdd"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import StrixBlock from '@/components/common/StrixBlock.vue'
import { ossApi } from '@/api/oss'
import type { SelectDataItem } from '@/api/types'
import { useCrud } from '@/composables/useCrud'
import { type DataTableColumns } from 'naive-ui'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixIcon from '@/components/icon/StrixIcon.vue'

// 本页面操作提示关键词
const _baseName = '存储空间'
const showExportDialog = ref(false)

// 加载存储配置选项
const ossConfigSelectList = ref<SelectDataItem[]>([])

const {
  listParams,
  clearSearch,
  pagination,
  rowKey,
  addModal,
  addForm,
  addFormRef,
  showAdd,
  submitAdd,
  resetForms,
  tryCloseAdd,
  activeFilters,
  activeFilterCount,
  clearFilter,
  handleKeywordEnter,
  formRules
} = useCrud({
  list: {
    keyword: null,
    configKey: null,
    pageIndex: 1,
    pageSize: 10
  },
  fetchList: () => getDataList(),
  addForm: {
    configKey: null,
    name: null
  },
  api: {
    create: (data: any) => ossApi.bucketCreate(data),
    remove: (id: string) => ossApi.bucketRemove(id)
  },
  draftKey: 'ModuleOssBucket',
  filters: [
    { key: 'keyword', label: '关键词' },
    { key: 'configKey', label: '存储配置', options: ossConfigSelectList }
  ],
  urlSync: true,
  schemaDto: 'OssBucketUpdateReq'
})

const fetchAllData = createPaginatedFetcher(ossApi.urls.bucketList, 'buckets', () => listParams.value)

// 展示列信息
const dataColumns: DataTableColumns = [
  { title: '存储空间名称', key: 'name' },
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
  ossApi.bucketList(listParams.value).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.buckets
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


</script>

<style lang="scss" scoped></style>
