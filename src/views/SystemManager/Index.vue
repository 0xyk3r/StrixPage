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
              <n-input v-model:value="getDataListParams.keyword" placeholder="请输入搜索条件（昵称、账号）" clearable />
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
      <n-form :model="getDataListParams" label-placement="left" label-width="auto" :show-feedback="false">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi span="6 s:3 m:2" label="管理人员状态" path="managerStatus">
            <n-select v-model:value="getDataListParams.managerStatus" :options="managerStatusList"
              placeholder="请选择管理人员状态" />
          </n-form-item-gi>
          <n-form-item-gi span="6 s:3 m:2" label="管理人员类型" path="managerType">
            <n-select v-model:value="getDataListParams.managerType" :options="managerTypeList"
              placeholder="请选择管理人员类型" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table :loading="dataLoading" :columns="dataColumns" :data="dataData" :pagination="dataPagination"
      :row-key="dataRowKey" :expanded-row-keys="dataExpandedRowKeys"
      @updateExpandedRowKeys="dataExpandedRowKeysChange" />

    <n-modal v-model:show="addDataModalShow" preset="card" :title="'添加' + funName" class="strix-model-primary"
      :class="isSmallWindow ? 'strix-full-modal':''" size="huge" @after-leave="initDataForm">
      <n-form ref="addDataFormRef" :model="addDataForm" :rules="addDataRules" label-placement="left" label-width="auto"
        require-mark-placement="right-hanging">
        <n-form-item label="管理人员昵称" path="nickname">
          <n-input v-model:value="addDataForm.nickname" placeholder="请输入管理人员昵称" />
        </n-form-item>
        <n-form-item label="登录账号" path="loginName">
          <n-input v-model:value="addDataForm.loginName" placeholder="请输入登录账号" />
        </n-form-item>
        <n-form-item label="登录密码" path="loginPassword">
          <n-input v-model:value="addDataForm.loginPassword" placeholder="请输入登录密码" />
        </n-form-item>
        <n-form-item label="管理人员状态" path="managerStatus">
          <n-select v-model:value="addDataForm.managerStatus" :options="managerStatusList" placeholder="请选择管理人员状态" />
        </n-form-item>
        <n-form-item label="管理人员类型" path="managerType">
          <n-select v-model:value="addDataForm.managerType" :options="managerTypeList" placeholder="请选择管理人员类型" />
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

    <n-modal v-model:show="editDataModalShow" preset="card" :title="'修改' + funName" class="strix-model-primary"
      :class="isSmallWindow ? 'strix-full-modal':''" size="huge" @after-leave="initDataForm">
      <n-spin :show="editDataFormLoading">
        <n-form ref="editDataFormRef" :model="editDataForm" :rules="editDataRules" label-placement="left"
          label-width="auto" require-mark-placement="right-hanging">
          <n-form-item label="管理人员昵称" path="nickname">
            <n-input v-model:value="editDataForm.nickname" placeholder="请输入管理人员昵称" />
          </n-form-item>
          <n-form-item label="登录账号" path="loginName">
            <n-input v-model:value="editDataForm.loginName" placeholder="请输入登录账号" />
          </n-form-item>
          <n-form-item label="登录密码" path="loginPassword">
            <n-input v-model:value="editDataForm.loginPassword" placeholder="请输入登录密码" />
          </n-form-item>
          <n-form-item label="管理人员状态" path="managerStatus">
            <n-select v-model:value="editDataForm.managerStatus" :options="managerStatusList" placeholder="请选择管理人员状态" />
          </n-form-item>
          <n-form-item label="管理人员类型" path="managerType">
            <n-select v-model:value="editDataForm.managerType" :options="managerTypeList" placeholder="请选择管理人员类型" />
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
import { useQuickMenuStore } from '@/stores/quick-menu'
import useCurrentInstance from '@/utils/strix-instance-tool'
import { createStrixNotify } from '@/utils/strix-notify'
import { deepSearch } from '@/utils/strix-tools'
import { Icon } from '@iconify/vue'
import _ from 'lodash'
import { NButton, NCheckbox, NCheckboxGroup, NDataTable, NH6, NPopconfirm, NSpace, NSpin, NTag } from 'naive-ui'
import { h, nextTick, onActivated, onDeactivated, onMounted, reactive, ref } from 'vue'

const { proxy } = useCurrentInstance()
const quickMenuStore = useQuickMenuStore()

// 本页面操作提示关键词
const funName = '系统人员'

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
  current: 1,
  size: 10
})
// 展示列信息
const dataColumns = [
  {
    type: "expand",
    renderExpand: (row) => {
      if (!row.roleIdArray) {
        return h(NSpin, { size: 'large', description: '加载中...' })
      }
      const rolesCheckboxRender = []
      systemRoleSelectList.value.forEach(role => {
        rolesCheckboxRender.push(
          h(NCheckbox,
            {
              value: role.id,
              label: role.name
            }
          )
        )
      })
      return h('div',
        { style: 'padding: 5px 10px;' },
        [
          h(NH6,
            {
              prefix: 'bar',
              alignText: true,
            },
            () => '人员角色设置'
          ),
          h(NCheckboxGroup,
            {
              value: row.roleIdArray,
              'onUpdate:value': (value) => changeSystemManagerRoles(row.id, value)
            },
            () =>
              h(NSpace,
                {
                  itemStyle: 'display: flex;'
                },
                () => rolesCheckboxRender
              )
          )]
      )
    }
  }, {
    key: 'nickname',
    title: '昵称',
    width: 120
  }, {
    key: 'loginName',
    title: '登录名',
    width: 120
  }, {
    key: 'managerStatus',
    title: '账户状态',
    width: 100,
    render(row) {
      let tagType = 'default'
      switch (row.managerStatus) {
        case 0:
          tagType = 'error'
          break
        case 1:
          tagType = 'info'
          break
      }
      return h(NTag, {
        type: tagType,
        bordered: false
      }, {
        default: () => _.find(managerStatusList, function (o) { return o.value === row.managerStatus })?.label
      })
    }
  }, {
    key: 'managerType',
    title: '账户类型',
    width: 100,
    render(row) {
      let tagType = 'default'
      switch (row.managerType) {
        case 1:
          tagType = 'success'
          break
        case 2:
          tagType = 'info'
          break
      }
      return h(NTag, {
        type: tagType,
        bordered: false
      }, {
        default: () => _.find(managerTypeList, function (o) { return o.value === row.managerType })?.label
      })
    }
  }, {
    key: 'regionId',
    title: '地区权限',
    width: 140,
    render(row) {
      let tagType = 'default'
      let tagText = ''
      if (row.managerType == 1) {
        tagType = 'success'
        tagText = '所有地区'
      } else {
        tagType = 'info'
        tagText = managerRegionName(row.regionId)
      }
      return h(NTag, {
        type: tagType,
        bordered: false
      }, {
        default: () => tagText
      })
    }
  }, {
    key: 'createTime',
    title: '创建时间',
    width: 160
  }, {
    title: '操作',
    width: 160,
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
  // 清除展开行
  proxy.$http.get('system/manager', { params: getDataListParams.value }).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('warning', `获取${funName}列表失败`, res.msg)
    }
    dataLoading.value = false
    dataExpandedRowKeys.value = []
    dataData.value = res.data.systemManagerList
    dataPagination.itemCount = res.data.total
  })
}
onMounted(getDataList)
const dataRowKey = (rowData) => rowData.id
const dataExpandedRowKeys = ref([])
const dataExpandedRowKeysChange = (value) => {
  // 只获取新展开的
  const diffs = _.differenceWith(value, dataExpandedRowKeys.value, _.isEqual);
  dataExpandedRowKeys.value = value
  diffs.forEach(diff => {
    const row = _.find(dataData.value, { id: diff })
    if (row) {
      proxy.$http.get(`system/manager/${row.id}`).then(({ data: res }) => {
        if (res.code !== 200) {
          return createStrixNotify('error', '获取角色的详细信息失败', res.msg)
        }
        row.roleIdArray = res.data.roleIds.split(',')
      })
    }
  })
}
const clearSearch = () => {
  getDataListParams.value.keyword = ''
  getDataList()
}

// 加载所有地区级联选项
const systemRegionCascaderOptions = ref([])
const getSystemRegionSelectList = () => {
  proxy.$http.get('system/region/cascader').then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('warning', `加载${funName}下拉列表失败`, res.msg)
    }
    systemRegionCascaderOptions.value = res.data.options
  })
}
onMounted(getSystemRegionSelectList)
// 加载所有人员角色选项
const systemRoleSelectList = ref([])
const getSystemRoleSelectList = () => {
  proxy.$http.get('system/role/select').then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', '加载系统角色下拉列表失败', res.msg)
    }
    systemRoleSelectList.value = res.data.options
  })
}
onMounted(getSystemRoleSelectList)
const managerStatusList = [
  { value: '', label: '未选择' },
  { value: 0, label: '禁止登录' },
  { value: 1, label: '正常用户' }
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
  const row = _.find(dataData.value, { id: systemManagerId })
  proxy.$http.post(`system/manager/modify/${systemManagerId}`, {
    field: 'role',
    value: roles.join(',')
  }).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', `更变${funName}角色失败`, res.msg)
    } else {
      createStrixNotify('success', '提示信息', `更变${funName}角色成功`)
      row.roleIdArray = res.data.roleIds.split(',')
    }
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
    {
      required: true,
      message: '请输入管理人员昵称',
      trigger: 'blur'
    }, {
      min: 2,
      max: 16,
      message: '管理人员昵称长度需在2-16之间',
      trigger: 'blur'
    }
  ],
  loginName: [
    {
      required: true,
      message: '请输入登录账号',
      trigger: 'blur'
    }, {
      min: 4,
      max: 16,
      message: '登录账号长度需在4-16之间',
      trigger: 'blur'
    }
  ],
  loginPassword: [
    {
      required: true,
      message: '请输入登录密码',
      trigger: 'blur'
    }, {
      min: 6,
      max: 16,
      message: '登录密码长度需在6-16之间',
      trigger: 'blur'
    }
  ],
  managerStatus: [
    {
      trigger: 'change',
      validator(rule, value) {
        if (value === '') {
          return new Error('请选择管理人员状态')
        }
        return true
      }
    }
  ],
  managerType: [
    {
      trigger: 'change',
      validator(rule, value) {
        if (value === '') {
          return new Error('请选择管理人员类型')
        }
        return true
      }
    }
  ]
}
const showAddDataModal = (id) => {
  getSystemRegionSelectList()
  if (id) {
    addDataForm.value.parentId = id
  }
  addDataModalShow.value = true
}
const addData = () => {
  proxy.$refs.addDataFormRef.validate((errors) => {
    if (!errors) {
      proxy.$http.post('system/manager/update', addDataForm.value).then(({ data: res }) => {
        if (res.code !== 200) {
          return createStrixNotify('warning', `添加${funName}失败`, res.msg)
        }
        createStrixNotify('success', '操作成功', `添加${funName}成功`)
        initDataForm()
        getDataList()
      })
    } else {
      createStrixNotify('warning', '表单校验失败', '请检查表单中的错误提示并修改')
    }
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
    {
      required: true,
      message: '请输入管理人员昵称',
      trigger: 'blur'
    }, {
      min: 2,
      max: 16,
      message: '管理人员昵称长度需在2-16之间',
      trigger: 'blur'
    }
  ],
  loginName: [
    {
      required: true,
      message: '请输入登录账号',
      trigger: 'blur'
    }, {
      min: 4,
      max: 16,
      message: '登录账号长度需在4-16之间',
      trigger: 'blur'
    }
  ],
  loginPassword: [
    {
      min: 6,
      max: 16,
      message: '登录密码长度需在6-16之间',
      trigger: 'blur'
    }
  ],
  managerStatus: [
    {
      trigger: 'change',
      validator(rule, value) {
        if (value === '') {
          return new Error('请选择管理人员状态')
        }
        return true
      }
    }
  ],
  managerType: [
    {
      trigger: 'change',
      validator(rule, value) {
        if (value === '') {
          return new Error('请选择管理人员类型')
        }
        return true
      }
    }
  ]
}
const showEditDataModal = (id) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  getSystemRegionSelectList()
  // 加载编辑前信息
  proxy.$http.get(`system/manager/${id}`).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', `查询${funName}信息失败`, res.msg)
    }
    const canUpdateFields = []
    _.forOwn(editDataForm.value, function (value, key) {
      canUpdateFields.push(key)
    })
    editDataId = id
    editDataForm.value = _.pick(res.data, canUpdateFields)
    editDataFormLoading.value = false
  })
}
const editData = () => {
  proxy.$refs.editDataFormRef.validate((errors) => {
    if (!errors) {
      proxy.$http.post(`system/manager/update/${editDataId}`, editDataForm.value).then(({ data: res }) => {
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
  proxy.$http.post(`system/manager/remove/${id}`).then(({ data: res }) => {
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
  name: 'SystemManagerIndex'
}
</script>

<style lang="scss" scoped>

</style>
