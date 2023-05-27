<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">
        {{ funName }}管理
      </n-text>
    </n-h3>
    <strix-block style="margin-bottom: 20px" show-clear-button @clear-search="clearSearch">
      <template #show>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen" style="margin-bottom: 15px">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="filterDataListParams.keyword" placeholder="请输入搜索条件（名称、标识）" clearable />
              <n-button type="primary" ghost @click="getDataList">
                搜索
              </n-button>
            </n-input-group>
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAddDataModal()">
              添加{{ funName }}
            </n-button>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="filterDataListParams" label-placement="left" label-width="auto" :show-feedback="false">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi span="6 s:3 m:2" label="权限类型" path="permissionType">
            <n-select v-model:value="filterDataListParams.permissionType" :options="permissionTypeOptions"
              placeholder="请选择权限类型" clearable />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>
    <n-data-table :loading="dataLoading" :columns="dataColumns" :data="filterDataList" :row-key="dataRowKey" />

    <n-modal v-model:show="addDataModalShow" preset="card" :title="'添加' + funName" class="strix-model-primary"
      :class="isSmallWindow ? 'strix-full-modal' : ''" size="huge" @after-leave="initDataForm">
      <n-form ref="addDataFormRef" :model="addDataForm" :rules="addDataRules" label-placement="left" label-width="auto"
        require-mark-placement="right-hanging">
        <n-form-item label="权限名称" path="name">
          <n-input v-model:value="addDataForm.name" placeholder="请输入权限名称" clearable />
        </n-form-item>
        <n-form-item label="权限标识" path="permissionKey">
          <n-input v-model:value="addDataForm.permissionKey" placeholder="请输入权限标识" clearable />
        </n-form-item>
        <n-form-item label="系统权限类型" path="permissionType">
          <n-select v-model:value="addDataForm.permissionType" :options="permissionTypeOptions" placeholder="请选择系统权限类型"
            clearable />
        </n-form-item>
        <n-form-item label="权限介绍" path="description">
          <n-input v-model:value="addDataForm.description" placeholder="请输入权限介绍" clearable />
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

    <n-modal v-model:show="editDataModalShow" preset="card" :title="'修改' + funName" class="strix-model-primary"
      :class="isSmallWindow ? 'strix-full-modal' : ''" size="huge" @after-leave="initDataForm">
      <n-spin :show="editDataFormLoading">
        <n-form ref="editDataFormRef" :model="editDataForm" :rules="editDataRules" label-placement="left"
          label-width="auto" require-mark-placement="right-hanging">
          <n-form-item label="权限名称" path="name">
            <n-input v-model:value="editDataForm.name" placeholder="请输入权限名称" clearable />
          </n-form-item>
          <n-form-item label="权限标识" path="permissionKey">
            <n-input v-model:value="editDataForm.permissionKey" placeholder="请输入权限标识" clearable />
          </n-form-item>
          <n-form-item label="系统权限类型" path="permissionType">
            <n-select v-model:value="editDataForm.permissionType" :options="permissionTypeOptions" placeholder="请选择系统权限类型"
              clearable />
          </n-form-item>
          <n-form-item label="权限介绍" path="description">
            <n-input v-model:value="editDataForm.description" placeholder="请输入权限介绍" clearable />
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
import { createStrixNotify } from '@/utils/strix-notify'
import { Icon } from '@iconify/vue'
import { forOwn, pick } from 'lodash'
import { NButton, NDataTable, NPopconfirm, NTag } from 'naive-ui'
import { computed, getCurrentInstance, h, onMounted, ref } from 'vue'

const { proxy } = getCurrentInstance()

// 本页面操作提示关键词
const funName = '系统权限'

defineProps({
  isSmallWindow: {
    type: Boolean, default: false
  }
})

// 展示列信息
const dataColumns = [
  { key: 'name', title: '权限名称', width: 140 },
  { key: 'permissionKey', title: '权限标识', width: 200 },
  {
    key: 'permissionType',
    title: '权限类型',
    width: 80,
    render(row) {
      const tagType = row.permissionType === 1 ? 'success' : 'info'
      const tagContent = row.permissionType === 1 ? '只读权限' : '读写权限'
      return h(NTag, { type: tagType, bordered: false }, { default: () => tagContent })
    }
  },
  { key: 'description', title: '权限介绍', width: 260 },
  {
    title: '操作',
    width: 140,
    render(row) {
      return [
        h(NButton, { size: 'medium', type: 'warning', style: 'margin-right: 10px', onClick: () => showEditDataModal(row.id) }, () => h(Icon, { icon: 'ion:create-outline' })),
        h(NPopconfirm, { onPositiveClick: () => deleteData(row.id) }, {
          trigger: () => h(NButton, { size: 'medium', type: 'error', style: 'margin-right: 10px' }, () => h(Icon, { icon: 'ion:trash-outline' })),
          default: () => '是否确认删除这条数据? 该操作不可恢复!'
        })
      ]
    }
  }
]
// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  proxy.$http.get('system/permission', { operate: `加载${funName}列表` }).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.systemPermissionList
  })
}
onMounted(getDataList)
// 本地筛选数据
const filterDataListParams = ref({
  keyword: '',
  permissionType: ''
})
const filterDataList = computed(() =>
  dataRef.value?.filter((d) => {
    let filterd = true
    if (filterDataListParams.value.keyword && d.name.indexOf(filterDataListParams.value.keyword) < 0 && d.permissionKey.indexOf(filterDataListParams.value.keyword) < 0) filterd = false
    if (filterDataListParams.value.permissionType && filterDataListParams.value.permissionType != d.permissionType) filterd = false
    return filterd
  })
)
const clearSearch = () => {
  filterDataListParams.value.keyword = ''
  filterDataListParams.value.permissionType = ''
}
const dataRowKey = (rowData) => rowData.id

const permissionTypeOptions = [
  { value: '', label: '未选择' },
  { value: 1, label: '只读权限' },
  { value: 2, label: '读写权限' }
]

const initDataForm = () => {
  addDataModalShow.value = false
  editDataModalShow.value = false
  editDataFormLoading.value = false
  addDataForm.value = {
    name: '',
    permissionKey: '',
    permissionType: '',
    description: ''
  }
  editDataId = ''
  editDataForm.value = {
    name: '',
    permissionKey: '',
    permissionType: '',
    description: ''
  }
}

const addDataModalShow = ref(false)
const addDataForm = ref({
  name: '',
  permissionKey: '',
  permissionType: '',
  description: ''
})
const addDataRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 12, message: '系统权限名称长度需在2-12之间', trigger: 'blur' }
  ],
  permissionKey: [
    { required: true, message: '请输入权限标识', trigger: 'blur' },
    { min: 2, max: 32, message: '权限标识长度需在2-32之间', trigger: 'blur' }
  ],
  permissionType: [
    { type: 'number', required: true, message: '请选择权限类型', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入权限介绍', trigger: 'blur' },
    { max: 128, message: '权限介绍长度需在1-128之间', trigger: 'blur' }
  ]
}
const showAddDataModal = () => {
  addDataModalShow.value = true
}
const addData = () => {
  proxy.$refs.addDataFormRef.validate((errors) => {
    if (errors) {
      createStrixNotify('error', '表单校验失败', '请检查表单中的错误，并根据提示修改')
      return
    }
    proxy.$http.post('system/permission/update', addDataForm.value, { operate: `添加${funName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const editDataModalShow = ref(false)
const editDataFormLoading = ref(false)
let editDataId = ''
const editDataForm = ref({
  name: '',
  permissionKey: '',
  permissionType: '',
  description: ''
})
const editDataRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 12, message: '系统权限名称长度需在2-12之间', trigger: 'blur' }
  ],
  permissionKey: [
    { required: true, message: '请输入权限标识', trigger: 'blur' },
    { min: 2, max: 32, message: '权限标识长度需在2-32之间', trigger: 'blur' }
  ],
  permissionType: [
    { type: 'number', required: true, message: '请选择权限类型', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入权限介绍', trigger: 'blur' },
    { max: 128, message: '权限介绍长度需在1-128之间', trigger: 'blur' }
  ]
}
const showEditDataModal = (id) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  proxy.$http.get(`system/permission/${id}`, { operate: `加载${funName}信息` }).then(({ data: res }) => {
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
    if (errors) return createStrixNotify('error', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post(`system/permission/update/${editDataId}`, editDataForm.value, { operate: `修改${funName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const deleteData = (id) => {
  proxy.$http.post(`system/permission/remove/${id}`, null, { operate: `删除${funName}` }).then(() => {
    getDataList()
  })
}

</script>
<script>
export default {
  name: 'SystemPermissionIndex'
}
</script>

<style lang="scss" scoped></style>
