<template>
  <div>
    <n-h3 class="mb-0" prefix="bar" align-text type="success">
      <n-text type="success">{{ _baseName }}管理</n-text>
    </n-h3>
    <n-layout has-sider>
      <n-layout-sider
        class="clear-bg-color"
        content-style="height: 100%; padding: 10px;"
        :native-scrollbar="false"
        bordered
      >
        <n-card class="full-h" content-style="padding: 5px">
          <div class="strix-button-group">
            <n-button type="primary" size="small" @click="showAddDataModal"> 添加流程 </n-button>
            <n-button type="info" size="small" @click="getDataList"> 刷新列表 </n-button>
          </div>
          <n-spin :show="dataLoading">
            <n-menu
              v-model:value="selectDataId"
              key-field="id"
              label-field="name"
              :indent="16"
              :options="dataRef"
              :render-extra="renderDataMenuExtra"
              @update:value="handleSelectDataChanged"
            />
          </n-spin>
        </n-card>
      </n-layout-sider>
      <n-layout content-style="padding: 10px;" :native-scrollbar="false">
        <n-grid x-gap="12" y-gap="12" :cols="5">
          <n-gi span="2">
            <n-card class="full-h">
              <n-flex justify="space-between">
                <n-h3 prefix="bar" align-text type="info">
                  <n-text type="info">流程配置列表</n-text>
                </n-h3>
                <n-button type="primary" size="small" :disabled="!selectDataId" @click="openWorkflowEditor('new')">添加配置</n-button>
              </n-flex>

              <n-data-table
                :columns="workflowConfigDataColumns"
                :data="workflowConfigDataRef"
                :row-key="popularityDataRowKey"
              >
                <template #empty>
                  <n-empty size="large" :description="selectDataId ? '无数据' : '请选择配置'" />
                </template>
              </n-data-table>
            </n-card>
          </n-gi>
          <n-gi span="3">
            <n-card class="full-h">
              <n-h3 prefix="bar" align-text type="info">
                <n-text type="info">流程实例列表</n-text>
              </n-h3>
              <n-data-table
                :remote="true"
                :loading="popularityDataLoading"
                :columns="workflowConfigDataColumns"
                :data="popularityDataRef"
                :pagination="popularityDataPagination"
                :row-key="popularityDataRowKey"
                :min-height="500"
              >
                <template #empty>
                  <n-empty size="large" :description="selectDataId ? '无数据' : '请选择配置'" />
                </template>
              </n-data-table>
            </n-card>
          </n-gi>
        </n-grid>
      </n-layout>
    </n-layout>

    <n-modal
      v-model:show="addDataModalShow"
      preset="card"
      :title="'添加' + _baseName"
      class="strix-model-primary"
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
          <n-input v-model:value="addDataForm.name" placeholder="请输入配置名称" clearable />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space class="strix-form-modal-footer">
          <n-button @click="addDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="addData"> 确定 </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="editDataModalShow"
      preset="card"
      :title="'修改' + _baseName"
      class="strix-model-primary"
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
            <n-input v-model:value="editDataForm.name" placeholder="请输入配置名称" clearable />
          </n-form-item>
        </n-form>
      </n-spin>
      <template #footer>
        <n-space class="strix-form-modal-footer">
          <n-button @click="editDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="editData"> 确定 </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { createPagination } from '@/plugins/pagination.js'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { cloneDeep, debounce, pick } from 'lodash'
import { NEllipsis } from 'naive-ui'
import { getCurrentInstance, h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const { proxy } = getCurrentInstance()
const $router = useRouter()

const _baseName = '流程引擎'
const _baseApiPrefix = 'system/workflow'

// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
const getDataList = () => {
  dataLoading.value = true
  proxy.$http
    .get(`${_baseApiPrefix}`, {
      operate: `加载${_baseName}列表`
    })
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.items.map((item) => ({
        id: item.id,
        name: () => h(NEllipsis, { style: { maxWidth: '150px' } }, { default: () => item.name }),
        extraData: item.configs
      }))
    })
}
onMounted(getDataList)

const selectDataId = ref(null)
const handleSelectDataChanged = () => {
  if (selectDataId.value) {
    dataRef.value.forEach((item) => {
      if (item.id === selectDataId.value) {
        workflowConfigDataRef.value = item.extraData
      }
    })
  }
}
const renderDataMenuExtra = (option) => {
  return h(
    'div',
    {
      style: {
        position: 'absolute',
        top: '10px',
        right: '1px'
      }
    },
    handleOperate(
      [
        { type: 'warning', label: '编辑', icon: 'ion:create-outline', onClick: () => showEditDataModal(option.id) },
        {
          type: 'error',
          label: '删除',
          icon: 'ion:trash-outline',
          onClick: () => deleteData(option.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据? 且该操作不可恢复!'
        }
      ],
      'tiny'
    )
  )
}

const initDataForm = () => {
  addDataModalShow.value = false
  editDataModalShow.value = false
  editDataFormLoading.value = false
  addDataForm.value = cloneDeep(initAddDataForm)
  editDataId = null
  editDataForm.value = cloneDeep(initEditDataForm)
}

const addDataModalShow = ref(false)
const initAddDataForm = {
  name: null
}
const addDataForm = ref(cloneDeep(initAddDataForm))
const addDataRules = {
  name: [
    { required: true, message: '请输入流程名称', trigger: 'blur' },
    { min: 2, max: 32, message: '流程名称长度需在 2 - 32 字之内', trigger: 'blur' }
  ]
}
const showAddDataModal = () => {
  addDataModalShow.value = true
}
const addData = () => {
  proxy.$refs.addDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post(`${_baseApiPrefix}/update`, addDataForm.value, { operate: `添加${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const editDataModalShow = ref(false)
const editDataFormLoading = ref(false)
let editDataId = null
const initEditDataForm = {
  name: null
}
const editDataForm = ref(cloneDeep(initEditDataForm))
const editDataRules = {
  name: [
    { required: true, message: '请输入流程名称', trigger: 'blur' },
    { min: 2, max: 32, message: '流程名称长度需在 2 - 32 字之内', trigger: 'blur' }
  ]
}
const showEditDataModal = (id) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  proxy.$http.get(`${_baseApiPrefix}/${id}`, { operate: `加载${_baseName}信息` }).then(({ data: res }) => {
    editDataId = id
    const canUpdateFields = Object.keys(initEditDataForm)
    editDataForm.value = pick(res.data, canUpdateFields)
    editDataFormLoading.value = false
  })
}
const editData = () => {
  proxy.$refs.editDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http
      .post(`${_baseApiPrefix}/update/${editDataId}`, editDataForm.value, { operate: `修改${_baseName}` })
      .then(() => {
        initDataForm()
        getDataList()
      })
  })
}

// 删除数据
const deleteData = (id) => {
  proxy.$http.post(`${_baseApiPrefix}/remove/${id}`, null, { operate: `删除${_baseName}` }).then(() => {
    getDataList()
  })
}

const workflowConfigDataRef = ref([])
// 流程版本展示列信息
const workflowConfigDataColumns = [
  { key: 'version', title: '版本编号', width: 120 },
  { key: 'createTime', title: '创建时间', width: 160 },
  {
    title: '操作',
    width: 80,
    render(row) {
      return handleOperate(
        [
          { type: 'warning', label: '编辑', icon: 'ion:create-outline', onClick: () => openWorkflowEditor(row.id) },
          {
            type: 'error',
            label: '删除',
            icon: 'ion:trash-outline',
            onClick: () => deletePopularitData(row.id),
            popconfirm: true,
            popconfirmMessage: '是否确认删除这条数据? 且该操作不可恢复!'
          }
        ],
        'tiny'
      )
    }
  }
]

const openWorkflowEditor = (configId) => {
  $router.push(`editor/${selectDataId.value}/${configId}`)
}

// 加载列表
const getPopularitDataListParams = ref({
  page: 1,
  pageSize: 10
})
const popularityDataRef = ref()
const popularityDataLoading = ref(false)
const getPopularitDataList = () => {
  if (!editDataId.value) return createStrixMessage('warning', '请先选择配置', '请先选择配置')
  popularityDataLoading.value = true
  proxy.$http
    .get(`${_baseApiPrefix}/${editDataId.value}/data`, {
      params: getPopularitDataListParams.value,
      operate: `加载热度数据列表`
    })
    .then(({ data: res }) => {
      popularityDataLoading.value = false
      popularityDataRef.value = res.data.items
      popularityDataPagination.itemCount = res.data.total
    })
}
const popularityDataRowKey = (rowData) => rowData.id
const popularityDataPagination = createPagination(getPopularitDataListParams, getPopularitDataList)

// 修改数据数值
const updatePopularityDataValue = debounce((id, value) => {
  proxy.$http
    .post(
      `${_baseApiPrefix}/${editDataId.value}/data/update/${id}`,
      { originalValue: value },
      {
        operate: '修改热度数据数值'
      }
    )
    .then(() => {
      getPopularitDataList()
    })
}, 300)

// 删除数据
const deletePopularitData = (id) => {
  proxy.$http
    .post(`${_baseApiPrefix}/${editDataId.value}/data/remove/${id}`, null, {
      operate: '删除热度数据'
    })
    .then(() => {
      getPopularitDataList()
    })
}

const calcInput = ref(0)
const calcResult = (value) => {
  if (value == null) value = calcInput.value
  if (!editDataId.value) return 0
  const { initialValue, magValue, extraValue } = editDataForm.value
  return Math.ceil((initialValue + value) * magValue + extraValue)
}
</script>
<script>
export default {
  name: 'SystemModuleWorkflowIndex'
}
</script>

<style lang="less" scoped></style>
