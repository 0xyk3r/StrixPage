<template>
  <div>
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input
                v-model:value="getDataListParams.keyword"
                placeholder="按名称搜索"
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
              :options="dictDataStatusRef"
              placeholder="请选择字典数据状态"
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
      table-layout="fixed"
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
          <n-select
            v-model:value="addDataForm.style"
            :options="dictDataStyleRef"
            placeholder="请选择字典样式"
            clearable
          />
        </n-form-item>
        <n-form-item label="字典状态" path="status">
          <n-select
            v-model:value="addDataForm.status"
            :options="dictDataStatusRef"
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
        <n-flex justify="end">
          <n-button @click="addDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="addData"> 确定 </n-button>
        </n-flex>
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
          <n-form-item label="字典值" path="value">
            <n-input v-model:value="editDataForm.value" placeholder="请输入字典值" clearable />
          </n-form-item>
          <n-form-item label="字典标签" path="label">
            <n-input v-model:value="editDataForm.label" placeholder="请输入字典标签" clearable />
          </n-form-item>
          <n-form-item label="字典排序" path="sort">
            <n-input-number
              v-model:value="editDataForm.sort"
              placeholder="请输入字典排序"
              clearable
            />
          </n-form-item>
          <n-form-item label="字典样式" path="style">
            <n-select
              v-model:value="editDataForm.style"
              :options="dictDataStyleRef"
              placeholder="请选择字典样式"
              clearable
            />
          </n-form-item>
          <n-form-item label="字典状态" path="status">
            <n-select
              v-model:value="editDataForm.status"
              :options="dictDataStatusRef"
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
        <n-flex justify="end">
          <n-button @click="editDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="editData"> 确定 </n-button>
        </n-flex>
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
import { type DataTableColumns, type FormRules, NTag } from 'naive-ui'

const route = useRoute()

// 本页面操作提示关键词
const _baseName = '系统字典数据'

// 路由参数
const dictKey = route.params.dictKey

// 加载字典
const dictDataStyleRef = useDict('DictDataStyle')
const dictDataStatusRef = useDict('DictDataStatus')

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
    pageIndex: 1,
    pageSize: 10
  },
  () => {
    getDataList()
  },
  {
    key: dictKey,
    value: null,
    label: null,
    sort: 0,
    style: null,
    status: 1,
    remark: null
  },
  {
    key: dictKey,
    value: null,
    label: null,
    sort: null,
    style: null,
    status: null,
    remark: null
  }
)

// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'value', title: '字典值', width: 240 },
  { key: 'label', title: '字典标签', width: 240 },
  { key: 'sort', title: '字典排序', width: 120, align: 'center' },
  {
    key: 'style',
    title: '字典样式预览',
    width: 240,
    align: 'center',
    render(row: any) {
      return h(NTag, { type: row.style, bordered: false }, { default: () => row.label })
    }
  },
  {
    key: 'status',
    title: '字典状态',
    width: 120,
    align: 'center',
    render(row: any) {
      return h(StrixTag, { value: row.status, dictName: 'DictDataStatus' })
    }
  },
  { key: 'remark', title: '备注', width: 240 },
  {
    key: 'actions',
    title: '操作',
    width: 130,
    align: 'center',
    render(row: any) {
      return handleOperate([
        {
          type: 'warning',
          label: '编辑',
          icon: 'ion:create-outline',
          onClick: () => showEditDataModal(row.id)
        },
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
// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  http
    .get(`system/dict/data/${dictKey}`, {
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
  sort: [{ type: 'number', required: true, message: '请选择字典排序值', trigger: 'change' }],
  style: [{ max: 32, message: '字典样式长度需在 32 字之内', trigger: 'blur' }],
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
      .post(`system/dict/data/${dictKey}/update`, addDataForm.value, {
        meta: { operate: `添加${_baseName}` }
      })
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
  value: [
    { required: true, message: '请输入字典值', trigger: 'blur' },
    { min: 1, max: 64, message: '字典值长度需在 1 - 64 字之内', trigger: 'blur' }
  ],
  label: [
    { required: true, message: '请输入字典标签', trigger: 'blur' },
    { min: 1, max: 64, message: '字典标签长度需在 1 - 64 字之内', trigger: 'blur' }
  ],
  sort: [{ type: 'number', required: true, message: '请选择字典排序值', trigger: 'change' }],
  style: [{ max: 32, message: '字典样式长度需在 32 字之内', trigger: 'blur' }],
  status: [{ type: 'number', required: true, message: '请选择字典状态', trigger: 'change' }],
  remark: [{ max: 255, message: '备注长度需在 255 字之内', trigger: 'blur' }]
}
const showEditDataModal = (id: string) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  http
    .get(`system/dict/data/${dictKey}/${id}`, { meta: { operate: `加载${_baseName}信息` } })
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
      .post(`system/dict/data/${dictKey}/update/${editDataId.value}`, editDataForm.value, {
        meta: { operate: `修改${_baseName}` }
      })
      .then(() => {
        initDataForm()
        getDataList()
      })
  })
}

const deleteData = (id: string) => {
  http
    .post(`system/dict/data/${dictKey}/remove/${id}`, null, {
      meta: { operate: `删除${_baseName}` }
    })
    .then(() => {
      getDataList()
    })
}
</script>

<style lang="scss" scoped></style>
