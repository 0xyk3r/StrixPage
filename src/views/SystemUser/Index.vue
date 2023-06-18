<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">{{ _baseName }}管理</n-text>
    </n-h3>
    <strix-block style="margin-bottom: 20px" show-clear-button @clear-search="clearSearch">
      <template #show>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen" style="margin-bottom: 15px">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" placeholder="请输入搜索条件（昵称、手机号码）" clearable />
              <n-button type="primary" ghost @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="getDataListParams" label-placement="left" label-width="auto" :show-feedback="false">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi span="6 s:3 m:2" label="用户状态" path="status">
            <n-select v-model:value="getDataListParams.status" :options="systemUserStatusRef" placeholder="请选择用户状态"
              clearable />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>
    <n-data-table :remote="true" :loading="dataLoading" :columns="dataColumns" :data="dataRef"
      :pagination="dataPagination" :row-key="dataRowKey" />

    <n-modal v-model:show="editDataModalShow" preset="card" :title="'修改' + _baseName" class="strix-model-primary"
      size="huge" @after-leave="initDataForm">
      <n-spin :show="editDataFormLoading">
        <n-form ref="editDataFormRef" :model="editDataForm" :rules="editDataRules" label-placement="left"
          label-width="auto" require-mark-placement="right-hanging">
          <n-form-item label="用户昵称" path="nickname">
            <n-input v-model:value="editDataForm.nickname" placeholder="请输入用户昵称" clearable />
          </n-form-item>
          <n-form-item label="手机号码" path="phoneNumber">
            <n-input v-model:value="editDataForm.phoneNumber" placeholder="请输入手机号码" clearable />
          </n-form-item>
          <n-form-item label="用户状态" path="status">
            <n-select v-model:value="editDataForm.status" :options="systemUserStatusRef" placeholder="请选择用户状态"
              clearable />
          </n-form-item>
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
import StrixTag from '@/components/StrixTag.vue'
import { createPagination } from '@/plugins/pagination.js'
import { useDictsStore } from '@/stores/dicts'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import _, { cloneDeep } from 'lodash'
import { NButton, NDataTable } from 'naive-ui'
import { getCurrentInstance, h, onMounted, provide, ref } from 'vue'

const { proxy } = getCurrentInstance()
const dictsStore = useDictsStore()

// 本页面操作提示关键词
const _baseName = '系统用户'

// 加载字典
const systemUserStatusRef = ref([])
provide('SystemUserStatusDict', systemUserStatusRef)
onMounted(() => {
  dictsStore.getDictData('SystemUserStatus', systemUserStatusRef)
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
  { key: 'nickname', title: '用户昵称', width: 160 },
  { key: 'phoneNumber', title: '手机号码', width: 220 },
  {
    key: 'status',
    title: '用户状态',
    width: 120,
    render(row) {
      return h(StrixTag, { value: row.status, dictName: 'SystemUserStatus' })
    }
  },
  {
    title: '操作',
    width: 200,
    render(row) {
      return handleOperate([
        { type: 'warning', label: '编辑', icon: 'ion:create-outline', onClick: () => showEditDataModal(row.id) },
        {
          type: 'error',
          label: '删除',
          icon: 'ion:trash-outline',
          onClick: () => deleteData(row.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据? 该操作不可恢复!'
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
  proxy.$http.get('system/user', { params: getDataListParams.value, operate: `加载${_baseName}列表` }).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.systemUserList
    dataPagination.itemCount = res.data.total
  })
}
onMounted(getDataList)
const dataRowKey = (rowData) => rowData.id

const initDataForm = () => {
  editDataModalShow.value = false
  editDataFormLoading.value = false
  editDataId = null
  editDataForm.value = cloneDeep(initEditDataForm)
}

const editDataModalShow = ref(false)
const editDataFormLoading = ref(false)
let editDataId = null
const initEditDataForm = {
  nickname: null,
  status: null,
  phoneNumber: null
}
const editDataForm = ref(cloneDeep(initEditDataForm))
const editDataRules = {
  nickname: [{ required: true, message: '请输入用户昵称', trigger: 'blur' }],
}
const showEditDataModal = (id) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  proxy.$http.get(`system/user/${id}`, { operate: `加载${_baseName}信息` }).then(({ data: res }) => {
    editDataId = id
    const canUpdateFields = Object.keys(initEditDataForm)
    editDataForm.value = _.pick(res.data, canUpdateFields)
    editDataFormLoading.value = false
  })
}
const editData = () => {
  proxy.$refs.editDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post(`system/user/update/${editDataId}`, editDataForm.value, { operate: `修改${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const deleteData = (id) => {
  proxy.$http.post(`system/user/remove/${id}`, null, { operate: `删除${_baseName}` }).then(() => {
    getDataList()
  })
}

</script>
<script>
export default {
  name: 'SystemUserIndex'
}
</script>

<style lang="scss" scoped></style>
