<template>
  <div>
    <n-grid :x-gap="20" :y-gap="50" cols="24" item-responsive responsive="screen">
      <n-grid-item span="24 l:8">
        <div>
          <n-flex justify="space-between">
            <n-h3 prefix="bar" type="info">
              <n-text type="info">流程引擎列表</n-text>
            </n-h3>
            <n-flex justify="center">
              <n-button size="small" type="primary" @click="showAdd"> 添加流程</n-button>
              <n-button size="small" type="info" @click="getDataList"> 刷新列表</n-button>
            </n-flex>
          </n-flex>
          <n-spin :show="dataLoading">
            <n-data-table
              v-model:checked-row-keys="checkedRowKeys"
              :columns="dataColumns"
              :data="dataRef"
              :loading="dataLoading"
              :pagination="pagination"
              :remote="true"
              :row-key="rowKey"
              table-layout="fixed"
            />
          </n-spin>
        </div>
      </n-grid-item>
      <n-grid-item span="24 l:16">
        <n-tabs animated type="segment">
          <n-tab-pane name="config" tab="流程版本列表">
            <n-data-table
              :columns="workflowConfigDataColumns"
              :data="workflowConfigDataRef"
              :row-key="workflowConfigDataRowKey"
              table-layout="fixed"
            >
              <template #empty>
                <StrixEmpty
                  :type="selectDataId ? 'no-data' : 'no-select'"
                  :description="selectDataId ? '无数据' : '请选择配置'"
                />
              </template>
            </n-data-table>
          </n-tab-pane>
          <n-tab-pane name="instance" tab="流程实例列表">
            <n-data-table
              :columns="workflowConfigDataColumns"
              :data="workflowInstanceDataRef"
              :loading="workflowInstanceDataLoading"
              :min-height="500"
              :pagination="workflowInstanceDataPagination"
              :remote="true"
              :row-key="workflowInstanceDataRowKey"
              table-layout="fixed"
            >
              <template #empty>
                <StrixEmpty
                  :type="selectDataId ? 'no-data' : 'no-select'"
                  :description="selectDataId ? '无数据' : '请选择配置'"
                />
              </template>
            </n-data-table>
          </n-tab-pane>
        </n-tabs>
      </n-grid-item>
    </n-grid>

    <n-modal
      v-model:show="addModal"
      :title="'添加' + _baseName"
      class="strix-form-modal"
      preset="card"
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
        <n-form-item label="配置名称" path="name">
          <n-input v-model:value="addForm.name" clearable placeholder="请输入配置名称" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="addModal = false">取消</n-button>
          <n-button type="primary" @click="submitAdd"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>

    <n-modal
      v-model:show="editModal"
      :title="'修改' + _baseName"
      class="strix-form-modal"
      preset="card"
      size="huge"
      @after-leave="resetForms"
    >
      <n-spin :show="editLoading">
        <n-form
          ref="editFormRef"
          :model="editForm"
          :rules="formRules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="配置名称" path="name">
            <n-input v-model:value="editForm.name" clearable placeholder="请输入配置名称" />
          </n-form-item>
        </n-form>
      </n-spin>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="editModal = false">取消</n-button>
          <n-button type="primary" @click="submitEdit"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { workflowApi } from '@/api/workflow'
import type { WorkflowConfigItem } from '@/api/workflow'
import { useCrud } from '@/composables/useCrud'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { textField } from '@/utils/form-rules'
import { type DataTableColumns, type FormRules, NFlex, NSpin } from 'naive-ui'
import { usePagination } from '@/composables/usePagination.ts'

const router = useRouter()

const _baseName = '流程引擎'

const {
  listParams,
  pagination,
  rowKey,
  addModal,
  addForm,
  addFormRef,
  editModal,
  editLoading,
  editId,
  editForm,
  editFormRef,
  showAdd,
  showEdit,
  submitAdd,
  submitEdit,
  deleteRow,
  resetForms
} = useCrud({
  list: {
    pageIndex: 1,
    pageSize: 10
  },
  fetchList: () => getDataList(),
  addForm: {
    name: null
  },
  editForm: {
    name: null
  },
  api: {
    detail: (id: string) => workflowApi.configDetail(id),
    create: (data: any) => workflowApi.configCreate(data),
    update: (id: string, data: any) => workflowApi.configUpdate(id, data),
    remove: (id: string) => workflowApi.configRemove(id)
  },
  draftKey: 'WorkflowConfig'
})

const dataColumns: DataTableColumns = [
  {
    type: 'selection',
    multiple: false
  },
  { key: 'name', title: '流程名称', width: 160 },
  {
    key: 'actions',
    title: '操作',
    width: 130,
    align: 'center',
    render(row: any) {
      return handleOperate(
        [
          {
            type: 'info',
            label: '启动流程',
            icon: 'play',
            onClick: () => {}
          },
          {
            type: 'success',
            label: '配置新版本',
            icon: 'plus',
            onClick: () => openWorkflowEditor(row.id, 'new')
          },
          {
            type: 'warning',
            label: '编辑',
            icon: 'square-pen',
            onClick: () => showEdit(row.id)
          },
          {
            type: 'error',
            label: '删除',
            icon: 'trash',
            onClick: () => deleteRow(row.id),
            popconfirm: true,
            popconfirmMessage: '是否确认删除这条数据? 且该操作不可恢复!'
          }
        ],
        'tiny'
      )
    }
  }
]
const selectDataId = ref()
const checkedRowKeys = ref<string[]>([])
watch(checkedRowKeys, (newVal) => {
  selectDataId.value = newVal[0]
  getWorkflowConfigData()
})
const dataRef = ref()
const dataLoading = ref(true)
const getDataList = () => {
  dataLoading.value = true
  workflowApi
    .configList(listParams.value)
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.items
      pagination.itemCount = res.data.total
    })
}
onMounted(getDataList)

const formRules: FormRules = {
  name: textField('流程名称', { min: 2, max: 32 })
}

const workflowConfigDataRef = ref<WorkflowConfigItem[]>([])
const workflowConfigDataRowKey = (row: any) => row.id
// 流程版本展示列信息
const workflowConfigDataColumns: DataTableColumns = [
  { key: 'version', title: '版本编号', width: 100 },
  { key: 'createdTime', title: '创建时间', width: 180 },
  {
    key: 'actions',
    title: '操作',
    width: 130,
    align: 'center',
    render(row: any) {
      return handleOperate(
        [
          {
            type: 'warning',
            label: '查看',
            icon: 'eye',
            onClick: () => openWorkflowEditor(selectDataId.value, row.id)
          },
          {
            type: 'error',
            label: '删除',
            icon: 'trash',
            onClick: () => deleteWorkflowInstanceData(row.id),
            popconfirm: true,
            popconfirmMessage: '是否确认删除这条数据? 且该操作不可恢复!'
          }
        ],
        'tiny'
      )
    }
  }
]
const getWorkflowConfigData = () => {
  if (!selectDataId.value) return createStrixMessage('warning', '请先选择配置', '请先选择配置')
  // 在dataRef中搜索选中的数据
  const selectData = dataRef.value.find((item: any) => item.id === selectDataId.value)
  if (!selectData) return createStrixMessage('warning', '未找到配置', '未找到配置')
  workflowConfigDataRef.value = selectData.configs
}

const openWorkflowEditor = (wfId: string, configId: string) => {
  router.push(`editor/${wfId}/${configId}`)
}

// 加载列表
const getWorkflowInstanceDataListParams = ref({
  page: 1,
  pageSize: 10
})
const workflowInstanceDataRef = ref()
const workflowInstanceDataLoading = ref(false)
const getWorkflowInstanceDataList = () => {
  if (!selectDataId.value) return createStrixMessage('warning', '请先选择配置', '请先选择配置')
  workflowInstanceDataLoading.value = true
  workflowApi
    .configDataList(selectDataId.value, getWorkflowInstanceDataListParams.value)
    .then(({ data: res }) => {
      workflowInstanceDataLoading.value = false
      workflowInstanceDataRef.value = res.data.items
      workflowInstanceDataPagination.itemCount = res.data.total
    })
}
const workflowInstanceDataRowKey = (row: any) => row.id
const workflowInstanceDataPagination = usePagination(getWorkflowInstanceDataListParams, getWorkflowInstanceDataList)

// 删除数据
const deleteWorkflowInstanceData = (id: string) => {
  workflowApi
    .configDataRemove(editId.value, id)
    .then(() => {
      getWorkflowInstanceDataList()
    })
}
</script>

<style lang="scss" scoped></style>
