<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="12" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="4">
            <n-input-group>
              <n-input v-model:value="listParams.keyword" clearable placeholder="请输入搜索条件（昵称、账号）" />
              <n-button ghost type="primary" @click="getDataList"> 搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi span="3">
            <n-form :model="listParams" :show-feedback="false" label-placement="left" label-width="auto">
              <n-form-item-gi label="人员角色" path="roleId">
                <n-select
                  v-model:value="listParams.roleId"
                  :options="systemRoleSelectList"
                  clearable
                  placeholder="请选择人员角色"
                  @update:value="getDataList"
                />
              </n-form-item-gi>
            </n-form>
          </n-gi>
          <n-gi :span="2">
            <n-button type="primary" @click="showAdd()"> 添加{{ _baseName }}</n-button>
          </n-gi>
          <n-gi span="12 s:3" class="nebula-export__trigger-gi">
            <n-button quaternary type="primary" @click="showColumnPanel = !showColumnPanel">
              <template #icon><strix-icon icon="columns-3" :size="16" /></template>
              列配置
            </n-button>
            <n-button quaternary type="primary" @click="showExportDialog = true">
              <template #icon><strix-icon icon="download" :size="16" /></template>
              导出
            </n-button>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="listParams" :show-feedback="false" label-placement="left" label-width="auto">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi label="人员状态" path="status" span="6 s:3 m:2">
            <n-select
              v-model:value="listParams.status"
              :options="systemManagerStatusRef"
              placeholder="请选择人员状态"
            />
          </n-form-item-gi>
          <n-form-item-gi label="人员类型" path="type" span="6 s:3 m:2">
            <n-select v-model:value="listParams.type" :options="systemManagerTypeRef" placeholder="请选择人员类型" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table
      :checked-row-keys="checkedRowKeys"
      :columns="visibleColumns"
      :data="dataRef"
      :expanded-row-keys="dataExpandedRowKeys"
      :loading="dataLoading"
      :pagination="pagination"
      :row-key="rowKey"
      remote
      table-layout="fixed"
      @update-expanded-row-keys="dataExpandedRowKeysChange"
      @update:checked-row-keys="onCheckedRowKeysChange"
    />

    <StrixBatchBar :count="selectedCount" @clear="clearSelection">
      <n-popselect
        :options="systemManagerStatusRef"
        @update:value="(v: number) => batchModify('status', String(v))"
      >
        <n-button size="small" quaternary type="primary">
          <template #icon>
            <strix-icon icon="toggle-left" :size="14" />
          </template>
          批量修改状态
        </n-button>
      </n-popselect>
      <n-button size="small" quaternary type="error" @click="batchDelete">
        <template #icon>
          <strix-icon icon="trash-2" :size="14" />
        </template>
        批量删除
      </n-button>
    </StrixBatchBar>

    <strix-export-dialog
      v-model:show="showExportDialog"
      :columns="dataColumns"
      :data="dataRef || []"
      :fetch-all-data="fetchAllData"
      :selected-rows="selectedRows"
      :title="_baseName"
    />

    <strix-column-panel v-model:show="showColumnPanel" />

    <n-modal
      :show="addModal"
      :title="'添加' + _baseName"
      class="strix-form-modal"
      preset="card"
      size="huge"
      @update:show="tryCloseAdd"
      @after-leave="resetForms"
    >
      <n-form
        ref="addFormRef"
        :model="addForm"
        :rules="addFormRules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="管理人员昵称" path="nickname">
          <n-input
            v-model:value="addForm.nickname"
            :maxlength="20"
            clearable
            placeholder="请输入管理人员昵称"
            show-count
          />
        </n-form-item>
        <n-form-item label="登录账号" path="loginName">
          <n-input
            v-model:value="addForm.loginName"
            :maxlength="20"
            clearable
            placeholder="请输入登录账号"
            show-count
          />
        </n-form-item>
        <n-form-item label="登录密码" path="loginPassword">
          <n-input
            v-model:value="addForm.loginPassword"
            type="password"
            show-password-on="click"
            clearable
            placeholder="请输入登录密码"
          />
        </n-form-item>
        <n-form-item label="管理人员状态" path="status">
          <n-select
            v-model:value="addForm.status"
            :options="systemManagerStatusRef"
            clearable
            placeholder="请选择管理人员状态"
          />
        </n-form-item>
        <n-form-item label="管理人员类型" path="type">
          <n-select
            v-model:value="addForm.type"
            :options="systemManagerTypeRef"
            clearable
            placeholder="请选择管理人员类型"
          />
        </n-form-item>
        <n-form-item label="所属地区" path="regionId">
          <n-tree-select
            v-model:value="addForm.regionId"
            :options="systemRegionCascaderOptions"
            cascade
            clearable
            filterable
            key-field="value"
            placeholder="请选择所属地区"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="tryCloseAdd">取消</n-button>
          <n-button type="primary" @click="submitAdd"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>

    <n-modal
      :show="editModal"
      :title="'修改' + _baseName"
      class="strix-form-modal"
      preset="card"
      size="huge"
      @update:show="tryCloseEdit"
      @after-leave="resetForms"
    >
      <n-spin :show="editLoading">
        <n-form
          ref="editFormRef"
          :model="editForm"
          :rules="editFormRules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="管理人员昵称" path="nickname">
            <n-input
              v-model:value="editForm.nickname"
              :maxlength="20"
              clearable
              placeholder="请输入管理人员昵称"
              show-count
            />
          </n-form-item>
          <n-form-item label="登录账号" path="loginName">
            <n-input
              v-model:value="editForm.loginName"
              :maxlength="20"
              clearable
              placeholder="请输入登录账号"
              show-count
            />
          </n-form-item>
          <n-form-item label="登录密码" path="loginPassword">
            <n-input
              v-model:value="editForm.loginPassword"
              type="password"
              show-password-on="click"
              clearable
              placeholder="请输入登录密码"
            />
          </n-form-item>
          <n-form-item label="管理人员状态" path="status">
            <n-select
              v-model:value="editForm.status"
              :options="systemManagerStatusRef"
              clearable
              placeholder="请选择管理人员状态"
            />
          </n-form-item>
          <n-form-item label="管理人员类型" path="type">
            <n-select
              v-model:value="editForm.type"
              :options="systemManagerTypeRef"
              clearable
              placeholder="请选择管理人员类型"
            />
          </n-form-item>
          <n-form-item label="所属地区" path="regionId">
            <n-tree-select
              v-model:value="editForm.regionId"
              :options="systemRegionCascaderOptions"
              cascade
              clearable
              filterable
              key-field="value"
              placeholder="请选择所属地区"
            />
          </n-form-item>
        </n-form>
      </n-spin>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="tryCloseEdit">取消</n-button>
          <n-button type="primary" @click="submitEdit"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import StrixBlock from '@/components/common/StrixBlock.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import NebulaTag from '@/components/common/NebulaTag.vue'
import { managerApi } from '@/api/manager'
import { regionApi } from '@/api/region'
import { roleApi } from '@/api/role'
import type { CascaderDataItem, SelectDataItem } from '@/api/types'
import { useQuickMenuStore } from '@/stores/quick-menu'
import { useCrud } from '@/composables/useCrud'
import { useDict } from '@/composables/useDict.ts'
import { handleOperate } from '@/utils/strix-table-tool'
import { selectField, textField } from '@/utils/form-rules'
import { deepSearch } from '@/utils/strix-tools'
import { differenceWith, find, isEqual } from 'lodash-es'
import { type DataTableColumns, type FormRules, NCheckbox, NCheckboxGroup, NFlex, NH6, NSpin } from 'naive-ui'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import StrixBatchBar from '@/components/common/StrixBatchBar.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixIcon from '@/components/icon/StrixIcon.vue'

const quickMenuStore = useQuickMenuStore()

// 本页面操作提示关键词
const _baseName = '系统人员'
const showExportDialog = ref(false)

onActivated(() => {
  quickMenuStore.addQuickMenu({
    id: 'RefreshSystemManagersRole',
    icon: 'refresh-cw',
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

// 加载字典
const systemManagerStatusRef = useDict('SystemManagerStatus')
const systemManagerTypeRef = useDict('SystemManagerType')

// 加载所有地区级联选项
const systemRegionCascaderOptions = ref<CascaderDataItem[]>([])
const getSystemRegionSelectList = () => {
  regionApi.cascader().then(({ data: res }) => {
    systemRegionCascaderOptions.value = res.data.options
  })
}
onMounted(getSystemRegionSelectList)

// 加载所有人员角色选项
const systemRoleSelectList = ref<SelectDataItem[]>([])
const getSystemRoleSelectList = () => {
  roleApi.select().then(({ data: res }) => {
    systemRoleSelectList.value = res.data.options
  })
}
onMounted(getSystemRoleSelectList)

const {
  listParams,
  clearSearch,
  pagination,
  rowKey,
  checkedRowKeys,
  onCheckedRowKeysChange,
  clearSelection,
  selectedCount,
  selectionColumn,
  batchDelete,
  batchModify,
  addModal,
  addForm,
  addFormRef,
  editModal,
  editLoading,
  editForm,
  editFormRef,
  showAdd,
  showEdit,
  submitAdd,
  submitEdit,
  deleteRow,
  resetForms,
  tryCloseAdd,
  tryCloseEdit
} = useCrud({
  list: { keyword: null, status: null, type: null, roleId: null, pageIndex: 1, pageSize: 10 },
  fetchList: () => getDataList(),
  addForm: {
    nickname: null,
    loginName: null,
    loginPassword: null,
    status: 1,
    type: 1,
    regionId: null
  },
  editForm: {
    nickname: null,
    loginName: null,
    loginPassword: null,
    status: null,
    type: null,
    regionId: null
  },
  api: managerApi,
  hooks: {
    beforeShowAdd: () => getSystemRegionSelectList(),
    beforeShowEdit: () => getSystemRegionSelectList()
  },
  draftKey: 'SystemManager',
  batch: { disabledKey: 'builtin' }
})

const fetchAllData = createPaginatedFetcher(managerApi.urls.list, 'systemManagerList', () => listParams.value)

// 展示列信息
const dataColumns: DataTableColumns = [
  ...(selectionColumn ? [selectionColumn] : []),
  {
    type: 'expand',
    renderExpand: (row: any) => {
      if (!row.roleIdArray) {
        return h(NSpin, { size: 'large', description: '加载中...' })
      }
      const rolesCheckboxRender = systemRoleSelectList.value.map(({ value, label }) =>
        h(NCheckbox, {
          value,
          label
        })
      )
      return h('div', { style: 'padding: 5px 10px;' }, [
        h(NH6, { prefix: 'bar', alignText: true }, () => '人员角色设置'),
        h(
          NCheckboxGroup,
          {
            value: row.roleIdArray,
            'onUpdate:value': (value) => changeSystemManagerRoles(row.id, value)
          },
          () => h(NFlex, {}, () => rolesCheckboxRender)
        )
      ])
    }
  },
  { key: 'nickname', title: '昵称', width: 160 },
  { key: 'loginName', title: '登录名', width: 160 },
  {
    key: 'status',
    title: '账户状态',
    width: 120,
    align: 'center',
    dictName: 'SystemManagerStatus',
    render(row: any) {
      return h(StrixTag, { value: row.status, dictName: 'SystemManagerStatus' })
    }
  },
  {
    key: 'type',
    title: '账户类型',
    width: 120,
    align: 'center',
    dictName: 'SystemManagerType',
    render(row: any) {
      return h(StrixTag, { value: row.type, dictName: 'SystemManagerType' })
    }
  },
  {
    key: 'regionId',
    title: '所属地区',
    width: 180,
    align: 'center',
    valueResolver: (val: any) => managerRegionName(val),
    render(row: any) {
      const tagText = managerRegionName(row.regionId)
      return h(
        NebulaTag,
        { type: 'info', bordered: false },
        {
          default: () => tagText
        }
      )
    }
  },
  { key: 'createdTime', title: '创建时间', width: 180 },
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
          onClick: () => showEdit(row.id)
        },
        {
          type: 'error',
          label: '删除',
          icon: 'trash',
          onClick: () => deleteRow(row.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据? 该操作不可恢复!'
        }
      ])
    }
  }
]

// 列可见性与排序
const { visibleColumns, showPanel: showColumnPanel } = useTableColumns(dataColumns)

// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
const selectedRows = computed(() =>
  dataRef.value?.filter((row: any) => checkedRowKeys.value.includes(row.id)) ?? []
)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  managerApi.list(listParams.value).then(({ data: res }) => {
    dataLoading.value = false
    // 清除展开行
    dataExpandedRowKeys.value = []
    dataRef.value = res.data.systemManagerList
    pagination.itemCount = res.data.total
  })
}
onMounted(getDataList)
const dataExpandedRowKeys = ref<Array<string | number>>([])
const dataExpandedRowKeysChange = (value: Array<string | number>) => {
  // 只获取新展开的
  const diffs = differenceWith(value, dataExpandedRowKeys.value, isEqual)
  dataExpandedRowKeys.value = value
  diffs.forEach((diff) => {
    const row = find(dataRef.value, { id: diff })
    if (row) {
      managerApi.detail(row.id).then(({ data: res }) => {
        row.roleIdArray = res.data.roleIds?.split(',')
      })
    }
  })
}

const managerRegionName = (regionId: string) => {
  const result = deepSearch(systemRegionCascaderOptions.value, regionId, 'value')
  return result ? result.label : '未设置'
}

// 更改系统人员角色
const changeSystemManagerRoles = (systemManagerId: string, roles: Array<string | number>) => {
  const row = find(dataRef.value, { id: systemManagerId })
  managerApi
    .modify(systemManagerId, {
      field: 'role',
      value: roles.join(',')
    })
    .then(({ data: res }) => {
      row.roleIdArray = res.data.roleIds?.split(',')
    })
}

const passwordComplexityValidator = {
  validator: (_rule: any, value: string) => {
    if (!value) return true
    let categories = 0
    if (/[A-Z]/.test(value)) categories++
    if (/[a-z]/.test(value)) categories++
    if (/\d/.test(value)) categories++
    if (/[^A-Za-z0-9]/.test(value)) categories++
    return categories >= 3
  },
  message: '密码必须包含大写字母、小写字母、数字、特殊字符中的至少3类',
  trigger: 'blur'
}

const addFormRules: FormRules = {
  nickname: textField('管理人员昵称', { min: 2, max: 20 }),
  loginName: textField('登录账号', { min: 4, max: 20 }),
  loginPassword: [...textField('登录密码', { min: 8, max: 32 }), passwordComplexityValidator],
  status: selectField('管理人员状态'),
  type: selectField('管理人员类型')
}

const editFormRules: FormRules = {
  nickname: textField('管理人员昵称', { min: 2, max: 20 }),
  loginName: textField('登录账号', { min: 4, max: 20 }),
  loginPassword: [
    ...textField('登录密码', {
      required: false,
      min: 8,
      max: 32
    }),
    passwordComplexityValidator
  ],
  status: selectField('管理人员状态'),
  type: selectField('管理人员类型')
}
</script>

<style lang="scss" scoped></style>
