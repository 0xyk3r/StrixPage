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
              <n-button size="small" type="primary" @click="showAddDataModal"> 添加流程</n-button>
              <n-button size="small" type="info" @click="getDataList"> 刷新列表</n-button>
            </n-flex>
          </n-flex>
          <n-spin :show="dataLoading">
            <n-data-table
              v-model:checked-row-keys="checkedRowKeys"
              :columns="dataColumns"
              :data="dataRef"
              :loading="dataLoading"
              :pagination="dataPagination"
              :remote="true"
              :row-key="dataRowKey"
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
                <n-empty :description="selectDataId ? '无数据' : '请选择配置'" size="large" />
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
                <n-empty :description="selectDataId ? '无数据' : '请选择配置'" size="large" />
              </template>
            </n-data-table>
          </n-tab-pane>
        </n-tabs>
      </n-grid-item>
    </n-grid>

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
        <n-form-item label="配置名称" path="name">
          <n-input v-model:value="addDataForm.name" clearable placeholder="请输入配置名称" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="addDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="addData"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>

    <n-modal
      v-model:show="editDataModalShow"
      :title="'修改' + _baseName"
      class="strix-form-modal"
      preset="card"
      size="huge"
      @after-leave="initDataForm"
    >
      <n-spin :show="editDataFormLoading">
        <n-form
          ref="editDataFormRef"
          :model="editDataForm"
          :rules="editDataRules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="配置名称" path="name">
            <n-input v-model:value="editDataForm.name" clearable placeholder="请输入配置名称" />
          </n-form-item>
        </n-form>
      </n-spin>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="editDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="editData"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { http } from '@/plugins/axios'
import { createPagination, usePage } from '@/utils/common-page-util'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { pick } from 'lodash-es'
import { type DataTableColumns, type FormRules, NFlex, NSpin } from 'naive-ui'

const router = useRouter()

const _baseName = '流程引擎'
const _baseApiPrefix = 'system/workflow/config'

const {
  getDataListParams,
  dataPagination,
  dataRowKey,
  addDataModalShow,
  addDataForm,
  addDataFormRef,
  editDataModalShow,
  editDataFormLoading,
  editDataId,
  initEditDataForm,
  editDataForm,
  editDataFormRef,
  initDataForm
} = usePage(
  {
    pageIndex: 1,
    pageSize: 10
  },
  () => {
    getDataList()
  },
  {
    name: null
  },
  {
    name: null
  }
)

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
            onClick: () => showEditDataModal(row.id)
          },
          {
            type: 'error',
            label: '删除',
            icon: 'trash',
            onClick: () => deleteData(row.id),
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
const checkedRowKeys = ref([])
watch(checkedRowKeys, (newVal) => {
  selectDataId.value = newVal[0]
  getWorkflowConfigData()
})
const dataRef = ref()
const dataLoading = ref(true)
const getDataList = () => {
  dataLoading.value = true
  http
    .get(`${_baseApiPrefix}`, {
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

const addDataRules: FormRules = {
  name: [
    { required: true, message: '请输入流程名称', trigger: 'blur' },
    { min: 2, max: 32, message: '流程名称长度需在 2 - 32 字之内', trigger: 'blur' }
  ]
}
const showAddDataModal = () => {
  addDataModalShow.value = true
}
const addData = () => {
  addDataFormRef.value?.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    http
      .post(`${_baseApiPrefix}/update`, addDataForm.value, {
        meta: { operate: `添加${_baseName}` }
      })
      .then(() => {
        initDataForm()
        getDataList()
      })
  })
}

const editDataRules: FormRules = {
  name: [
    { required: true, message: '请输入流程名称', trigger: 'blur' },
    { min: 2, max: 32, message: '流程名称长度需在 2 - 32 字之内', trigger: 'blur' }
  ]
}
const showEditDataModal = (id: string) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  http.get(`${_baseApiPrefix}/${id}`, { meta: { operate: `加载${_baseName}信息` } }).then(({ data: res }) => {
    editDataId.value = id
    const canUpdateFields = Object.keys(initEditDataForm)
    editDataForm.value = pick(res.data, canUpdateFields)
    editDataFormLoading.value = false
  })
}
const editData = () => {
  editDataFormRef.value?.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    http
      .post(`${_baseApiPrefix}/update/${editDataId.value}`, editDataForm.value, {
        meta: { operate: `修改${_baseName}` }
      })
      .then(() => {
        initDataForm()
        getDataList()
      })
  })
}

// 删除数据
const deleteData = (id: string) => {
  http.post(`${_baseApiPrefix}/remove/${id}`, null, { meta: { operate: `删除${_baseName}` } }).then(() => {
    getDataList()
  })
}

const workflowConfigDataRef = ref([])
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
  http
    .get(`${_baseApiPrefix}/${selectDataId.value}/data`, {
      params: getWorkflowInstanceDataListParams.value,
      meta: { operate: `加载引擎版本数据列表` }
    })
    .then(({ data: res }) => {
      workflowInstanceDataLoading.value = false
      workflowInstanceDataRef.value = res.data.items
      workflowInstanceDataPagination.itemCount = res.data.total
    })
}
const workflowInstanceDataRowKey = (row: any) => row.id
const workflowInstanceDataPagination = createPagination(getWorkflowInstanceDataListParams, getWorkflowInstanceDataList)

// 删除数据
const deleteWorkflowInstanceData = (id: string) => {
  http
    .post(`${_baseApiPrefix}/${editDataId.value}/data/remove/${id}`, null, {
      meta: { operate: '删除引擎版本数据' }
    })
    .then(() => {
      getWorkflowInstanceDataList()
    })
}
</script>

<style lang="scss" scoped></style>
