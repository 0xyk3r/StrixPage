<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input
                v-model:value="filterDataListParams.keyword"
                clearable
                placeholder="请输入搜索条件（角色名称）"
              />
              <n-button ghost type="primary" @click="getDataList"> 搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAdd()"> 添加{{ _baseName }}</n-button>
          </n-gi>
          <n-gi span="6 s:2 m:3" class="nebula-export__trigger-gi">
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
    </strix-block>

    <n-data-table
      :columns="visibleColumns"
      :data="filterDataList"
      :expanded-row-keys="dataExpandedRowKeys"
      :loading="dataLoading"
      :row-key="rowKey"
      table-layout="fixed"
      @update-expanded-row-keys="dataExpandedRowKeysChange"
    />

    <strix-export-dialog
      v-model:show="showExportDialog"
      :columns="dataColumns"
      :data="filterDataList || []"
      :fetch-all-data="fetchAllData"
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
        <n-form-item label="角色名称" path="name">
          <n-input v-model:value="addForm.name" clearable placeholder="请输入角色名称" />
        </n-form-item>
        <n-form-item label="地区权限类型" path="regionPermissionType">
          <n-select
            v-model:value="addForm.regionPermissionType"
            :options="systemRoleRegionPermissionTypeRef"
            clearable
            placeholder="请选择地区权限类型"
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
          <n-form-item label="角色名称" path="name">
            <n-input v-model:value="editForm.name" clearable placeholder="请输入角色名称" />
          </n-form-item>
          <n-form-item label="地区权限类型" path="regionPermissionType">
            <n-select
              v-model:value="editForm.regionPermissionType"
              :options="systemRoleRegionPermissionTypeRef"
              clearable
              placeholder="请选择地区权限类型"
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

    <n-modal
      v-model:show="editRoleMenusModalShow"
      :title="'修改' + _baseName + '菜单权限'"
      class="strix-form-modal"
      preset="card"
      size="huge"
      @after-leave="initModifyForm"
    >
      <n-spin :show="editRoleMenusLoading">
        <n-tree
          ref="editRoleMenusTreeRef"
          v-model:checked-keys="editRoleMenusCheckedKeys"
          :data="systemMenuTreeData"
          :render-prefix="editRoleMenusRenderPrefix"
          block-line
          checkable
          default-expand-all
          key-field="id"
          label-field="name"
        />
      </n-spin>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="editRoleMenusModalShow = false">取消</n-button>
          <n-button type="primary" @click="editRoleMenus"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import type { NTagType } from '@/@types/naive-ui'
import NebulaTag from '@/components/common/NebulaTag.vue'
import StrixBlock from '@/components/common/StrixBlock.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import type { SystemRoleItem } from '@/api/role'
import { roleApi } from '@/api/role'
import type { SystemMenuManageItem } from '@/api/menu'
import { menuApi } from '@/api/menu'
import { EventBus } from '@/plugins/event-bus'
import { useCrud } from '@/composables/useCrud'
import { useDict } from '@/composables/useDict.ts'
import { handleOperate } from '@/utils/strix-table-tool'
import { deepMap, flatTree } from '@/utils/strix-tools'
import { differenceWith, isEqual } from 'lodash-es'
import {
  type DataTableColumns,
  type FormRules,
  NEmpty,
  NGi,
  NGrid,
  NScrollbar,
  NSpin,
  NTabPane,
  NTabs,
  type TreeInst
} from 'naive-ui'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixIcon from '@/components/icon/StrixIcon.vue'
import { textField } from '@/utils/form-rules'

// 本页面操作提示关键词
const _baseName = '系统角色'
const showExportDialog = ref(false)
const fetchAllData = createPaginatedFetcher(roleApi.urls.list, 'systemRoleList', () => filterDataListParams.value)

// 加载字典
const systemRoleRegionPermissionTypeRef = useDict('SystemRoleRegionPermissionType')

const {
  addModal,
  addForm,
  addFormRef,
  editModal,
  editLoading,
  editForm,
  editFormRef,
  rowKey,
  showAdd,
  showEdit,
  submitAdd,
  submitEdit,
  deleteRow,
  resetForms,
  tryCloseAdd,
  tryCloseEdit
} = useCrud({
  fetchList: () => getDataList(),
  addForm: { name: null, regionPermissionType: null },
  editForm: { name: null, regionPermissionType: null },
  api: roleApi,
  draftKey: 'SystemRole'
})

const colorList: NTagType[] = ['info', 'warning', 'error', 'success']
const renderExpandMenuChildren = (row: any, children: any, colorIndex: number) => {
  if (!children) {
    return []
  }
  if (colorIndex == colorList.length - 1) {
    colorIndex = 0
  }
  const currentMenus: any[] = []
  children?.forEach((menu: any) => {
    if (menu.type === 'permission') {
      return currentMenus.push(
        h(NGrid, { xGap: 10, cols: 6 }, () => [
          h(NGi, { span: 1 }, () =>
            h(
              NebulaTag,
              {
                closable: true,
                onClose: () => removeRolePermission(row, menu.id)
              },
              () => menu.name
            )
          )
        ])
      )
    }
    const nextMenus = renderExpandMenuChildren(row, menu.children, colorIndex + 1)
    currentMenus.push(
      h(NGrid, { xGap: 10, cols: 6 }, () => [
        h(NGi, { span: 1 }, () =>
          h(
            NebulaTag,
            {
              type: colorList[colorIndex],
              closable: true,
              onClose: () => removeRoleMenu(row, menu.id)
            },
            () => menu.name
          )
        ),
        h(NGi, { span: 5 }, () => nextMenus)
      ])
    )
  })
  return currentMenus
}

// 展示列信息
const dataColumns: DataTableColumns = [
  {
    type: 'expand',
    renderExpand: (row: any) => {
      if (!row.expandTab) row.expandTab = 'menu'
      if (!row.loaded) return h(NSpin, { size: 'large', description: '加载中...' })

      const expandMenuChildrenVNode = renderExpandMenuChildren(row, row.menus, 0)
      if (expandMenuChildrenVNode.length == 0)
        expandMenuChildrenVNode.push(h(NEmpty, { description: 'TA好像没有可用菜单权限' }))

      return h(
        NTabs,
        {
          type: 'segment',
          animated: true,
          value: row.expandTab,
          'onUpdate:value': (value) => {
            row.expandTab = value
          }
        },
        () => [
          h(NTabPane, { name: 'menu', tab: '菜单权限 / 按钮权限', class: 'expand-menu-pane' }, () =>
            h(NScrollbar, { xScrollable: true }, () =>
              h('div', { style: 'min-width: 800px; padding-bottom: 10px;' }, [expandMenuChildrenVNode])
            )
          )
        ]
      )
    }
  },
  { key: 'name', width: 360, title: '角色名称' },
  {
    key: 'regionPermissionType',
    title: '地区权限类型',
    width: 180,
    align: 'center',
    dictName: 'SystemRoleRegionPermissionType',
    render(row: any) {
      return h(StrixTag, {
        value: row.regionPermissionType,
        dictName: 'SystemRoleRegionPermissionType'
      })
    }
  },
  {
    key: 'actions',
    title: '操作',
    width: 180,
    align: 'center',
    render(row: any) {
      return handleOperate([
        {
          type: 'info',
          label: '编辑菜单权限',
          icon: 'menu',
          disabled: row.builtin === 1,
          onClick: () => showEditRoleMenusModal(row)
        },
        {
          type: 'warning',
          label: '编辑',
          icon: 'square-pen',
          disabled: row.builtin === 1,
          onClick: () => showEdit(row.id)
        },
        {
          type: 'error',
          label: '删除',
          icon: 'trash',
          disabled: row.builtin === 1,
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
const dataRef = ref<SystemRoleItem[]>([])
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  roleApi.list({}).then(({ data: res }) => {
    dataLoading.value = false
    // 清除展开行
    dataExpandedRowKeys.value = []
    dataRef.value = res.data.systemRoleList
  })
}
onMounted(getDataList)
// 本地筛选数据
const filterDataListParams = ref({
  keyword: ''
})
const clearSearch = () => {
  filterDataListParams.value.keyword = ''
}
const filterDataList = computed(() =>
  dataRef.value?.filter((d) => {
    let filtered = true
    if (filterDataListParams.value.keyword && d.name.indexOf(filterDataListParams.value.keyword) < 0) filtered = false
    return filtered
  })
)

const dataExpandedRowKeys = ref<Array<string | number>>([])
const dataExpandedRowKeysChange = (value: Array<string | number>) => {
  // 只获取新展开的
  const diffs = differenceWith(value, dataExpandedRowKeys.value, isEqual)
  dataExpandedRowKeys.value = value
  diffs.forEach((diff) => {
    const row = dataRef.value.find((r) => r.id === diff)
    if (row) {
      roleApi.detail(row.id).then(({ data: res }) => {
        handleEditSuccessResponse(row, res.data)
      })
    }
  })
}

const addFormRules: FormRules = {
  name: textField('角色名称', { min: 2, max: 12 })
}

const editFormRules: FormRules = {
  name: textField('角色名称', { min: 2, max: 16 })
}

const removeRoleMenu = (row: any, menuId: string) => {
  roleApi.removeMenu(row.id, menuId).then(({ data: res }) => {
    handleEditSuccessResponse(row, res.data)
    EventBus.emit('refresh-menu')
  })
}
const removeRolePermission = (row: any, permissionId: string) => {
  roleApi.removePermission(row.id, permissionId).then(({ data: res }) => {
    handleEditSuccessResponse(row, res.data)
  })
}
const handleEditSuccessResponse = (row: any, data: any) => {
  row.menus = data.menus
  row.loaded = true
}

const systemMenuTreeData = ref<SystemMenuManageItem[]>([])
const getSystemMenuTreeData = () => {
  menuApi.list().then(({ data: res }) => {
    systemMenuTreeData.value = res.data.systemMenuList
  })
}
onMounted(getSystemMenuTreeData)

const initModifyForm = () => {
  editRoleMenusModalShow.value = false
  editRoleMenusLoading.value = false
  editRoleMenusRoleId = ''
  editRoleMenusRoleRow = null
  editRoleMenusCheckedKeys.value = []
}
const editRoleMenusModalShow = ref(false)
const editRoleMenusLoading = ref(false)
let editRoleMenusRoleId = ''
let editRoleMenusRoleRow: any = null
const editRoleMenusCheckedKeys = ref<string[]>([])
const showEditRoleMenusModal = (roleRow: any) => {
  editRoleMenusLoading.value = true
  editRoleMenusModalShow.value = true
  // 加载编辑前信息
  roleApi.detail(roleRow.id).then(({ data: res }) => {
    editRoleMenusRoleId = res.data.id
    editRoleMenusRoleRow = roleRow
    editRoleMenusCheckedKeys.value = deepMap(res.data.menus, 'id') as string[]
    editRoleMenusCheckedKeys.value.push(...(deepMap(res.data.permissions, 'id') as string[]))
    editRoleMenusLoading.value = false
  })
}
const editRoleMenusTreeRef = ref<TreeInst | null>(null)
const editRoleMenus = () => {
  const flatMenu: any[] = flatTree(systemMenuTreeData.value)

  const menuIds: string[] = []
  const permissionIds: string[] = []

  const checkedIds: any[] = [
    ...(editRoleMenusTreeRef.value?.getCheckedData().keys || []),
    ...(editRoleMenusTreeRef.value?.getIndeterminateData().keys || [])
  ]

  flatMenu.forEach((m) => {
    if (checkedIds.includes(m.id)) {
      if (m.type === 'menu') {
        menuIds.push(m.id)
      } else {
        permissionIds.push(m.id)
      }
    }
  })

  roleApi
    .updateMenu(editRoleMenusRoleId, {
      menuIds: menuIds.join(','),
      permissionIds: permissionIds.join(',')
    })
    .then(({ data: res }) => {
      editRoleMenusModalShow.value = false
      handleEditSuccessResponse(editRoleMenusRoleRow, res.data)
      EventBus.emit('refresh-menu')
    })
}
const editRoleMenusRenderPrefix = ({ option: row }: { option: any }) => {
  return h(
    NebulaTag,
    { type: row.type === 'menu' ? 'success' : 'info', bordered: false, size: 'tiny' },
    { default: () => (row.type === 'menu' ? '菜单' : '按钮') }
  )
}
</script>

<style lang="scss" scoped>
::v-deep(.expand-menu-pane) {
  .n-grid:not(:last-child) {
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--n-border-color);
  }

  .n-grid {
    align-items: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

::v-deep(.expand-permission-pane) {
  .nebula-tag:not(:last-child) {
    margin: 0 8px 8px 0;
  }
}
</style>
