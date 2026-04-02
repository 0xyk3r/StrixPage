<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" clearable placeholder="按名称搜索" />
              <n-button ghost type="primary" @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAddDataModal"> 添加{{ _baseName }}</n-button>
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
      <n-form :model="getDataListParams" :show-feedback="false" label-placement="left" label-width="auto">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi label="存储配置 Key" path="configKey" span="6 s:3 m:2">
            <n-select
              v-model:value="getDataListParams.configKey"
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

    <n-modal
      v-model:show="addDataModalShow"
      :title="'添加' + _baseName"
      class="strix-form-modal"
      preset="card"
      size="huge"
      @after-leave="initDataForm"
    >
      <n-form
        ref="addDataFormRef"
        :model="addDataForm"
        :rules="addDataRules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="存储配置 Key" path="configKey">
          <n-select
            v-model:value="addDataForm.configKey"
            :options="ossConfigSelectList"
            clearable
            placeholder="请选择存储配置 Key"
          />
        </n-form-item>
        <n-form-item label="Bucket 名称" path="name">
          <n-input v-model:value="addDataForm.name" clearable placeholder="请输入 Bucket 名称" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="addDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="addData"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import StrixBlock from '@/components/common/StrixBlock.vue'
import { ossApi } from '@/api/oss'
import type { SelectDataItem } from '@/api/types'
import { usePage } from '@/composables/usePage.ts'
import { createStrixMessage } from '@/utils/strix-message'
import { type DataTableColumns, type FormRules } from 'naive-ui'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixIcon from '@/components/icon/StrixIcon.vue'

// 本页面操作提示关键词
const _baseName = '存储空间'
const showExportDialog = ref(false)
const fetchAllData = createPaginatedFetcher(ossApi.urls.bucketList, 'buckets', () => getDataListParams.value)

const {
  getDataListParams,
  clearSearch,
  dataPagination,
  dataRowKey,
  addDataModalShow,
  addDataForm,
  addDataFormRef,
  initDataForm
} = usePage(
  {
    keyword: null,
    configKey: null,
    pageIndex: 1,
    pageSize: 10
  },
  () => {
    getDataList()
  },
  {
    configKey: null,
    name: null
  },
  null
)

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
  ossApi
    .bucketList(getDataListParams.value)
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.buckets
      dataPagination.itemCount = res.data.total
    })
}
onMounted(getDataList)

// 加载存储配置选项
const ossConfigSelectList = ref<SelectDataItem[]>([])
const getOssConfigSelectList = () => {
  ossApi.configSelect().then(({ data: res }) => {
    ossConfigSelectList.value = res.data.options
  })
}
onMounted(getOssConfigSelectList)

const addDataRules: FormRules = {
  configKey: [{ required: true, message: '请选择存储配置 Key', trigger: 'change' }],
  name: [
    { required: true, message: '请输入 Bucket 名称', trigger: 'blur' },
    { min: 1, max: 64, message: 'Bucket 名称需在 1 - 64 字之内', trigger: 'blur' }
  ]
}
const showAddDataModal = () => {
  addDataModalShow.value = true
}
const addData = () => {
  addDataFormRef.value?.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    ossApi.bucketCreate(addDataForm.value).then(() => {
        initDataForm()
        getDataList()
      })
  })
}
</script>

<style lang="scss" scoped></style>
