<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">
        {{ _baseName }}管理 - {{ dictKey }}
      </n-text>
    </n-h3>
    <strix-block style="margin-bottom: 20px" show-clear-button @clear-search="clearSearch">
      <template #show>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen" style="margin-bottom: 15px">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" placeholder="按名称搜索" clearable />
              <n-button type="primary" ghost @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAddDataModal">
              添加{{ _baseName }}
            </n-button>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="getDataListParams" label-placement="left" label-width="auto" :show-feedback="false">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi span="6 s:3 m:2" label="字典状态" path="status">
            <n-select v-model:value="getDataListParams.status" :options="dictDataStatusRef" placeholder="请选择字典数据状态"
              clearable @update:value="getDataList" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table :remote="true" :loading="dataLoading" :columns="dataColumns" :data="dataRef"
      :pagination="dataPagination" :row-key="dataRowKey" />

    <n-modal v-model:show="addDataModalShow" preset="card" :title="'添加' + _baseName" class="strix-model-primary"
      size="huge" @after-leave="initDataForm">
      <n-form ref="addDataFormRef" :model="addDataForm" :rules="addDataRules" label-placement="left" label-width="auto"
        require-mark-placement="right-hanging">
        <n-form-item label="字典值" path="value">
          <n-input v-model:value="addDataForm.value" placeholder="请输入字典值" clearable />
        </n-form-item>
        <n-form-item label="字典标签" path="label">
          <n-input v-model:value="addDataForm.label" placeholder="请输入字典标签" clearable />
        </n-form-item>
        <n-form-item label="字典排序" path="sort">
          <n-input-number v-model:value="addDataForm.sort" placeholder="请输入字典排序" clearable />
        </n-form-item>
        <n-form-item label="字典样式" path="style">
          <n-select v-model:value="addDataForm.style" :options="dictDataStyleRef" placeholder="请选择字典样式" clearable />
        </n-form-item>
        <n-form-item label="字典状态" path="status">
          <n-select v-model:value="addDataForm.status" :options="dictDataStatusRef" placeholder="请选择字典状态" clearable />
        </n-form-item>
        <n-form-item label="备注信息" path="remark">
          <n-input v-model:value="addDataForm.remark" placeholder="在此输入备注信息" type="textarea" :autosize="{
            minRows: 3,
            maxRows: 5
          }" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space class="strix-form-modal-footer">
          <n-button @click="addDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="addData">
            确定
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="editDataModalShow" preset="card" :title="'修改' + _baseName" class="strix-model-primary"
      size="huge" @after-leave="initDataForm">
      <n-spin :show="editDataFormLoading">
        <n-form ref="editDataFormRef" :model="editDataForm" :rules="editDataRules" label-placement="left"
          label-width="auto" require-mark-placement="right-hanging">
          <n-form-item label="字典值" path="value">
            <n-input v-model:value="editDataForm.value" placeholder="请输入字典值" clearable />
          </n-form-item>
          <n-form-item label="字典标签" path="label">
            <n-input v-model:value="editDataForm.label" placeholder="请输入字典标签" clearable />
          </n-form-item>
          <n-form-item label="字典排序" path="sort">
            <n-input-number v-model:value="editDataForm.sort" placeholder="请输入字典排序" clearable />
          </n-form-item>
          <n-form-item label="字典样式" path="style">
            <n-select v-model:value="editDataForm.style" :options="dictDataStyleRef" placeholder="请选择字典样式" clearable />
          </n-form-item>
          <n-form-item label="字典状态" path="status">
            <n-select v-model:value="editDataForm.status" :options="dictDataStatusRef" placeholder="请选择字典状态" clearable />
          </n-form-item>
          <n-form-item label="备注信息" path="remark">
            <n-input v-model:value="editDataForm.remark" placeholder="在此输入备注信息" type="textarea" :autosize="{
              minRows: 3,
              maxRows: 5
            }" />
          </n-form-item>
        </n-form>
      </n-spin>
      <template #footer>
        <n-space class="strix-form-modal-footer">
          <n-button @click="editDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="editData">
            确定
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import StrixBlock from '@/components/StrixBlock.vue'
import StrixTag from '@/components/StrixTag.vue'
import { createPagination } from '@/plugins/pagination.js'
import { useDictsStore } from '@/stores/dicts'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { cloneDeep, pick } from 'lodash'
import { NButton, NDataTable } from 'naive-ui'
import { getCurrentInstance, h, onMounted, provide, ref } from 'vue'
import { useRoute } from 'vue-router'

const { proxy } = getCurrentInstance()
const $route = useRoute()
const dictsStore = useDictsStore()

// 本页面操作提示关键词
const _baseName = '系统字典数据'

// 路由参数
const dictKey = $route.params.dictKey

// 加载字典
const dictDataStyleRef = ref([])
const dictDataStatusRef = ref([])
provide('DictDataStyleDict', dictDataStyleRef)
provide('DictDataStatusDict', dictDataStatusRef)
onMounted(() => {
  dictsStore.getDictData('DictDataStyle', dictDataStyleRef)
  dictsStore.getDictData('DictDataStatus', dictDataStatusRef)
})

// 获取列表请求参数
const initGetDataListParams = {
  keyword: null,
  status: null,
  pageIndex: 1,
  pageSize: 10
}
const getDataListParams = ref(cloneDeep(initGetDataListParams))
const clearSearch = () => {
  getDataListParams.value = cloneDeep(initGetDataListParams)
  getDataList()
}
// 展示列信息
const dataColumns = [
  { key: 'value', title: '字典值', width: 150 },
  { key: 'label', title: '字典标签', width: 150 },
  { key: 'sort', title: '字典排序', width: 100 },
  {
    key: 'style', title: '字典样式预览', width: 100, render(row) {
      return h(StrixTag, { value: row.style, dictName: 'DictDataStyle' })
    }
  },
  {
    key: 'status', title: '字典状态', width: 100, render(row) {
      return h(StrixTag, { value: row.status, dictName: 'DictDataStatus' })
    }
  },
  { key: 'remark', title: '备注', width: 250 },
  {
    title: '操作',
    width: 240,
    render(row) {
      return handleOperate([
        { type: 'warning', label: '编辑', icon: 'ion:create-outline', onClick: () => showEditDataModal(row.id) },
        {
          type: 'error',
          label: '删除',
          icon: 'ion:trash-outline',
          onClick: () => deleteData(row.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据? 且该操作不可恢复!'
        }
      ])
    }
  }
]
// 分页配置
const dataPagination = createPagination(getDataListParams, () => { getDataList() })
// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  proxy.$http.get(`system/dict/data/${dictKey}`, { params: getDataListParams.value, operate: `加载${_baseName}列表` }).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.items
    dataPagination.itemCount = res.data.total
  })
}
onMounted(getDataList)
const dataRowKey = (rowData) => rowData.id

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
  key: dictKey,
  value: null,
  label: null,
  sort: 0,
  style: null,
  status: 1,
  remark: null
}
const addDataForm = ref(cloneDeep(initAddDataForm))
const addDataRules = {
  key: [
    { required: true, message: '请输入字典标识', trigger: 'blur' },
    { min: 2, max: 64, message: '字典标识长度需在 2 - 64 字之内', trigger: 'blur' }
  ],
  value: [
    { required: true, message: '请输入字典值', trigger: 'blur' },
    { min: 1, max: 64, message: '字典值长度需在 1 - 64 字之内', trigger: 'blur' }
  ],
  label: [
    { required: true, message: '请输入字典标签', trigger: 'blur' },
    { min: 1, max: 64, message: '字典标签长度需在 1 - 64 字之内', trigger: 'blur' }
  ],
  sort: [
    { type: 'number', required: true, message: '请选择字典排序值', trigger: 'change' }
  ],
  style: [
    { max: 32, message: '字典样式长度需在 32 字之内', trigger: 'blur' }
  ],
  status: [
    { type: 'number', required: true, message: '请选择字典状态', trigger: 'change' }
  ],
  remark: [
    { max: 255, message: '备注长度需在 255 字之内', trigger: 'blur' }
  ]
}
const showAddDataModal = () => {
  addDataModalShow.value = true
}
const addData = () => {
  proxy.$refs.addDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post(`system/dict/data/${dictKey}/update`, addDataForm.value, { operate: `添加${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const editDataModalShow = ref(false)
const editDataFormLoading = ref(false)
let editDataId = null
const initEditDataForm = {
  key: dictKey,
  value: null,
  label: null,
  sort: null,
  style: null,
  status: null,
  remark: null
}
const editDataForm = ref(cloneDeep(initEditDataForm))
const editDataRules = {
  key: [
    { required: true, message: '请输入字典标识', trigger: 'blur' },
    { min: 2, max: 64, message: '字典标识长度需在 2 - 64 字之内', trigger: 'blur' }
  ],
  value: [
    { required: true, message: '请输入字典值', trigger: 'blur' },
    { min: 1, max: 64, message: '字典值长度需在 1 - 64 字之内', trigger: 'blur' }
  ],
  label: [
    { required: true, message: '请输入字典标签', trigger: 'blur' },
    { min: 1, max: 64, message: '字典标签长度需在 1 - 64 字之内', trigger: 'blur' }
  ],
  sort: [
    { type: 'number', required: true, message: '请选择字典排序值', trigger: 'change' }
  ],
  style: [
    { max: 32, message: '字典样式长度需在 32 字之内', trigger: 'blur' }
  ],
  status: [
    { type: 'number', required: true, message: '请选择字典状态', trigger: 'change' }
  ],
  remark: [
    { max: 255, message: '备注长度需在 255 字之内', trigger: 'blur' }
  ]
}
const showEditDataModal = (id) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  proxy.$http.get(`system/dict/data/${dictKey}/${id}`, { operate: `加载${_baseName}信息` }).then(({ data: res }) => {
    editDataId = id
    const canUpdateFields = Object.keys(initEditDataForm)
    editDataForm.value = pick(res.data, canUpdateFields)
    editDataFormLoading.value = false
  })
}
const editData = () => {
  proxy.$refs.editDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post(`system/dict/data/${dictKey}/update/${editDataId}`, editDataForm.value, { operate: `修改${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const deleteData = (id) => {
  proxy.$http.post(`system/dict/data/${dictKey}/remove/${id}`, null, { operate: `删除${_baseName}` }).then(() => {
    getDataList()
  })
}

</script>
<script>
export default {
  name: 'SystemDictData'
}
</script>

<style lang="scss" scoped></style>
