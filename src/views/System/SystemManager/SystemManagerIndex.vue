<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block
      cleanable
      :active-filters="activeFilters"
      :active-filter-count="activeFilterCount"
      @clear="clearSearch"
      @clear-filter="clearFilter"
    >
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input v-model:value="listParams.keyword" clearable placeholder="请输入搜索条件（昵称、账号）"
                     @keydown.enter="handleKeywordEnter" />
          </n-gi>
          <n-gi span="6 s:3 m:4" class="nebula-export__trigger-gi">
            <n-button type="primary" @click="showAdd()"> 添加{{ _baseName }}</n-button>
            <n-button quaternary type="primary" @click="showColumnPanel = !showColumnPanel">
              <template #icon><strix-icon icon="columns-3" :size="16" /></template>
              列配置
            </n-button>
            <n-button quaternary type="primary" @click="showExportDialog = true">
              <template #icon><strix-icon icon="download" :size="16" /></template>
              导出
            </n-button>
            <n-button v-auth="'system:manager:add'" quaternary type="primary" @click="showImportDialog = true">
              <template #icon>
                <strix-icon icon="upload" :size="16" />
              </template>
              导入
            </n-button>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="listParams" :show-feedback="false" label-placement="left" label-width="auto">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi label="人员角色" path="roleId" span="6 s:3 m:2">
            <n-select
              v-model:value="listParams.roleId"
              :options="systemRoleSelectList"
              clearable
              placeholder="请选择人员角色"
              @update:value="getDataList"
            />
          </n-form-item-gi>
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
      :columns="(dataColumns as unknown as DataTableColumns)"
      :data="dataRef || []"
      :fetch-all-data="fetchAllData"
      :selected-rows="selectedRows"
      :title="_baseName"
    />

    <StrixImportDialog
      v-model:show="showImportDialog"
      :fields="managerImportFields"
      :import-api="managerApi.batchCreate"
      title="系统人员"
      @done="getDataList()"
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
        :rules="formRules"
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
          <n-button type="primary" :loading="submitLoading" @click="submitAdd"> 确定</n-button>
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
          :rules="formRules"
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
          <n-button type="primary" :loading="submitLoading" @click="submitEdit"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>
    <StrixCommentPanel v-bind="commentPanelProps" />
  </div>
</template>

<script lang="ts" setup>
import StrixBlock from '@/components/common/StrixBlock.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import NebulaTag from '@/components/common/NebulaTag.vue'
import type { SystemManagerItem } from '@/api/manager'
import { managerApi } from '@/api/manager'
import { regionApi } from '@/api/region'
import { roleApi } from '@/api/role'
import type { CascaderDataItem, SelectDataItem } from '@/api/types'
import { useQuickMenuStore } from '@/stores/quick-menu'
import { useCrud } from '@/composables/useCrud'
import { useDict } from '@/composables/useDict.ts'
import { handleOperate } from '@/utils/strix-table-tool'
import { deepSearch } from '@/utils/strix-tools'
import { differenceWith, find, isEqual } from 'lodash-es'
import { type DataTableColumns, NCheckbox, NCheckboxGroup, NFlex, NH6, NSpin } from 'naive-ui'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import StrixImportDialog from '@/components/common/StrixImportDialog.vue'
import type { ImportFieldConfig } from '@/composables/useTableImport'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import StrixBatchBar from '@/components/common/StrixBatchBar.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixIcon from '@/components/icon/StrixIcon.vue'
import StrixCommentPanel from '@/components/common/StrixCommentPanel.vue'
import { useComment } from '@/composables/useComment'

const quickMenuStore = useQuickMenuStore()

// 本页面操作提示关键词
const _baseName = '系统人员'
const showExportDialog = ref(false)
const showImportDialog = ref(false)

const managerImportFields = computed<ImportFieldConfig[]>(() => [
  { key: 'nickname', label: '昵称', required: true },
  { key: 'loginName', label: '登录账号', required: true },
  { key: 'loginPassword', label: '登录密码', required: true },
  {
    key: 'status',
    label: '账户状态',
    required: true,
    type: 'number',
    dictName: 'SystemManagerStatus',
    dictOptions: systemManagerStatusRef.value?.map((d) => ({ label: d.label, value: d.value })) ?? []
  },
  {
    key: 'type',
    label: '账户类型',
    required: true,
    type: 'number',
    dictName: 'SystemManagerType',
    dictOptions: systemManagerTypeRef.value?.map((d) => ({ label: d.label, value: d.value })) ?? []
  },
  { key: 'regionId', label: '所属地区' }
])

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
  submitLoading,
  deleteRow,
  resetForms,
  tryCloseAdd,
  tryCloseEdit,
  formRules,
  activeFilters,
  activeFilterCount,
  clearFilter,
  handleKeywordEnter
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
  batch: { disabledKey: 'builtin' },
  filters: [
    { key: 'keyword', label: '关键词' },
    { key: 'roleId', label: '人员角色', options: systemRoleSelectList },
    { key: 'status', label: '人员状态', dictName: 'SystemManagerStatus' },
    { key: 'type', label: '人员类型', dictName: 'SystemManagerType' }
  ],
  urlSync: true,
  schemaDto: 'SystemManagerUpdateReq'
})

const { commentButton, panelProps: commentPanelProps } = useComment('SystemManager')

const fetchAllData = createPaginatedFetcher(managerApi.urls.list, 'systemManagerList', () => listParams.value)

type ExpandedManagerRow = SystemManagerItem & {
  roleIdArray?: Array<string | number>
}

// 展示列信息
const dataColumns: DataTableColumns<ExpandedManagerRow> = [
  ...(selectionColumn ? [selectionColumn] : []),
  {
    type: 'expand',
    renderExpand: (row) => {
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
    render(row) {
      return h(StrixTag, { value: row.status, dictName: 'SystemManagerStatus' })
    }
  },
  {
    key: 'type',
    title: '账户类型',
    width: 120,
    align: 'center',
    dictName: 'SystemManagerType',
    render(row) {
      return h(StrixTag, { value: row.type, dictName: 'SystemManagerType' })
    }
  },
  {
    key: 'regionId',
    title: '所属地区',
    width: 180,
    align: 'center',
    valueResolver: (val: string) => managerRegionName(val),
    render(row) {
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
    render(row) {
      return handleOperate([
        commentButton(row),
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
const { visibleColumns, showPanel: showColumnPanel } = useTableColumns(dataColumns as unknown as DataTableColumns)

// 加载列表
const dataRef = ref<ExpandedManagerRow[]>()
const dataLoading = ref(true)
const selectedRows = computed(() =>
  dataRef.value?.filter((row) => checkedRowKeys.value.includes(row.id)) ?? []
)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  managerApi
    .list(listParams.value)
    .then(({ data: res }) => {
      // 清除展开行
      dataExpandedRowKeys.value = []
      dataRef.value = res.data.systemManagerList
      pagination.itemCount = res.data.total
    })
    .finally(() => {
      dataLoading.value = false
    })
}
onMounted(getDataList)
const dataExpandedRowKeys = ref<Array<string | number>>([])
const dataExpandedRowKeysChange = (value: Array<string | number>) => {
  // 只获取新展开的
  const diffs = differenceWith(value, dataExpandedRowKeys.value, isEqual)
  dataExpandedRowKeys.value = value
  diffs.forEach((diff) => {
    const row = find(dataRef.value, { id: diff }) as ExpandedManagerRow | undefined
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
      if (row) row.roleIdArray = res.data.roleIds?.split(',')
    })
}


</script>

<style lang="scss" scoped></style>
