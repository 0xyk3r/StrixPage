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
              <n-input v-model:value="getDataListParams.keyword" placeholder="请输入搜索条件（昵称、账号）" clearable />
              <n-button type="primary" ghost @click="getDataList">
                搜索
              </n-button>
            </n-input-group>
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAddDataModal()">
              添加{{ _baseName }}
            </n-button>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="getDataListParams" label-placement="left" label-width="auto" :show-feedback="false">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi span="6 s:3 m:2" label="管理人员状态" path="managerStatus">
            <n-select v-model:value="getDataListParams.managerStatus" :options="managerStatusList"
              placeholder="请选择管理人员状态" />
          </n-form-item-gi>
          <n-form-item-gi span="6 s:3 m:2" label="管理人员类型" path="managerType">
            <n-select v-model:value="getDataListParams.managerType" :options="managerTypeList" placeholder="请选择管理人员类型" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table :loading="dataLoading" :columns="dataColumns" :data="dataRef" :pagination="dataPagination"
      :row-key="dataRowKey" :expanded-row-keys="dataExpandedRowKeys"
      @update-expanded-row-keys="dataExpandedRowKeysChange" />

    <n-modal v-model:show="addDataModalShow" preset="card" :title="'添加' + _baseName" class="strix-model-primary"
      :class="isSmallWindow ? 'strix-full-modal' : ''" size="huge" @after-leave="initDataForm">
      <n-form ref="addDataFormRef" :model="addDataForm" :rules="addDataRules" label-placement="left" label-width="auto"
        require-mark-placement="right-hanging">
        <n-form-item label="管理人员昵称" path="nickname">
          <n-input v-model:value="addDataForm.nickname" placeholder="请输入管理人员昵称" clearable />
        </n-form-item>
        <n-form-item label="登录账号" path="loginName">
          <n-input v-model:value="addDataForm.loginName" placeholder="请输入登录账号" clearable />
        </n-form-item>
        <n-form-item label="登录密码" path="loginPassword">
          <n-input v-model:value="addDataForm.loginPassword" placeholder="请输入登录密码" clearable />
        </n-form-item>
        <n-form-item label="管理人员状态" path="managerStatus">
          <n-select v-model:value="addDataForm.managerStatus" :options="managerStatusList" placeholder="请选择管理人员状态"
            clearable />
        </n-form-item>
        <n-form-item label="管理人员类型" path="managerType">
          <n-select v-model:value="addDataForm.managerType" :options="managerTypeList" placeholder="请选择管理人员类型"
            clearable />
        </n-form-item>
        <n-form-item v-if="addDataForm.managerType == 2" label="平台地区权限" path="regionId">
          <n-tree-select v-model:value="addDataForm.regionId" :options="systemRegionCascaderOptions"
            placeholder="请选择平台地区权限" cascade clearable filterable check-strategy="all" key-field="value" />
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
          <n-form-item label="管理人员昵称" path="nickname">
            <n-input v-model:value="editDataForm.nickname" placeholder="请输入管理人员昵称" clearable />
          </n-form-item>
          <n-form-item label="登录账号" path="loginName">
            <n-input v-model:value="editDataForm.loginName" placeholder="请输入登录账号" clearable />
          </n-form-item>
          <n-form-item label="登录密码" path="loginPassword">
            <n-input v-model:value="editDataForm.loginPassword" placeholder="请输入登录密码" clearable />
          </n-form-item>
          <n-form-item label="管理人员状态" path="managerStatus">
            <n-select v-model:value="editDataForm.managerStatus" :options="managerStatusList" placeholder="请选择管理人员状态"
              clearable />
          </n-form-item>
          <n-form-item label="管理人员类型" path="managerType">
            <n-select v-model:value="editDataForm.managerType" :options="managerTypeList" placeholder="请选择管理人员类型"
              clearable />
          </n-form-item>
          <n-form-item v-if="editDataForm.managerType == 2" label="平台地区权限" path="regionId">
            <n-tree-select v-model:value="editDataForm.regionId" :options="systemRegionCascaderOptions"
              placeholder="请选择平台地区权限" cascade clearable filterable check-strategy="all" key-field="value" />
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
import { createPagination } from '@/plugins/pagination.js'
import { useQuickMenuStore } from '@/stores/quick-menu'
import { createStrixNotify } from '@/utils/strix-notify'
import { handleOperate } from '@/utils/strix-table-tool'
import { deepSearch } from '@/utils/strix-tools'
import { differenceWith, find, forOwn, isEqual, pick } from 'lodash'
import { NButton, NCheckbox, NCheckboxGroup, NDataTable, NH6, NSpace, NSpin, NTag } from 'naive-ui'
import { getCurrentInstance, h, nextTick, onActivated, onDeactivated, onMounted, ref } from 'vue'

const { proxy } = getCurrentInstance()
const quickMenuStore = useQuickMenuStore()

// 本页面操作提示关键词
const _baseName = '系统人员'

defineProps({
  isSmallWindow: {
    type: Boolean, default: false
  }
})

onActivated(() => {
  quickMenuStore.addQuickMenu({
    id: 'RefreshSystemManagersRole',
    icon: 'ion:refresh',
    color: 'primary',
    name: '刷新角色',
    tips: '强制刷新所有系统人员的角色列表',
    callback: () => {
      const temp = dataExpandedRowKeys.value
      dataExpandedRowKeys.value = []
      nextTick(() => {
        dataExpandedRowKeysChange(temp)
      })
    }
  })
})
onDeactivated(() => {
  quickMenuStore.delQuickMenu('RefreshSystemManagersRole')
})

// 获取列表请求参数
const getDataListParams = ref({
  keyword: '',
  managerStatus: '',
  managerType: '',
  pageIndex: 1,
  pageSize: 10
})
const clearSearch = () => {
  getDataListParams.value.keyword = ''
  getDataListParams.value.managerStatus = ''
  getDataListParams.value.managerType = ''
  getDataList()
}
// 展示列信息
const dataColumns = [
  {
    type: "expand",
    renderExpand: (row) => {
      if (!row.roleIdArray) {
        return h(NSpin, { size: 'large', description: '加载中...' })
      }
      const rolesCheckboxRender = systemRoleSelectList.value.map(({ value, label }) => h(NCheckbox, { value, label }))
      return h('div', { style: 'padding: 5px 10px;' }, [
        h(NH6, { prefix: 'bar', alignText: true }, () => '人员角色设置'),
        h(NCheckboxGroup, { value: row.roleIdArray, 'onUpdate:value': (value) => changeSystemManagerRoles(row.id, value) }, () =>
          h(NSpace, { itemStyle: 'display: flex;' }, () => rolesCheckboxRender)
        )
      ])
    }
  },
  { key: 'nickname', title: '昵称', width: 120 },
  { key: 'loginName', title: '登录名', width: 120 },
  {
    key: 'managerStatus', title: '账户状态', width: 100,
    render(row) {
      return h(NTag, { type: row.managerStatus === 0 ? 'error' : 'info', bordered: false }, {
        default: () => find(managerStatusList, o => o.value === row.managerStatus)?.label
      })
    }
  },
  {
    key: 'managerType', title: '账户类型', width: 100,
    render(row) {
      return h(NTag, { type: row.managerType === 1 ? 'success' : 'info', bordered: false }, {
        default: () => find(managerTypeList, o => o.value === row.managerType)?.label
      })
    }
  },
  {
    key: 'regionId', title: '地区权限', width: 140,
    render(row) {
      const tagText = row.managerType === 1 ? '所有地区' : managerRegionName(row.regionId);
      return h(NTag, { type: row.managerType === 1 ? 'success' : 'info', bordered: false }, {
        default: () => tagText
      })
    }
  },
  { key: 'createTime', title: '创建时间', width: 160 },
  {
    title: '操作',
    width: 160,
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
  proxy.$http.get('system/manager', { params: getDataListParams.value, operate: `加载${_baseName}列表` }).then(({ data: res }) => {
    dataLoading.value = false
    // 清除展开行
    dataExpandedRowKeys.value = []
    dataRef.value = res.data.systemManagerList
    dataPagination.itemCount = res.data.total
  })
}
onMounted(getDataList)
const dataRowKey = (rowData) => rowData.id
const dataExpandedRowKeys = ref([])
const dataExpandedRowKeysChange = (value) => {
  // 只获取新展开的
  const diffs = differenceWith(value, dataExpandedRowKeys.value, isEqual);
  dataExpandedRowKeys.value = value
  diffs.forEach(diff => {
    const row = find(dataRef.value, { id: diff })
    if (row) {
      proxy.$http.get(`system/manager/${row.id}`, { operate: '加载角色详细信息' }).then(({ data: res }) => {
        row.roleIdArray = res.data.roleIds?.split(',')
      })
    }
  })
}

// 加载所有地区级联选项
const systemRegionCascaderOptions = ref([])
const getSystemRegionSelectList = () => {
  proxy.$http.get('system/region/cascader', { operate: `加载${_baseName}下拉列表` }).then(({ data: res }) => {
    systemRegionCascaderOptions.value = res.data.options
  })
}
onMounted(getSystemRegionSelectList)
// 加载所有人员角色选项
const systemRoleSelectList = ref([])
const getSystemRoleSelectList = () => {
  proxy.$http.get('system/role/select', { operate: '加载系统角色下拉列表' }).then(({ data: res }) => {
    systemRoleSelectList.value = res.data.options
  })
}
onMounted(getSystemRoleSelectList)
const managerStatusList = [
  { value: '', label: '未选择' },
  { value: 1, label: '正常用户' },
  { value: 2, label: '禁止登录' }
]
const managerTypeList = [
  { value: '', label: '未选择' },
  { value: 1, label: '超级账户' },
  { value: 2, label: '平台账户' }
]
const managerRegionName = (regionId) => {
  return deepSearch(systemRegionCascaderOptions.value, regionId, 'value').label
}

const changeSystemManagerRoles = (systemManagerId, roles) => {
  const row = find(dataRef.value, { id: systemManagerId })
  proxy.$http.post(`system/manager/modify/${systemManagerId}`, {
    field: 'role',
    value: roles.join(',')
  }, { operate: `更变${_baseName}角色` }).then(({ data: res }) => {
    row.roleIdArray = res.data.roleIds?.split(',')
  })
}

const initDataForm = () => {
  addDataModalShow.value = false
  editDataModalShow.value = false
  editDataFormLoading.value = false
  addDataForm.value = {
    nickname: '',
    loginName: '',
    loginPassword: '',
    managerStatus: 1,
    managerType: 1,
    regionId: ''
  }
  editDataId = ''
  editDataForm.value = {
    nickname: '',
    loginName: '',
    loginPassword: '',
    managerStatus: '',
    managerType: '',
    regionId: ''
  }
}

const addDataModalShow = ref(false)
const addDataForm = ref({
  nickname: '',
  loginName: '',
  loginPassword: '',
  managerStatus: 1,
  managerType: 1,
  regionId: ''
})
const addDataRules = {
  nickname: [
    { required: true, message: '请输入管理人员昵称', trigger: 'blur' },
    { min: 2, max: 16, message: '管理人员昵称长度需在2-16之间', trigger: 'blur' }
  ],
  loginName: [
    { required: true, message: '请输入登录账号', trigger: 'blur' },
    { min: 4, max: 16, message: '登录账号长度需在4-16之间', trigger: 'blur' }
  ],
  loginPassword: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { min: 6, max: 16, message: '登录密码长度需在6-16之间', trigger: 'blur' }
  ],
  managerStatus: [
    { type: 'number', required: true, message: '请选择管理人员状态', trigger: 'change' }
  ],
  managerType: [
    { type: 'number', required: true, message: '请选择管理人员类型', trigger: 'change' }
  ]
}
const showAddDataModal = () => {
  getSystemRegionSelectList()
  addDataModalShow.value = true
}
const addData = () => {
  proxy.$refs.addDataFormRef.validate((errors) => {
    if (errors) return createStrixNotify('error', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post('system/manager/update', addDataForm.value, { operate: `添加${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const editDataModalShow = ref(false)
const editDataFormLoading = ref(false)
let editDataId = ''
const editDataForm = ref({
  nickname: '',
  loginName: '',
  loginPassword: '',
  managerStatus: '',
  managerType: '',
  regionId: ''
})
const editDataRules = {
  nickname: [
    { required: true, message: '请输入管理人员昵称', trigger: 'blur' },
    { min: 2, max: 16, message: '管理人员昵称长度需在2-16之间', trigger: 'blur' }
  ],
  loginName: [
    { required: true, message: '请输入登录账号', trigger: 'blur' },
    { min: 4, max: 16, message: '登录账号长度需在4-16之间', trigger: 'blur' }
  ],
  loginPassword: [
    { min: 6, max: 16, message: '登录密码长度需在6-16之间', trigger: 'blur' }
  ],
  managerStatus: [
    { type: 'number', required: true, message: '请选择管理人员状态', trigger: 'change' }
  ],
  managerType: [
    { type: 'number', required: true, message: '请选择管理人员类型', trigger: 'change' }
  ]
}
const showEditDataModal = (id) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  getSystemRegionSelectList()
  // 加载编辑前信息
  proxy.$http.get(`system/manager/${id}`, { operate: `加载${_baseName}信息` }).then(({ data: res }) => {
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

    proxy.$http.post(`system/manager/update/${editDataId}`, editDataForm.value, { operate: `修改${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const deleteData = (id) => {
  proxy.$http.post(`system/manager/remove/${id}`, null, { operate: `删除${_baseName}` }).then(() => {
    getDataList()
  })
}

</script>
<script>
export default {
  name: 'SystemManagerIndex'
}
</script>

<style lang="scss" scoped></style>
