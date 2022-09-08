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
          <n-gi span="6 m:2 l:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" placeholder="请输入搜索条件（昵称、手机号码）" clearable />
              <n-button type="primary" ghost @click="getDataList">
                搜索
              </n-button>
            </n-input-group>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="getDataListParams" label-placement="left" label-width="auto" :show-feedback="false">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi span="6 m:2 l:2" label="用户状态" path="status">
            <n-select v-model:value="getDataListParams.status" :options="userStatusOptions" placeholder="请选择用户状态" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>
    <n-data-table :remote="true" :loading="dataLoading" :columns="dataColumns" :data="dataData"
      :pagination="dataPagination" :row-key="dataRowKey" />

    <n-modal v-model:show="editDataModalShow" preset="card" :title="'修改' + funName" class="strix-model-primary"
      size="huge">
      <n-form ref="editDataFormRef" :model="editDataForm" :rules="editDataRules" label-placement="left"
        label-width="auto" require-mark-placement="right-hanging">
        <n-form-item label="用户昵称" path="nickname">
          <n-input v-model:value="editDataForm.nickname" placeholder="请输入用户昵称" />
        </n-form-item>
        <n-form-item label="手机号码" path="phoneNumber">
          <n-input v-model:value="editDataForm.phoneNumber" placeholder="请输入手机号码" />
        </n-form-item>
        <n-form-item label="用户状态" path="status">
          <n-select v-model:value="editDataForm.status" :options="userStatusOptions" placeholder="请选择用户状态" />
        </n-form-item>
      </n-form>

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
import { h, onMounted, reactive, ref } from 'vue'
import { createStrixNotify } from '@/utils/strix-notify'
import { NButton, NTag, NDataTable, NPopconfirm } from 'naive-ui'
import { Icon } from '@iconify/vue'
import useCurrentInstance from '@/utils/strix-instance-tool'
import _ from 'lodash'

const { proxy } = useCurrentInstance()

// 本页面操作提示关键词
const funName = '系统用户'

// 获取列表请求参数
const getDataListParams = ref({
  keyword: '',
  status: '',
  parentId: '',
  current: 1,
  size: 10
})
// 展示列信息
const dataColumns = [
  {
    key: 'nickname',
    title: '用户昵称',
    width: 160,
    fixed: 'left'
  }, {
    key: 'phoneNumber',
    title: '手机号码',
    width: 220
  }, {
    key: 'status',
    title: '用户状态',
    width: 120,
    render(row) {
      let tagType = 'default'
      switch (row.status) {
        case 0:
          tagType = 'error'
          break
        case 1:
          tagType = 'primary'
          break
      }
      return h(NTag, {
        type: tagType,
        bordered: false
      }, {
        default: () => _.find(userStatusOptions, function (o) { return o.value === row.status })?.label
      })
    }
  }, {
    title: '操作',
    width: 200,
    render(row) {
      return [
        h(NButton,
          {
            size: 'medium',
            type: 'warning',
            style: 'margin-right: 10px',
            onClick: () => showEditDataModal(row.id)
          },
          () => h(Icon, { icon: 'ion:create-outline' })
        ),
        h(NPopconfirm,
          {
            onPositiveClick: () => deleteData(row.id)
          }, {
          trigger: () => h(NButton,
            {
              size: 'medium',
              type: 'error',
              style: 'margin-right: 10px'
            },
            () => h(Icon, { icon: 'ion:trash-outline' })
          ),
          default: () => '是否确认删除这条数据? 该操作不可恢复!'
        }
        )
      ]
    }
  }
]
// 分页配置
const dataPagination = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 50, 100],
  prefix({ itemCount }) {
    return `共 ${itemCount} 条`
  },
  onChange: (page) => {
    dataPagination.page = page
    getDataListParams.value.current = page
    getDataList()
  },
  onUpdatePageSize: (pageSize) => {
    dataPagination.pageSize = pageSize
    dataPagination.page = 1
    getDataListParams.value.size = pageSize
    getDataListParams.value.current = 1
    getDataList()
  }
})
// 加载列表
const dataData = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  proxy.$http.get('system/user', { params: getDataListParams.value }).then(({ data: res }) => {
    if (res.code !== 200) {
      createStrixNotify('warning', `获取${funName}列表失败`, res.msg)
    }
    dataLoading.value = false
    dataData.value = res.data.systemUserList
    dataPagination.itemCount = res.data.total
  })
}
onMounted(() => {
  getDataList()
})
const dataRowKey = (rowData) => rowData.id
const clearSearch = () => {
  getDataListParams.value.keyword = ''
  getDataListParams.value.status = ''
  getDataList()
}

const userStatusOptions = [
  { value: '', label: '未选择' },
  { value: 0, label: '禁止登录' },
  { value: 1, label: '正常用户' }
]

const initDataForm = () => {
  editDataModalShow.value = false
  editDataId = ''
  editDataForm.value = {
    nickname: '',
    status: '',
    phoneNumber: ''
  }
}

const editDataModalShow = ref(false)
let editDataId = ''
const editDataForm = ref({
  nickname: '',
  status: '',
  phoneNumber: ''
})
const editDataRules = {
  nickname: [{
    required: true,
    message: '请输入用户昵称'
  }]
}
const showEditDataModal = (id) => {
  // 加载编辑前信息
  proxy.$http.get(`system/user/${id}`).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', `查询${funName}信息失败`, res.msg)
    }
    const canUpdateFields = []
    _.forOwn(editDataForm.value, function (value, key) {
      canUpdateFields.push(key)
    })
    editDataId = id
    editDataForm.value = _.pick(res.data, canUpdateFields)
  })
  editDataModalShow.value = true
}
const editData = () => {
  proxy.$refs.editDataFormRef.validate((errors) => {
    if (!errors) {
      proxy.$http.post(`system/user/update/${editDataId}`, editDataForm.value).then(({ data: res }) => {
        if (res.code !== 200) {
          return createStrixNotify('warning', `修改${funName}失败`, res.msg)
        }
        createStrixNotify('success', '操作成功', `修改${funName}成功`)
        initDataForm()
        getDataList()
      })
    } else {
      createStrixNotify('warning', '表单校验失败', '请检查表单中的错误提示并修改')
    }
  })
}

const deleteData = (id) => {
  proxy.$http.post(`system/user/remove/${id}`).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', `删除${funName}失败`, res.msg)
    }
    createStrixNotify('success', '提示信息', `删除${funName}成功`)
    getDataList()
  })
}

</script>
<script>
export default {
  name: 'SystemUserIndex'
}
</script>

<style lang="scss" scoped>
</style>
