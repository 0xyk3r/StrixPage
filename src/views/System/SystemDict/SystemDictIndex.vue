<template>
  <div>
    <strix-block style="margin-bottom: 20px" cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input
                v-model:value="getDataListParams.keyword"
                placeholder="按字典标识或名称搜索"
                clearable
              />
              <n-button type="primary" ghost @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAddDataModal"> 添加{{ _baseName }} </n-button>
          </n-gi>
        </n-grid>
      </template>
      <n-form
        :model="getDataListParams"
        label-placement="left"
        label-width="auto"
        :show-feedback="false"
      >
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi span="6 s:3 m:2" label="字典状态" path="status">
            <n-select
              v-model:value="getDataListParams.status"
              :options="dictStatusRef"
              placeholder="请选择字典状态"
              clearable
              @update:value="getDataList"
            />
          </n-form-item-gi>
          <n-form-item-gi span="6 s:3 m:2" label="是否内置" path="provided">
            <n-select
              v-model:value="getDataListParams.provided"
              :options="dictProvidedRef"
              placeholder="请选择字典是否内置"
              clearable
              @update:value="getDataList"
            />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table
      :remote="true"
      :loading="dataLoading"
      :columns="dataColumns"
      :data="dataRef"
      :pagination="dataPagination"
      :row-key="dataRowKey"
    />

    <n-modal
      v-model:show="addDataModalShow"
      preset="card"
      :title="'添加' + _baseName"
      class="strix-form-modal"
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
        <n-form-item label="字典标识" path="key">
          <n-input v-model:value="addDataForm.key" placeholder="请输入字典标识" clearable />
        </n-form-item>
        <n-form-item label="字典名称" path="name">
          <n-input v-model:value="addDataForm.name" placeholder="请输入字典名称" clearable />
        </n-form-item>
        <n-form-item label="数据类型" path="dataType">
          <n-select
            v-model:value="addDataForm.dataType"
            :options="dictDataTypeRef"
            placeholder="请选择字典数据类型"
            clearable
          />
        </n-form-item>
        <n-form-item label="字典状态" path="status">
          <n-select
            v-model:value="addDataForm.status"
            :options="dictStatusRef"
            placeholder="请选择字典状态"
            clearable
          />
        </n-form-item>
        <n-form-item label="备注信息" path="remark">
          <n-input
            v-model:value="addDataForm.remark"
            placeholder="在此输入备注信息"
            type="textarea"
            :autosize="{
              minRows: 3,
              maxRows: 5
            }"
          />
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
      class="strix-form-modal"
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
          <n-form-item label="字典标识" path="key">
            <n-input v-model:value="editDataForm.key" placeholder="请输入字典标识" clearable />
          </n-form-item>
          <n-form-item label="字典名称" path="name">
            <n-input v-model:value="editDataForm.name" placeholder="请输入字典名称" clearable />
          </n-form-item>
          <n-form-item label="数据类型" path="dataType">
            <n-select
              v-model:value="editDataForm.dataType"
              :options="dictDataTypeRef"
              placeholder="请选择字典数据类型"
              clearable
            />
          </n-form-item>
          <n-form-item label="字典状态" path="status">
            <n-select
              v-model:value="editDataForm.status"
              :options="dictStatusRef"
              placeholder="请选择字典状态"
              clearable
            />
          </n-form-item>
          <n-form-item label="备注信息" path="remark">
            <n-input
              v-model:value="editDataForm.remark"
              placeholder="在此输入备注信息"
              type="textarea"
              :autosize="{
                minRows: 3,
                maxRows: 5
              }"
            />
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

<script setup lang="ts">
import StrixBlock from '@/components/StrixBlock.vue'
import StrixTag from '@/components/StrixTag.vue'
import { http } from '@/plugins/axios'
import { usePage } from '@/utils/common-page-util'
import { useDict } from '@/utils/strix-dict-util'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { pick } from 'lodash'
import { type DataTableColumns, type FormRules } from 'naive-ui'

const router = useRouter()

// 本页面操作提示关键词
const _baseName = '系统字典'

// 加载字典
const dictStatusRef = useDict('DictStatus')
const dictProvidedRef = useDict('DictProvided')
const dictDataTypeRef = useDict('DictDataType')

const {
  getDataListParams,
  clearSearch,
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
    keyword: null,
    status: null,
    provided: null,
    pageIndex: 1,
    pageSize: 10
  },
  () => {
    getDataList()
  },
  {
    key: null,
    name: null,
    dataType: 2,
    status: 1,
    remark: null
  },
  {
    key: null,
    name: null,
    dataType: null,
    status: null,
    remark: null
  }
)

// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'key', title: '字典标识', width: 150 },
  { key: 'name', title: '字典名称', width: 150 },
  { key: 'version', title: '字典版本', width: 100 },
  {
    key: 'status',
    title: '字典状态',
    width: 100,
    render(row: any) {
      return h(StrixTag, { value: row.status, dictName: 'DictStatus' })
    }
  },
  {
    key: 'dataType',
    title: '字典数据类型',
    width: 150,
    render(row: any) {
      return h(StrixTag, { value: row.dataType, dictName: 'DictDataType' })
    }
  },
  {
    key: 'provided',
    title: '是否内置',
    width: 100,
    render(row: any) {
      return h(StrixTag, { value: row.provided, dictName: 'DictProvided' })
    }
  },
  { key: 'remark', title: '备注', width: 250 },
  {
    key: 'actions',
    title: '操作',
    width: 240,
    render(row: any) {
      return handleOperate([
        {
          type: 'info',
          label: '查看字典数据',
          icon: 'ion:list-outline',
          onClick: () => viewDictData(row.key)
        },
        {
          type: 'warning',
          label: '编辑',
          icon: 'ion:create-outline',
          disabled: row.provided === 1,
          onClick: () => showEditDataModal(row.id)
        },
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
// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  http
    .get('system/dict', {
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

const viewDictData = (key: string) => {
  router.push({ path: `/system/dict/${key}` })
}
const addDataRules: FormRules = {
  key: [
    { required: true, message: '请输入字典标识', trigger: 'blur' },
    { min: 2, max: 64, message: '字典标识长度需在 2 - 64 字之内', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入字典名称', trigger: 'blur' },
    { min: 2, max: 32, message: '字典名称长度需在 2 - 32 字之内', trigger: 'blur' }
  ],
  dataType: [{ type: 'number', required: true, message: '请选择字典数据类型', trigger: 'change' }],
  status: [{ type: 'number', required: true, message: '请选择字典状态', trigger: 'change' }],
  remark: [{ max: 255, message: '备注长度需在 255 字之内', trigger: 'blur' }]
}
const showAddDataModal = () => {
  addDataModalShow.value = true
}
const addData = () => {
  addDataFormRef.value?.validate((errors) => {
    if (errors)
      return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    http
      .post('system/dict/update', addDataForm.value, { meta: { operate: `添加${_baseName}` } })
      .then(() => {
        initDataForm()
        getDataList()
      })
  })
}

const editDataRules: FormRules = {
  key: [
    { required: true, message: '请输入字典标识', trigger: 'blur' },
    { min: 2, max: 64, message: '字典标识长度需在 2 - 64 字之内', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入字典名称', trigger: 'blur' },
    { min: 2, max: 32, message: '字典名称长度需在 2 - 32 字之内', trigger: 'blur' }
  ],
  dataType: [{ type: 'number', required: true, message: '请选择字典数据类型', trigger: 'change' }],
  status: [{ type: 'number', required: true, message: '请选择字典状态', trigger: 'change' }],
  remark: [{ max: 255, message: '备注长度需在 255 字之内', trigger: 'blur' }]
}
const showEditDataModal = (id: any) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  http
    .get(`system/dict/${id}`, { meta: { operate: `加载${_baseName}信息` } })
    .then(({ data: res }) => {
      editDataId.value = id
      const canUpdateFields = Object.keys(initEditDataForm)
      editDataForm.value = pick(res.data, canUpdateFields)
      editDataFormLoading.value = false
    })
}
const editData = () => {
  editDataFormRef.value?.validate((errors) => {
    if (errors)
      return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    http
      .post(`system/dict/update/${editDataId.value}`, editDataForm.value, {
        meta: { operate: `修改${_baseName}` }
      })
      .then(() => {
        initDataForm()
        getDataList()
      })
  })
}

const deleteData = (id: any) => {
  http
    .post(`system/dict/remove/${id}`, null, { meta: { operate: `删除${_baseName}` } })
    .then(() => {
      getDataList()
    })
}
</script>

<style lang="scss" scoped></style>
