<template>
  <div>
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input
                v-model:value="getDataListParams.keyword"
                clearable
                placeholder="请输入搜索条件（昵称、手机号码）"
              />
              <n-button ghost type="primary" @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
        </n-grid>
      </template>
      <n-form
        :model="getDataListParams"
        :show-feedback="false"
        label-placement="left"
        label-width="auto"
      >
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi label="用户状态" path="status" span="6 s:3 m:2">
            <n-select
              v-model:value="getDataListParams.status"
              :options="systemUserStatusRef"
              clearable
              placeholder="请选择用户状态"
            />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>
    <n-data-table
      :columns="dataColumns"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="dataPagination"
      :remote="true"
      :row-key="dataRowKey"
      table-layout="fixed"
    />

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
          <n-form-item label="用户昵称" path="nickname">
            <n-input v-model:value="editDataForm.nickname" clearable placeholder="请输入用户昵称" />
          </n-form-item>
          <n-form-item label="手机号码" path="phoneNumber">
            <n-input
              v-model:value="editDataForm.phoneNumber"
              clearable
              placeholder="请输入手机号码"
            />
          </n-form-item>
          <n-form-item label="用户状态" path="status">
            <n-select
              v-model:value="editDataForm.status"
              :options="systemUserStatusRef"
              clearable
              placeholder="请选择用户状态"
            />
          </n-form-item>
        </n-form>
      </n-spin>

      <template #footer>
        <n-flex justify="end">
          <n-button @click="editDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="editData">确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import StrixBlock from '@/components/StrixBlock.vue'
import StrixTag from '@/components/StrixTag.vue'
import { http } from '@/plugins/axios'
import { usePage } from '@/utils/common-page-util'
import { useDict } from '@/utils/strix-dict-util'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { pick } from 'lodash'
import { type DataTableColumns, type FormRules } from 'naive-ui'

// 本页面操作提示关键词
const _baseName = '系统用户'

// 加载字典
const systemUserStatusRef = useDict('SystemUserStatus')

const {
  getDataListParams,
  clearSearch,
  dataPagination,
  dataRowKey,
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
  null,
  {
    nickname: null,
    status: null,
    phoneNumber: null
  }
)

// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'nickname', title: '用户昵称', width: 200 },
  { key: 'phoneNumber', title: '手机号码', width: 200 },
  {
    key: 'status',
    title: '用户状态',
    width: 140,
    align: 'center',
    render(row: any) {
      return h(StrixTag, { value: row.status, dictName: 'SystemUserStatus' })
    }
  },
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
          icon: 'square-pen',
          onClick: () => showEditDataModal(row.id)
        },
        {
          type: 'error',
          label: '删除',
          icon: 'trash',
          onClick: () => deleteData(row.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据? 该操作不可恢复!'
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
    .get('system/user', {
      params: getDataListParams.value,
      meta: { operate: `加载${_baseName}列表` }
    })
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.systemUserList
      dataPagination.itemCount = res.data.total
    })
}
onMounted(getDataList)

const editDataRules: FormRules = {
  nickname: [{ required: true, message: '请输入用户昵称', trigger: 'blur' }]
}
const showEditDataModal = (id: string) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  http
    .get(`system/user/${id}`, { meta: { operate: `加载${_baseName}信息` } })
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
      .post(`system/user/update/${editDataId.value}`, editDataForm.value, {
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
    .post(`system/user/remove/${id}`, null, { meta: { operate: `删除${_baseName}` } })
    .then(() => {
      getDataList()
    })
}
</script>

<style lang="scss" scoped></style>
