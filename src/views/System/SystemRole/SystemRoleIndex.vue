<template>
  <div>
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
            <n-button type="primary" @click="showAddDataModal()"> 添加{{ _baseName }}</n-button>
          </n-gi>
        </n-grid>
      </template>
    </strix-block>

    <n-data-table
      :columns="dataColumns"
      :data="filterDataList"
      :expanded-row-keys="dataExpandedRowKeys"
      :loading="dataLoading"
      :row-key="dataRowKey"
      table-layout="fixed"
      @update-expanded-row-keys="dataExpandedRowKeysChange"
    />

    <n-modal
      v-model:show="addDataModalShow"
      :title="'添加' + _baseName"
      class="strix-form-modal"
      preset="card"
      size="huge"
      @after-leave="initDataForm"
    >
      <n-form
        ref="addDataFormRef"
        :model="addDataForm"
        :rules="addDataRules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="角色名称" path="name">
          <n-input v-model:value="addDataForm.name" clearable placeholder="请输入角色名称" />
        </n-form-item>
        <n-form-item label="地区权限类型" path="regionPermissionType">
          <n-select
            v-model:value="addDataForm.regionPermissionType"
            :options="systemRoleRegionPermissionTypeRef"
            clearable
            placeholder="请选择地区权限类型"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="addDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="addData"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>

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
          <n-form-item label="角色名称" path="name">
            <n-input v-model:value="editDataForm.name" clearable placeholder="请输入角色名称" />
          </n-form-item>
          <n-form-item label="地区权限类型" path="regionPermissionType">
            <n-select
              v-model:value="editDataForm.regionPermissionType"
              :options="systemRoleRegionPermissionTypeRef"
              clearable
              placeholder="请选择地区权限类型"
            />
          </n-form-item>
        </n-form>
      </n-spin>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="editDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="editData"> 确定</n-button>
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
import StrixBlock from '@/components/common/StrixBlock.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import { http } from '@/plugins/axios'
import { EventBus } from '@/plugins/event-bus'
import { usePage } from '@/composables/usePage.ts'
import { useDict } from '@/composables/useDict.ts'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { deepMap, flatTree } from '@/utils/strix-tools'
import { differenceWith, find, isEqual, pick } from 'lodash-es'
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
  NTag,
  type TreeInst
} from 'naive-ui'

// 本页面操作提示关键词
const _baseName = '系统角色'

// 加载字典
const systemRoleRegionPermissionTypeRef = useDict('SystemRoleRegionPermissionType')

const {
  addDataModalShow,
  addDataForm,
  addDataFormRef,
  editDataModalShow,
  editDataFormLoading,
  editDataId,
  initEditDataForm,
  editDataForm,
  editDataFormRef,
  initDataForm
} = usePage(
  {},
  () => {
    getDataList()
  },
  {
    name: null,
    regionPermissionType: null
  },
  {
    name: null,
    regionPermissionType: null
  }
)

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
            h(NTag, { closable: true, onClose: () => removeRolePermission(row, menu.id) }, () => menu.name)
          )
        ])
      )
    }
    const nextMenus = renderExpandMenuChildren(row, menu.children, colorIndex + 1)
    currentMenus.push(
      h(NGrid, { xGap: 10, cols: 6 }, () => [
        h(NGi, { span: 1 }, () =>
          h(
            NTag,
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
          onClick: () => showEditDataModal(row.id)
        },
        {
          type: 'error',
          label: '删除',
          icon: 'trash',
          disabled: row.builtin === 1,
          onClick: () => deleteData(row.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据? 该操作不可恢复!'
        }
      ])
    }
  }
]

// 加载列表
const dataRef = ref<any[]>([])
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  http.get('system/role', { meta: { operate: `加载${_baseName}列表` } }).then(({ data: res }) => {
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

const dataRowKey = (row: any) => row.id
const dataExpandedRowKeys = ref<Array<string | number>>([])
const dataExpandedRowKeysChange = (value: Array<string | number>) => {
  // 只获取新展开的
  const diffs = differenceWith(value, dataExpandedRowKeys.value, isEqual)
  dataExpandedRowKeys.value = value
  diffs.forEach((diff) => {
    const row = find(dataRef.value, { id: diff })
    if (row) {
      http.get(`system/role/${row.id}`, { meta: { operate: `加载${_baseName}信息` } }).then(({ data: res }) => {
        handleEditSuccessResponse(row, res.data)
      })
    }
  })
}

const addDataRules: FormRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 12, message: '角色名称长度需在2-12之间', trigger: 'blur' }
  ]
}
const showAddDataModal = () => {
  addDataModalShow.value = true
}
const addData = () => {
  addDataFormRef.value?.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    http.post('system/role/update', addDataForm.value, { meta: { operate: `修改${_baseName}` } }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const editDataRules: FormRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 12, message: '角色名称长度需在2-12之间', trigger: 'blur' }
  ]
}
const showEditDataModal = (id: string) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  http.get(`system/role/${id}`, { meta: { operate: `加载${_baseName}信息` } }).then(({ data: res }) => {
    editDataId.value = id
    const canUpdateFields = Object.keys(initEditDataForm)
    editDataForm.value = pick(res.data, canUpdateFields)
    editDataFormLoading.value = false
  })
}
const editData = () => {
  editDataFormRef.value?.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    http
      .post(`system/role/update/${editDataId.value}`, editDataForm.value, {
        meta: { operate: `修改${_baseName}` }
      })
      .then(() => {
        initDataForm()
        getDataList()
      })
  })
}

const deleteData = (id: string) => {
  http.post(`system/role/remove/${id}`, null, { meta: { operate: `删除${_baseName}` } }).then(() => {
    getDataList()
  })
}

const removeRoleMenu = (row: any, menuId: string) => {
  http
    .post(`system/role/remove/${row.id}/menu/${menuId}`, null, {
      meta: { operate: '移除角色菜单权限' }
    })
    .then(({ data: res }) => {
      handleEditSuccessResponse(row, res.data)
      EventBus.emit('refresh-menu')
    })
}
const removeRolePermission = (row: any, permissionId: string) => {
  http
    .post(`system/role/remove/${row.id}/permission/${permissionId}`, null, {
      meta: { operate: '移除角色系统权限' }
    })
    .then(({ data: res }) => {
      handleEditSuccessResponse(row, res.data)
    })
}
const handleEditSuccessResponse = (row: any, data: any) => {
  row.menus = data.menus
  row.loaded = true
}

const systemMenuTreeData = ref([])
const getSystemMenuTreeData = () => {
  http.get('system/menu', { meta: { operate: `加载系统菜单树` } }).then(({ data: res }) => {
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
const editRoleMenusCheckedKeys = ref<any[]>([])
const showEditRoleMenusModal = (roleRow: any) => {
  editRoleMenusLoading.value = true
  editRoleMenusModalShow.value = true
  // 加载编辑前信息
  http.get(`system/role/${roleRow.id}`, { meta: { operate: `加载${_baseName}菜单信息` } }).then(({ data: res }) => {
    editRoleMenusRoleId = res.data.id
    editRoleMenusRoleRow = roleRow
    editRoleMenusCheckedKeys.value = deepMap(res.data.menus, 'id')
    editRoleMenusCheckedKeys.value.push(...deepMap(res.data.permissions, 'id'))
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

  http
    .post(
      `system/role/update/${editRoleMenusRoleId}/menu`,
      {
        menuIds: menuIds.join(','),
        permissionIds: permissionIds.join(',')
      },
      { meta: { operate: `更改${_baseName}菜单权限` } }
    )
    .then(({ data: res }) => {
      editRoleMenusModalShow.value = false
      handleEditSuccessResponse(editRoleMenusRoleRow, res.data)
      EventBus.emit('refresh-menu')
    })
}
const editRoleMenusRenderPrefix = ({ option: row }: { option: any }) => {
  return h(
    NTag,
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
  .n-tag:not(:last-child) {
    margin: 0 8px 8px 0;
  }
}
</style>
