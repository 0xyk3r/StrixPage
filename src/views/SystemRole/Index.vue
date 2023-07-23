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
              <n-input v-model:value="filterDataListParams.keyword" placeholder="请输入搜索条件（角色名称）" clearable />
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
    </strix-block>

    <n-data-table :loading="dataLoading" :columns="dataColumns" :data="filterDataList" :row-key="dataRowKey"
      :expanded-row-keys="dataExpandedRowKeys" @update-expanded-row-keys="dataExpandedRowKeysChange" />

    <n-modal v-model:show="addDataModalShow" preset="card" :title="'添加' + _baseName" class="strix-model-primary"
      size="huge" @after-leave="initDataForm">
      <n-form ref="addDataFormRef" :model="addDataForm" :rules="addDataRules" label-placement="left" label-width="auto"
        require-mark-placement="right-hanging">
        <n-form-item label="角色名称" path="name">
          <n-input v-model:value="addDataForm.name" placeholder="请输入角色名称" clearable />
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
      size="huge" @after-leave="initDataForm">
      <n-spin :show="editDataFormLoading">
        <n-form ref="editDataFormRef" :model="editDataForm" :rules="editDataRules" label-placement="left"
          label-width="auto" require-mark-placement="right-hanging">
          <n-form-item label="角色名称" path="name">
            <n-input v-model:value="editDataForm.name" placeholder="请输入角色名称" clearable />
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

    <n-modal v-model:show="editRoleMenusModalShow" preset="card" :title="'修改' + _baseName + '菜单权限'"
      class="strix-model-primary" size="huge" @after-leave="initModifyForm">
      <n-spin :show="editRoleMenusLoading">
        <n-tree ref="editRoleMenusTree" v-model:checked-keys="editRoleMenusCheckedKeys" block-line checkable
          default-expand-all :data="systemMenuTreeData" :render-prefix="editRoleMenusRenderPrefix" key-field="id"
          label-field="name" />
      </n-spin>
      <template #footer>
        <n-space class="strix-form-modal-footer">
          <n-button @click="editRoleMenusModalShow = false">取消</n-button>
          <n-button type="primary" @click="editRoleMenus">
            确定
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import StrixBlock from '@/components/StrixBlock.vue'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { deepMap, flatTree } from '@/utils/strix-tools'
import _, { cloneDeep } from 'lodash'
import { NButton, NDataTable, NEmpty, NGi, NGrid, NScrollbar, NSpace, NSpin, NTabPane, NTabs, NTag } from 'naive-ui'
import { computed, getCurrentInstance, h, onMounted, ref } from 'vue'

const { proxy } = getCurrentInstance()

// 本页面操作提示关键词
const _baseName = '系统角色'

const colorList = ['info', 'warning', 'error', 'success']
const renderExpandMenuChildren = (row, children, colorIndex) => {
  if (!children) { return [] }
  if (colorIndex == colorList.length - 1) { colorIndex = 0 }
  const currentMenus = []
  children?.forEach(menu => {
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
          h(NTag, { type: colorList[colorIndex], closable: true, onClose: () => removeRoleMenu(row, menu.id) }, () => menu.name)
        ),
        h(NGi, { span: 5 }, () =>
          nextMenus
        )
      ])
    )
  })
  return currentMenus
}

// 展示列信息
const dataColumns = [
  {
    type: "expand",
    renderExpand: (row) => {
      if (!row.expandTab) row.expandTab = 'menu'
      if (!row.loaded) return h(NSpin, { size: 'large', description: '加载中...' })

      const expandMenuChildrenVNode = renderExpandMenuChildren(row, row.menus, 0)
      if (expandMenuChildrenVNode.length == 0) expandMenuChildrenVNode.push(h(NEmpty, { description: 'TA好像没有可用菜单权限' }))

      return h(
        NTabs,
        {
          type: 'segment',
          animated: true,
          value: row.expandTab,
          'onUpdate:value': (value) => { row.expandTab = value }
        },
        () => [
          h(NTabPane, { name: 'menu', tab: '菜单权限 / 按钮权限', class: 'expand-menu-pane' }, () =>
            h(NScrollbar, { xScrollable: true }, () => h('div', { style: 'min-width: 800px; padding-bottom: 10px;' }, [expandMenuChildrenVNode]))
          )
        ]
      )
    }
  }, {
    key: 'name',
    minWidth: 100,
    width: 500,
    title: '角色名称'
  }, {
    title: '操作',
    width: 240,
    render(row) {
      return handleOperate([
        { type: 'info', label: '编辑菜单权限', icon: 'ion:bookmarks-outline', onClick: () => showEditRoleMenusModal(row) },
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

// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  proxy.$http.get('system/role', { operate: `加载${_baseName}列表` }).then(({ data: res }) => {
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
    let filterd = true
    if (filterDataListParams.value.keyword && d.name.indexOf(filterDataListParams.value.keyword) < 0) filterd = false
    return filterd
  })
)

const dataRowKey = (rowData) => rowData.id
const dataExpandedRowKeys = ref([])
const dataExpandedRowKeysChange = (value) => {
  // 只获取新展开的
  const diffs = _.differenceWith(value, dataExpandedRowKeys.value, _.isEqual);
  dataExpandedRowKeys.value = value
  diffs.forEach(diff => {
    const row = _.find(dataRef.value, { id: diff })
    if (row) {
      proxy.$http.get(`system/role/${row.id}`, { operate: `加载${_baseName}信息` }).then(({ data: res }) => {
        handleEditSuccessResponse(row, res.data)
      })
    }
  })
}

const initDataForm = () => {
  addDataModalShow.value = false
  editDataModalShow.value = false
  editDataFormLoading.value = false
  addDataForm.value = cloneDeep(initAddDataForm)
  editDataId = null
  editDataForm.value = cloneDeep(initEditDataForm)
}

const addDataModalShow = ref(false)
const initAddDataForm = {
  name: null
}
const addDataForm = ref(cloneDeep(initAddDataForm))
const addDataRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 12, message: '角色名称长度需在2-12之间', trigger: 'blur' }
  ]
}
const showAddDataModal = () => {
  addDataModalShow.value = true
}
const addData = () => {
  proxy.$refs.addDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post('system/role/update', addDataForm.value, { operate: `修改${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const editDataModalShow = ref(false)
const editDataFormLoading = ref(false)
let editDataId = null
const initEditDataForm = {
  name: null
}
const editDataForm = ref(cloneDeep(initEditDataForm))
const editDataRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 12, message: '角色名称长度需在2-12之间', trigger: 'blur' }
  ]
}
const showEditDataModal = (id) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  proxy.$http.get(`system/role/${id}`, { operate: `加载${_baseName}信息` }).then(({ data: res }) => {
    editDataId = id
    const canUpdateFields = Object.keys(initEditDataForm)
    editDataForm.value = _.pick(res.data, canUpdateFields)
    editDataFormLoading.value = false
  })
}
const editData = () => {
  proxy.$refs.editDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post(`system/role/update/${editDataId}`, editDataForm.value, { operate: `修改${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const deleteData = (id) => {
  proxy.$http.post(`system/role/remove/${id}`, null, { operate: `删除${_baseName}` }).then(() => {
    getDataList()
  })
}

const removeRoleMenu = (row, menuId) => {
  proxy.$http.post(`system/role/remove/${row.id}/menu/${menuId}`, null, { operate: '移除角色菜单权限' }).then(({ data: res }) => {
    handleEditSuccessResponse(row, res.data)
  })
}
const removeRolePermission = (row, permissionId) => {
  proxy.$http.post(`system/role/remove/${row.id}/permission/${permissionId}`, null, { operate: '移除角色系统权限' }).then(({ data: res }) => {
    handleEditSuccessResponse(row, res.data)
  })
}
const handleEditSuccessResponse = (row, data) => {
  row.menus = data.menus
  row.loaded = true
}

const systemMenuTreeData = ref([])
const getSystemMenuTreeData = () => {
  proxy.$http.get('system/menu', { operate: `加载系统菜单树` }).then(({ data: res }) => {
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
let editRoleMenusRoleRow = null
const editRoleMenusCheckedKeys = ref([])
const showEditRoleMenusModal = (roleRow) => {
  editRoleMenusLoading.value = true
  editRoleMenusModalShow.value = true
  // 加载编辑前信息
  proxy.$http.get(`system/role/${roleRow.id}`, { operate: `加载${_baseName}菜单信息` }).then(({ data: res }) => {
    editRoleMenusRoleId = res.data.id
    editRoleMenusRoleRow = roleRow
    editRoleMenusCheckedKeys.value = deepMap(res.data.menus, 'id')
    editRoleMenusCheckedKeys.value.push(...deepMap(res.data.permissions, 'id'))
    editRoleMenusLoading.value = false
  })
}
const editRoleMenus = () => {
  const flatMenu = flatTree(systemMenuTreeData.value)

  const menuIds = []
  const permissionIds = []

  const checkedIds = [...proxy.$refs.editRoleMenusTree.getCheckedData().keys, ...proxy.$refs.editRoleMenusTree.getIndeterminateData().keys]

  flatMenu.filter(m => checkedIds.includes(m.id)).forEach(m => {
    if (m.type === 'menu') {
      menuIds.push(m.id)
    } else {
      permissionIds.push(m.id)
    }
  })

  proxy.$http.post(`system/role/update/${editRoleMenusRoleId}/menu`, {
    menuIds: menuIds.join(','),
    permissionIds: permissionIds.join(',')
  }, { operate: `更改${_baseName}菜单权限` }).then(({ data: res }) => {
    editRoleMenusModalShow.value = false
    handleEditSuccessResponse(editRoleMenusRoleRow, res.data)
  })
}
const editRoleMenusRenderPrefix = ({ option }) => {
  return h(NTag, { type: option.type === 'menu' ? 'success' : 'info', bordered: false, size: 'tiny' }, { default: () => option.type === 'menu' ? '菜单' : '按钮' })
}

</script>
<script>
export default {
  name: 'SystemRoleIndex'
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
    transition: all .3s cubic-bezier(.4, 0, .2, 1);
  }
}

::v-deep(.expand-permission-pane) {
  .n-tag:not(:last-child) {
    margin: 0 8px 8px 0;
  }
}
</style>
