<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block>
      <template #search>
        <n-input v-model:value="keyword" clearable placeholder="按名称 / 权限标识 / 菜单路由搜索">
          <template #prefix>
            <strix-icon icon="search" :size="16" />
          </template>
        </n-input>
      </template>
      <template #actions>
        <n-button type="primary" @click="() => showAddDataModal({ id: '', key: '' })"> 添加{{ _baseName }} </n-button>
        <n-button quaternary type="primary" @click="showColumnPanel = !showColumnPanel">
          <template #icon>
            <strix-icon icon="columns-3" :size="16" />
          </template>
          列配置
        </n-button>
        <n-button quaternary type="primary" @click="showExportDialog = true">
          <template #icon>
            <strix-icon icon="download" :size="16" />
          </template>
          导出
        </n-button>
      </template>
      <template #body>
        <n-alert closable title="提醒" type="warning"> 考虑到 UI 展示和性能问题，不建议配置超过 3 级菜单。 </n-alert>
      </template>
    </strix-block>

    <n-data-table
      v-model:expanded-row-keys="expandedRowKeys"
      :allow-checking-not-loaded="true"
      :cascade="false"
      :columns="visibleColumns"
      :scroll-x="scrollX"
      :data="filteredData"
      :loading="dataLoading"
      :row-key="rowKey"
      remote
      table-layout="fixed"
    />

    <strix-export-dialog
      v-model:show="showExportDialog"
      :columns="dataColumns as unknown as DataTableColumns"
      :data="dataRef || []"
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
      <n-tabs v-model:value="addDataModalType" :animated="true" type="segment">
        <n-tab-pane name="menu" tab="菜单">
          <n-form
            ref="addFormRef"
            :model="addForm"
            :rules="formRules"
            label-placement="left"
            label-width="auto"
            require-mark-placement="right-hanging"
          >
            <n-grid :cols="2" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
              <n-form-item-gi label="菜单名称" path="name" span="2 s:1">
                <n-input v-model:value="addForm.name" clearable placeholder="请输入菜单名称" />
              </n-form-item-gi>
              <n-form-item-gi label="父级菜单" path="parentId" span="2 s:1">
                <n-tree-select
                  v-model:value="addForm.parentId"
                  :options="menuTreeRef"
                  cascade
                  clearable
                  filterable
                  key-field="value"
                  placeholder="选择父级菜单"
                />
              </n-form-item-gi>
              <n-form-item-gi label="权限标识" path="key" span="2 s:2">
                <n-input v-model:value="addForm.key" clearable placeholder="请输入权限标识" />
              </n-form-item-gi>
              <n-form-item-gi label="菜单路由" path="url" span="2 s:2">
                <n-input v-model:value="addForm.url" clearable placeholder="请输入菜单路由" />
              </n-form-item-gi>
              <n-form-item-gi label="菜单图标" path="icon" span="2 s:1">
                <n-input v-model:value="addForm.icon" clearable placeholder="请输入菜单图标" />
              </n-form-item-gi>
              <n-form-item-gi label="菜单排序" path="sortValue" span="2 s:1">
                <n-input-number v-model:value="addForm.sortValue" clearable placeholder="请输入菜单排序" />
              </n-form-item-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="permission" tab="按钮 / 功能">
          <n-form
            ref="addPermissionFormRef"
            :model="addPermissionForm"
            :rules="permissionFormRules"
            label-placement="left"
            label-width="auto"
            require-mark-placement="right-hanging"
          >
            <n-grid :cols="2" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
              <n-form-item-gi label="权限名称" path="name" span="2 s:1">
                <n-input v-model:value="addPermissionForm.name" clearable placeholder="请输入权限名称" />
              </n-form-item-gi>
              <n-form-item-gi label="父级菜单" path="menuId" span="2 s:1">
                <n-tree-select
                  v-model:value="addPermissionForm.menuId"
                  :options="menuTreeRef"
                  cascade
                  clearable
                  filterable
                  key-field="value"
                  placeholder="选择父级菜单"
                />
              </n-form-item-gi>
              <n-form-item-gi label="权限标识" path="key" span="2 s:2">
                <n-input v-model:value="addPermissionForm.key" clearable placeholder="请输入权限标识" />
              </n-form-item-gi>
              <n-form-item-gi label="权限介绍" path="description" span="2 s:2">
                <n-input
                  v-model:value="addPermissionForm.description"
                  :autosize="{
                    minRows: 1,
                    maxRows: 5
                  }"
                  clearable
                  placeholder="请输入权限介绍"
                  type="textarea"
                />
              </n-form-item-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
      </n-tabs>

      <template #footer>
        <n-flex justify="end">
          <n-button @click="tryCloseAdd">取消</n-button>
          <n-button type="primary" :loading="submitLoading" @click="addData"> 确定</n-button>
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
        <n-tabs v-model:value="editDataModalType" :animated="true" type="segment">
          <n-tab-pane disabled name="menu" tab="菜单">
            <n-form
              ref="editFormRef"
              :model="editForm"
              :rules="formRules"
              label-placement="left"
              label-width="auto"
              require-mark-placement="right-hanging"
            >
              <n-grid :cols="2" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
                <n-form-item-gi label="菜单名称" path="name" span="2 s:1">
                  <n-input v-model:value="editForm.name" clearable placeholder="请输入菜单名称" />
                </n-form-item-gi>
                <n-form-item-gi label="父级菜单" path="parentId" span="2 s:1">
                  <n-tree-select
                    v-model:value="editForm.parentId"
                    :options="menuTreeRef"
                    cascade
                    clearable
                    filterable
                    key-field="value"
                    placeholder="选择父级菜单"
                  />
                </n-form-item-gi>
                <n-form-item-gi label="权限标识" path="key" span="2 s:2">
                  <n-input v-model:value="editForm.key" clearable placeholder="请输入权限标识" />
                </n-form-item-gi>
                <n-form-item-gi label="菜单路由" path="url" span="2 s:2">
                  <n-input v-model:value="editForm.url" clearable placeholder="请输入菜单路由" />
                </n-form-item-gi>
                <n-form-item-gi label="菜单图标" path="icon" span="2 s:1">
                  <n-input v-model:value="editForm.icon" clearable placeholder="请输入菜单图标" />
                </n-form-item-gi>
                <n-form-item-gi label="菜单排序" path="sortValue" span="2 s:1">
                  <n-input-number v-model:value="editForm.sortValue" clearable placeholder="请输入菜单排序" />
                </n-form-item-gi>
              </n-grid>
            </n-form>
          </n-tab-pane>
          <n-tab-pane disabled name="permission" tab="按钮 / 功能">
            <n-form
              ref="editPermissionFormRef"
              :model="editPermissionForm"
              :rules="permissionFormRules"
              label-placement="left"
              label-width="auto"
              require-mark-placement="right-hanging"
            >
              <n-grid :cols="2" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
                <n-form-item-gi label="权限名称" path="name" span="2 s:1">
                  <n-input v-model:value="editPermissionForm.name" clearable placeholder="请输入权限名称" />
                </n-form-item-gi>
                <n-form-item-gi label="父级菜单" path="menuId" span="2 s:1">
                  <n-tree-select
                    v-model:value="editPermissionForm.menuId"
                    :options="menuTreeRef"
                    cascade
                    clearable
                    filterable
                    key-field="value"
                    placeholder="选择父级菜单"
                  />
                </n-form-item-gi>
                <n-form-item-gi label="权限标识" path="key" span="2 s:2">
                  <n-input v-model:value="editPermissionForm.key" clearable placeholder="请输入权限标识" />
                </n-form-item-gi>
                <n-form-item-gi label="权限介绍" path="description" span="2 s:2">
                  <n-input
                    v-model:value="editPermissionForm.description"
                    :autosize="{
                      minRows: 1,
                      maxRows: 5
                    }"
                    clearable
                    placeholder="请输入权限介绍"
                    type="textarea"
                  />
                </n-form-item-gi>
              </n-grid>
            </n-form>
          </n-tab-pane>
        </n-tabs>
      </n-spin>

      <template #footer>
        <n-flex justify="end">
          <n-button @click="tryCloseEdit">取消</n-button>
          <n-button type="primary" :loading="submitLoading" @click="editData">确定</n-button>
        </n-flex>
      </template>
    </n-modal>
    <StrixCommentPanel v-bind="commentPanelProps" />
  </div>
</template>

<script lang="ts" setup>
import NebulaTag from '@/components/common/NebulaTag.vue'
import StrixBlock from '@/components/common/StrixBlock.vue'
import type { SystemMenuManageItem } from '@/api/menu'
import { menuApi } from '@/api/menu'
import { permissionApi } from '@/api/permission'
import type { TreeDataItem } from '@/api/types'
import { EventBus } from '@/plugins/event-bus'
import { useCrud } from '@/composables/useCrud'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { cloneDeep, kebabCase, pick } from 'lodash-es'
import { type DataTableColumns, type FormInst } from 'naive-ui'
import { useFormSchema } from '@/composables/useFormSchema'
import StrixIcon from '@/components/icon/StrixIcon.vue'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixCommentPanel from '@/components/common/StrixCommentPanel.vue'
import { useComment } from '@/composables/useComment'

// 本页面操作提示关键词
const _baseName = '系统菜单'
const showExportDialog = ref(false)
const {
  listParams,
  rowKey,
  addModal,
  addForm,
  addFormRef,
  editModal,
  editLoading,
  editId,
  initEditForm,
  editForm,
  editFormRef,
  submitLoading,
  resetForms,
  tryCloseAdd,
  tryCloseEdit,
  formRules
} = useCrud({
  list: {
    pageIndex: 1,
    pageSize: 10
  },
  fetchList: () => getDataList(),
  addForm: {
    name: null,
    key: null,
    url: '/',
    icon: null,
    parentId: null,
    sortValue: 0
  },
  editForm: {
    name: null,
    key: null,
    url: null,
    icon: null,
    parentId: null,
    sortValue: null
  },
  hooks: {
    onReset: () => {
      addDataModalType.value = 'menu'
      editDataModalType.value = 'menu'
      addPermissionForm.value = cloneDeep(initAddPermissionForm)
      editPermissionForm.value = cloneDeep(initEditPermissionForm)
    }
  },
  draftKey: 'SystemMenu',
  schemaDto: 'SystemMenuUpdateReq'
})

const { commentButton, panelProps: commentPanelProps } = useComment('SystemMenu')

const fetchAllData = createPaginatedFetcher(menuApi.urls.list, 'systemMenuList', () => listParams.value)

// 展示列信息
const dataColumns: DataTableColumns<SystemMenuManageItem> = [
  { key: 'name', title: '菜单名称', width: 240 },
  {
    key: 'type',
    title: '类型',
    align: 'center',
    width: 100,
    valueMap: { menu: '菜单', permission: '按钮' },
    render(row) {
      return h(NebulaTag, { type: row.type === 'menu' ? 'success' : 'info' }, () =>
        row.type === 'menu' ? '菜单' : '按钮'
      )
    }
  },
  { key: 'key', title: '权限标识', width: 240 },
  { key: 'url', title: '菜单路由', width: 240 },
  {
    key: 'icon',
    title: '菜单图标',
    align: 'center',
    width: 90,
    exportable: false,
    render(row) {
      return h(StrixIcon, { icon: kebabCase(row.icon), width: 24 })
    }
  },
  { key: 'sortValue', title: '菜单排序', width: 100, align: 'center' },
  {
    key: 'actions',
    title: '操作',
    width: 180,
    align: 'center',
    render(row) {
      return handleOperate([
        commentButton(row),
        {
          type: 'info',
          label: '添加',
          icon: 'plus',
          disabled: row.type === 'permission',
          onClick: () => showAddDataModal(row)
        },
        {
          type: 'warning',
          label: '编辑',
          icon: 'square-pen',
          onClick: () => showEditDataModal(row)
        },
        {
          type: 'error',
          label: '删除',
          icon: 'trash',
          onClick: () => deleteData(row),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据? 该操作不可恢复!'
        }
      ])
    }
  }
]

// 列可见性与排序
const {
  visibleColumns,
  scrollX,
  showPanel: showColumnPanel
} = useTableColumns(dataColumns as unknown as DataTableColumns)

// 加载列表
const dataRef = ref<SystemMenuManageItem[]>()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  menuApi
    .list(listParams.value)
    .then(({ data: res }) => {
      dataRef.value = res.data.systemMenuList
    })
    .finally(() => {
      dataLoading.value = false
    })
}
onMounted(getDataList)

// ---- 本地搜索（菜单一次性返回全部数据，无分页，按名称 / 权限标识 / 菜单路由本地过滤）----
const keyword = ref('')

// 单节点是否命中关键字（名称、权限标识、菜单路由）
const matchMenuNode = (node: SystemMenuManageItem, kw: string) => {
  return [node.name, node.key, node.url].some((field) => field?.toLowerCase().includes(kw))
}

// 过滤树：节点自身命中则保留整棵子树；否则若有子孙命中，保留该节点作为路径
const filterMenuTree = (nodes: SystemMenuManageItem[], kw: string): SystemMenuManageItem[] => {
  const result: SystemMenuManageItem[] = []
  for (const node of nodes) {
    if (matchMenuNode(node, kw)) {
      result.push(node)
    } else {
      const children = node.children?.length ? filterMenuTree(node.children, kw) : []
      if (children.length) result.push({ ...node, children })
    }
  }
  return result
}

const filteredData = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return dataRef.value
  return filterMenuTree(dataRef.value ?? [], kw)
})

// 受控展开：搜索时自动展开命中路径上的所有父节点，便于看到深层命中项
const expandedRowKeys = ref<string[]>([])
const collectExpandKeys = (nodes: SystemMenuManageItem[]): string[] => {
  const keys: string[] = []
  for (const node of nodes) {
    if (node.children?.length) {
      keys.push(node.id)
      keys.push(...collectExpandKeys(node.children))
    }
  }
  return keys
}

watch(keyword, (kw) => {
  expandedRowKeys.value = kw.trim() ? collectExpandKeys(filteredData.value ?? []) : []
})

const addDataModalType = ref('menu')
const showAddDataModal = ({ id, key }: { id: string; key: string }) => {
  if (id) {
    addForm.value.parentId = id
    addForm.value.key = key + ':'
  }
  if (key) {
    addPermissionForm.value.menuId = id
    addPermissionForm.value.key = key + ':'
  }

  addModal.value = true
}
const addData = () => {
  if (submitLoading.value) return
  if (addDataModalType.value === 'menu') {
    addFormRef.value?.validate((errors) => {
      if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

      submitLoading.value = true
      menuApi
        .create(addForm.value as any)
        .then(() => {
          resetForms()
          getDataList()
          EventBus.emit('refresh-menu')
        })
        .finally(() => {
          submitLoading.value = false
        })
    })
  } else {
    addPermissionFormRef.value?.validate((errors) => {
      if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

      submitLoading.value = true
      permissionApi
        .create(addPermissionForm.value)
        .then(() => {
          resetForms()
          getDataList()
        })
        .finally(() => {
          submitLoading.value = false
        })
    })
  }
}

const editDataModalType = ref('menu')
const showEditDataModal = (row: SystemMenuManageItem) => {
  editModal.value = true
  editDataModalType.value = row.type
  editLoading.value = true
  // 加载编辑前信息
  if (row.type === 'menu') {
    menuApi.detail(row.id).then(({ data: res }) => {
      editId.value = row.id
      const canUpdateFields = Object.keys(initEditForm!)
      editForm.value = pick(res.data, canUpdateFields)
      editLoading.value = false
    })
  } else {
    permissionApi.detail(row.id).then(({ data: res }) => {
      editId.value = row.id
      const canUpdateFields = Object.keys(initEditPermissionForm)
      editPermissionForm.value = pick(res.data, canUpdateFields)
      editLoading.value = false
    })
  }
}
const editData = () => {
  if (submitLoading.value) return
  if (editDataModalType.value === 'menu') {
    editFormRef.value?.validate((errors) => {
      if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

      submitLoading.value = true
      menuApi
        .update(editId.value, editForm.value as any)
        .then(() => {
          resetForms()
          getDataList()
          EventBus.emit('refresh-menu')
        })
        .finally(() => {
          submitLoading.value = false
        })
    })
  } else {
    editPermissionFormRef.value?.validate((errors) => {
      if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

      submitLoading.value = true
      permissionApi
        .update(editId.value, editPermissionForm.value)
        .then(() => {
          resetForms()
          getDataList()
        })
        .finally(() => {
          submitLoading.value = false
        })
    })
  }
}

const deleteData = ({ id, type }: { id: string; type: string }) => {
  if (type === 'menu') {
    menuApi.remove(id).then(() => {
      getDataList()
      EventBus.emit('refresh-menu')
    })
  } else {
    permissionApi.remove(id).then(() => {
      getDataList()
    })
  }
}

// 树形选择器数据
const menuTreeRef = ref<TreeDataItem[]>([])
const getMenuTree = () => {
  menuApi.tree().then(({ data: res }) => {
    menuTreeRef.value = res.data.tree
  })
}
onMounted(getMenuTree)

const initAddPermissionForm = {
  name: null,
  key: null,
  menuId: null,
  description: null
}
const addPermissionForm = ref<any>(cloneDeep(initAddPermissionForm))
const addPermissionFormRef = ref<FormInst | null>(null)
const permissionFormRules = useFormSchema('SystemPermissionUpdateReq', undefined, {
  menuId: {
    replace: [{ required: true, message: '请选择父级菜单', trigger: 'change' }]
  }
})

const initEditPermissionForm = {
  name: null,
  key: null,
  menuId: null,
  description: null
}
const editPermissionForm = ref<any>(cloneDeep(initEditPermissionForm))
const editPermissionFormRef = ref<FormInst | null>(null)
</script>

<style lang="scss" scoped></style>
