<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">
        {{ _baseName }}管理
      </n-text>
    </n-h3>
    <strix-block style="margin-bottom: 20px">
      <template #show>
        <n-grid :cols="6" style="margin-bottom: 15px">
          <n-gi :span="1">
            <n-button type="primary" @click="showAddDataModal()">添加{{ _baseName }}</n-button>
          </n-gi>
        </n-grid>
        <n-alert title="提醒" type="warning">Strix 理论支持无限级别菜单，但为了便于前端展示，仍不建议配置超过 3 级菜单。</n-alert>
      </template>
    </strix-block>

    <n-data-table :remote="true" :loading="dataLoading" :columns="dataColumns" :data="dataRef"
      :pagination="dataPagination" :row-key="dataRowKey" :cascade="false" :allow-checking-not-loaded="true" />

    <n-modal v-model:show="addDataModalShow" preset="card" :title="'添加' + _baseName" class="strix-model-primary"
      size="huge" @after-leave="initDataForm">
      <n-form ref="addDataFormRef" :model="addDataForm" :rules="addDataRules" label-placement="left" label-width="auto"
        require-mark-placement="right-hanging">
        <n-grid :cols="2" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-form-item-gi span="2 s:1" label="菜单名称" path="name">
            <n-input v-model:value="addDataForm.name" placeholder="请输入菜单名称" clearable />
          </n-form-item-gi>
          <n-form-item-gi span="2 s:1" label="父级菜单" path="parentId">
            <n-tree-select v-model:value="addDataForm.parentId" :options="dataRef" placeholder="选择父级菜单" cascade clearable
              filterable check-strategy="all" key-field="id" label-field="name" />
          </n-form-item-gi>
          <n-form-item-gi span="2 s:2" label="菜单路由" path="url">
            <n-input v-model:value="addDataForm.url" placeholder="请输入菜单路由" clearable />
          </n-form-item-gi>
          <n-form-item-gi span="2 s:1" label="菜单图标" path="icon">
            <n-input v-model:value="addDataForm.icon" placeholder="请输入菜单图标" clearable />
          </n-form-item-gi>
          <n-form-item-gi span="2 s:1" label="菜单排序" path="sortValue">
            <n-input-number v-model:value="addDataForm.sortValue" placeholder="请输入菜单排序" clearable />
          </n-form-item-gi>
        </n-grid>
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
          <n-grid :cols="2" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
            <n-form-item-gi span="2 s:1" label="菜单名称" path="name">
              <n-input v-model:value="editDataForm.name" placeholder="请输入菜单名称" clearable />
            </n-form-item-gi>
            <n-form-item-gi span="2 s:1" label="父级菜单" path="parentId">
              <n-tree-select v-model:value="editDataForm.parentId" :options="dataRef" placeholder="选择父级菜单" cascade
                clearable filterable check-strategy="all" key-field="id" label-field="name" />
            </n-form-item-gi>
            <n-form-item-gi span="2 s:2" label="菜单路由" path="url">
              <n-input v-model:value="editDataForm.url" placeholder="请输入菜单路由" clearable />
            </n-form-item-gi>
            <n-form-item-gi span="2 s:1" label="菜单图标" path="icon">
              <n-input v-model:value="editDataForm.icon" placeholder="请输入菜单图标" clearable />
            </n-form-item-gi>
            <n-form-item-gi span="2 s:1" label="菜单排序" path="sortValue">
              <n-input-number v-model:value="editDataForm.sortValue" placeholder="请输入菜单排序" clearable />
            </n-form-item-gi>
          </n-grid>
        </n-form>
      </n-spin>

      <template #footer>
        <n-space class="strix-form-modal-footer">
          <n-button @click="editDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="editData">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import StrixBlock from '@/components/StrixBlock.vue'
import { createPagination } from '@/plugins/pagination.js'
import { createStrixMessage } from '@/utils/strix-message'
import { Icon } from '@iconify/vue'
import { cloneDeep, kebabCase, pick } from 'lodash'
import { NButton, NDataTable, NPopconfirm } from 'naive-ui'
import { getCurrentInstance, h, onMounted, ref } from 'vue'

const { proxy } = getCurrentInstance()

// 本页面操作提示关键词
const _baseName = '系统菜单'

// 获取列表请求参数
const initGetDataListParams = {
  pageIndex: 1,
  pageSize: 10
}
const getDataListParams = ref(cloneDeep(initGetDataListParams))
// 展示列信息
const dataColumns = [
  { key: 'name', title: '菜单名称', width: 200 },
  { key: 'url', title: '菜单路由', width: 320 },
  {
    key: 'icon', title: '菜单图标', align: 'center', width: 90,
    render(row) {
      return h(Icon, { icon: 'ion:' + kebabCase(row.icon), width: 24 })
    }
  },
  { key: 'sortValue', title: '菜单排序', width: 90 },
  {
    title: '操作',
    width: 200,
    render(row) {
      return [
        h(NButton, { size: 'medium', type: 'info', style: 'margin-right: 10px', onClick: () => showAddDataModal(row.id) }, () => h(Icon, { icon: 'ion:add' })),
        h(NButton, { size: 'medium', type: 'warning', style: 'margin-right: 10px', onClick: () => showEditDataModal(row.id) }, () => h(Icon, { icon: 'ion:create-outline' })),
        h(NPopconfirm, { onPositiveClick: () => deleteData(row.id) }, { trigger: () => h(NButton, { size: 'medium', type: 'error', style: 'margin-right: 10px' }, () => h(Icon, { icon: 'ion:trash-outline' })), default: () => '是否确认删除这条数据? 该操作不可恢复!' })
      ]
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
  proxy.$http.get('system/menu', { params: getDataListParams.value, operate: `加载${_baseName}列表` }).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.systemMenuList
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
  name: null,
  url: '/',
  icon: null,
  parentId: null,
  sortValue: 0
}
const addDataForm = ref(cloneDeep(initAddDataForm))
const addDataRules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  url: [{ required: true, message: '请输入菜单路由', trigger: 'blur' }],
  sortValue: [
    { type: 'number', required: true, message: '请输入菜单排序值', trigger: 'change' },
    { type: 'number', min: 0, max: 99999, message: '请输入有效排序值 (1-99999)', trigger: 'change' }
  ]
}
const showAddDataModal = (id) => {
  if (id) {
    addDataForm.value.parentId = id
  }
  addDataModalShow.value = true
}
const addData = () => {
  proxy.$refs.addDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post('system/menu/update', addDataForm.value, { operate: `添加${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const editDataModalShow = ref(false)
const editDataFormLoading = ref(false)
let editDataId = null
const initEditDataForm = {
  name: null,
  url: null,
  icon: null,
  parentId: null,
  sortValue: null
}
const editDataForm = ref(cloneDeep(initEditDataForm))
const editDataRules = {
  name: [{ required: true, message: '请输入菜单名称' }],
  url: [{ required: true, message: '请输入菜单路由' }],
  sortValue: [
    { type: 'number', required: true, message: '请输入菜单排序值', trigger: 'change' },
    { type: 'number', min: 0, max: 99999, message: '请输入有效排序值 (1-99999)', trigger: 'change' }
  ]
}
const showEditDataModal = (id) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  proxy.$http.get(`system/menu/${id}`, { operate: `加载${_baseName}信息` }).then(({ data: res }) => {
    editDataId = id
    const canUpdateFields = Object.keys(initEditDataForm)
    editDataForm.value = pick(res.data, canUpdateFields)
    editDataFormLoading.value = false
  })
}
const editData = () => {
  proxy.$refs.editDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post(`system/menu/update/${editDataId}`, editDataForm.value, { operate: `修改${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const deleteData = (id) => {
  proxy.$http.post(`system/menu/remove/${id}`, null, { operate: `删除${_baseName}` }).then(() => {
    getDataList()
  })
}

</script>
<script>
export default {
  name: 'SystemMenuIndex'
}
</script>

<style lang="scss" scoped></style>
