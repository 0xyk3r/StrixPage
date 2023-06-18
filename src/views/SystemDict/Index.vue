<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">
        {{ _baseName }}管理
      </n-text>
    </n-h3>
    <strix-block style="margin-bottom: 20px" show-clear-button @clear-search="clearSearch">
      <template #show>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen" style="margin-bottom: 15px">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" placeholder="按字典标识或名称搜索" clearable />
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
            <n-select v-model:value="getDataListParams.status" :options="dictStatusRef" placeholder="请选择字典状态" clearable
              @update:value="getDataList" @clear="getDataListParams.status = ''" />
          </n-form-item-gi>
          <n-form-item-gi span="6 s:3 m:2" label="是否内置" path="provided">
            <n-select v-model:value="getDataListParams.provided" :options="dictProvidedRef" placeholder="请选择字典是否内置"
              clearable @update:value="getDataList" @clear="getDataListParams.provided = ''" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table :remote="true" :loading="dataLoading" :columns="dataColumns" :data="dataRef"
      :pagination="dataPagination" :row-key="dataRowKey" />

    <n-modal v-model:show="addDataModalShow" preset="card" :title="'添加' + _baseName" class="strix-model-primary"
      :class="isSmallWindow ? 'strix-full-modal' : ''" size="huge" @after-leave="initDataForm">
      <n-form ref="addDataFormRef" :model="addDataForm" :rules="addDataRules" label-placement="left" label-width="auto"
        require-mark-placement="right-hanging">
        <n-form-item label="字典标识" path="key">
          <n-input v-model:value="addDataForm.key" placeholder="请输入字典标识" clearable />
        </n-form-item>
        <n-form-item label="字典名称" path="name">
          <n-input v-model:value="addDataForm.name" placeholder="请输入字典名称" clearable />
        </n-form-item>
        <n-form-item label="数据类型" path="dataType">
          <n-select v-model:value="addDataForm.dataType" :options="dictDataTypeRef" placeholder="请选择字典数据类型" clearable />
        </n-form-item>
        <n-form-item label="字典状态" path="status">
          <n-select v-model:value="addDataForm.status" :options="dictStatusRef" placeholder="请选择字典状态" clearable />
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
      :class="isSmallWindow ? 'strix-full-modal' : ''" size="huge" @after-leave="initDataForm">
      <n-spin :show="editDataFormLoading">
        <n-form ref="editDataFormRef" :model="editDataForm" :rules="editDataRules" label-placement="left"
          label-width="auto" require-mark-placement="right-hanging">
          <n-form-item label="字典标识" path="key">
            <n-input v-model:value="editDataForm.key" placeholder="请输入字典标识" clearable />
          </n-form-item>
          <n-form-item label="字典名称" path="name">
            <n-input v-model:value="editDataForm.name" placeholder="请输入字典名称" clearable />
          </n-form-item>
          <n-form-item label="数据类型" path="dataType">
            <n-select v-model:value="editDataForm.dataType" :options="dictDataTypeRef" placeholder="请选择字典数据类型"
              clearable />
          </n-form-item>
          <n-form-item label="字典状态" path="status">
            <n-select v-model:value="editDataForm.status" :options="dictStatusRef" placeholder="请选择字典状态" clearable />
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
import { forOwn, pick } from 'lodash'
import { NButton, NDataTable } from 'naive-ui'
import { getCurrentInstance, h, onMounted, provide, ref } from 'vue'
import { useRouter } from 'vue-router'

const { proxy } = getCurrentInstance()
const $router = useRouter()
const dictsStore = useDictsStore()

// 本页面操作提示关键词
const _baseName = '系统字典'

defineProps({
  isSmallWindow: {
    type: Boolean, default: false
  }
})

// 加载字典
const dictStatusRef = ref([])
const dictProvidedRef = ref([])
const dictDataTypeRef = ref([])
provide('DictStatusDict', dictStatusRef)
provide('DictProvidedDict', dictProvidedRef)
provide('DictDataTypeDict', dictDataTypeRef)
onMounted(() => {
  dictsStore.getDictData('DictStatus', dictStatusRef)
  dictsStore.getDictData('DictProvided', dictProvidedRef)
  dictsStore.getDictData('DictDataType', dictDataTypeRef)
})

// 获取列表请求参数
const getDataListParams = ref({
  keyword: '',
  status: null,
  provided: null,
  pageIndex: 1,
  pageSize: 10
})
const clearSearch = () => {
  getDataListParams.value.keyword = ''
  getDataListParams.value.status = null
  getDataListParams.value.provided = null
  getDataList()
}
// 展示列信息
const dataColumns = [
  { key: 'key', title: '字典标识', width: 150 },
  { key: 'name', title: '字典名称', width: 150 },
  { key: 'version', title: '字典版本', width: 100 },
  {
    key: 'status', title: '字典状态', width: 100, render(row) {
      return h(StrixTag, { value: row.status, dictName: 'DictStatus' })
    }
  },
  {
    key: 'dataType', title: '字典数据类型', width: 150, render(row) {
      return h(StrixTag, { value: row.dataType, dictName: 'DictDataType' })
    }
  },
  {
    key: 'provided', title: '是否内置', width: 100, render(row) {
      return h(StrixTag, { value: row.provided, dictName: 'DictProvided' })
    }
  },
  { key: 'remark', title: '备注', width: 250 },
  {
    title: '操作',
    width: 240,
    render(row) {
      return handleOperate([
        { type: 'info', label: '查看字典数据', icon: 'ion:list-outline', onClick: () => viewDictData(row.key) },
        { type: 'warning', label: '编辑', icon: 'ion:create-outline', disabled: row.provided === 1, onClick: () => showEditDataModal(row.id) },
        {
          type: 'error',
          label: '删除',
          icon: 'ion:trash-outline',
          disabled: row.provided === 1,
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
  proxy.$http.get('system/dict', { params: getDataListParams.value, operate: `加载${_baseName}列表` }).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.items
    dataPagination.itemCount = res.data.total
  })
}
onMounted(getDataList)
const dataRowKey = (rowData) => rowData.id

const viewDictData = (key) => {
  $router.push({ path: `/system/dict/${key}` })
}

const initDataForm = () => {
  addDataModalShow.value = false
  editDataModalShow.value = false
  editDataFormLoading.value = false
  addDataForm.value = {
    key: '',
    name: '',
    dataType: 2,
    status: 1,
    remark: ''
  }
  editDataId = ''
  editDataForm.value = {
    key: '',
    name: '',
    dataType: null,
    status: null,
    remark: ''
  }
}

const addDataModalShow = ref(false)
const addDataForm = ref({
  key: '',
  name: '',
  dataType: 2,
  status: 1,
  remark: ''
})
const addDataRules = {
  key: [
    { required: true, message: '请输入字典标识', trigger: 'blur' },
    { min: 2, max: 64, message: '字典标识长度需在 2 - 64 字之内', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入字典名称', trigger: 'blur' },
    { min: 2, max: 32, message: '字典名称长度需在 2 - 32 字之内', trigger: 'blur' }
  ],
  dataType: [
    { type: 'number', required: true, message: '请选择字典数据类型', trigger: 'change' }
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

    proxy.$http.post('system/dict/update', addDataForm.value, { operate: `添加${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const editDataModalShow = ref(false)
const editDataFormLoading = ref(false)
let editDataId = ''
const editDataForm = ref({
  key: '',
  name: '',
  dataType: null,
  status: null,
  remark: ''
})
const editDataRules = {
  key: [
    { required: true, message: '请输入字典标识', trigger: 'blur' },
    { min: 2, max: 64, message: '字典标识长度需在 2 - 64 字之内', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入字典名称', trigger: 'blur' },
    { min: 2, max: 32, message: '字典名称长度需在 2 - 32 字之内', trigger: 'blur' }
  ],
  dataType: [
    { type: 'number', required: true, message: '请选择字典数据类型', trigger: 'change' }
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
  proxy.$http.get(`system/dict/${id}`, { operate: `加载${_baseName}信息` }).then(({ data: res }) => {
    const canUpdateFields = []
    forOwn(editDataForm.value, function (value, key) {
      canUpdateFields.push(key)
    })
    editDataId = id
    editDataForm.value = pick(res.data, canUpdateFields)
    editDataFormLoading.value = false
  })
}
const editData = () => {
  proxy.$refs.editDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post(`system/dict/update/${editDataId}`, editDataForm.value, { operate: `修改${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const deleteData = (id) => {
  proxy.$http.post(`system/dict/remove/${id}`, null, { operate: `删除${_baseName}` }).then(() => {
    getDataList()
  })
}

</script>
<script>
export default {
  name: 'SystemDictIndex'
}
</script>

<style lang="scss" scoped></style>
