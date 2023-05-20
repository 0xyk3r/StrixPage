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
              <n-input v-model:value="filterDataListParams.keyword" placeholder="请输入搜索条件（角色名称）" clearable />
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
    </strix-block>

    <n-data-table :loading="dataLoading" :columns="dataColumns" :data="filterDataList" :row-key="dataRowKey"
      :expanded-row-keys="dataExpandedRowKeys" @updateExpandedRowKeys="dataExpandedRowKeysChange" />

    <n-modal v-model:show="addDataModalShow" preset="card" :title="'添加' + funName" class="strix-model-primary"
      :class="isSmallWindow ? 'strix-full-modal':''" size="huge" @after-leave="initDataForm">
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

    <n-modal v-model:show="editDataModalShow" preset="card" :title="'修改' + funName" class="strix-model-primary"
      :class="isSmallWindow ? 'strix-full-modal':''" size="huge" @after-leave="initDataForm">
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

    <n-modal v-model:show="editRoleMenusModalShow" preset="card" :title="'修改' + funName + '菜单权限'"
      class="strix-model-primary" :class="isSmallWindow ? 'strix-full-modal':''" size="huge"
      @after-leave="initModifyForm">
      <n-spin :show="editRoleMenusLoading">
        <n-tree block-line cascade checkable :data="systemMenuTreeData" v-model:checked-keys="editRoleMenusCheckedKeys"
          key-field="id" label-field="name" />
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

    <n-modal v-model:show="editRolePermissionsModalShow" preset="card" :title="'修改' + funName + '系统权限'"
      class="strix-model-primary" :class="isSmallWindow ? 'strix-full-modal':''" size="huge"
      @after-leave="initModifyForm">
      <n-spin :show="editRolePermissionsLoading">
        <n-transfer ref="transfer" :options="systemPermissionTransferData"
          v-model:value="editRolePermissionsCheckedKeys" :render-source-label="renderSystemPermissionTransferData"
          :render-target-label="renderSystemPermissionTransferData" />
      </n-spin>
      <template #footer>
        <n-space class="strix-form-modal-footer">
          <n-button @click="editRolePermissionsModalShow = false">取消</n-button>
          <n-button type="primary" @click="editRolePermissions">
            确定
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import StrixBlock from '@/components/StrixBlock.vue'
import useCurrentInstance from '@/utils/strix-instance-tool'
import { createStrixNotify } from '@/utils/strix-notify'
import { deepMap } from '@/utils/strix-tools'
import { Icon } from '@iconify/vue'
import _ from 'lodash'
import { NButton, NDataTable, NDivider, NEmpty, NGi, NGrid, NPopconfirm, NScrollbar, NSpace, NSpin, NTabPane, NTabs, NTag } from 'naive-ui'
import { computed, h, onMounted, ref } from 'vue'

const { proxy } = useCurrentInstance()

// 本页面操作提示关键词
const funName = '系统角色'

defineProps({
  isSmallWindow: {
    type: Boolean, default: false
  }
})

const colorList = ['info', 'warning', 'error', 'success', '']
const renderExpandMenuChildren = (row, children, colorIndex) => {
  if (!children) { return [] }
  if (colorIndex == colorList.length - 1) { colorIndex = 0 }
  const currentMenus = []
  children?.forEach(currentMenu => {
    const nextMenus = renderExpandMenuChildren(row, currentMenu.children, colorIndex + 1)
    currentMenus.push(
      h(NGrid, { xGap: 10, cols: 6 }, () => [
        h(NGi, { span: 1 }, () =>
          h(NTag, { type: colorList[colorIndex], closable: true, onClose: () => removeRoleMenu(row, currentMenu.id) }, () => currentMenu.name)
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
      if (!row.loaded) {
        return h(NSpin, { size: 'large', description: '加载中...' })
      }

      // 菜单权限渲染
      const expandMenuChildrenVNode = renderExpandMenuChildren(row, row.menus, 0)
      if (expandMenuChildrenVNode.length == 0) {
        expandMenuChildrenVNode.push(h(NEmpty, { description: 'TA好像没有可用菜单权限' }))
      }
      // 系统权限渲染
      const RWPermissionVNodeList = []
      const RPermissionVNodeList = []
      row.permissionsReadAndWrite.forEach(p => {
        RWPermissionVNodeList.push(
          h(NTag, { type: 'info', closable: true, onClose: () => removeRolePermission(row, p.id) }, () => p.name)
        )
      })
      row.permissionsRead.forEach(p => {
        RPermissionVNodeList.push(
          h(NTag, { type: 'success', closable: true, onClose: () => removeRolePermission(row, p.id) }, () => p.name)
        )
      })
      if (RWPermissionVNodeList.length == 0) {
        RWPermissionVNodeList.push(h(NEmpty, { description: 'TA好像没有可用系统读写权限' }))
      }
      if (RPermissionVNodeList.length == 0) {
        RPermissionVNodeList.push(h(NEmpty, { description: 'TA好像没有可用系统只读权限' }))
      }
      const expandPermissionChildrenVNode = [
        h(NDivider, { titlePlacement: 'left' }, () => '读写权限'),
        ...RWPermissionVNodeList,
        h(NDivider, { titlePlacement: 'left' }, () => '只读权限'),
        ...RPermissionVNodeList
      ]

      return h(
        NTabs,
        {
          type: 'segment',
          animated: true,
          value: row.expandTab,
          'onUpdate:value': (value) => { row.expandTab = value }
        },
        () => [
          h(NTabPane, { name: 'menu', tab: '菜单权限', class: 'expand-menu-pane' }, () =>
            h(NScrollbar, { xScrollable: true }, () => h('div', { style: 'min-width: 800px; padding-bottom: 10px;' }, [expandMenuChildrenVNode]))
          ),
          h(NTabPane, { name: 'permission', tab: '系统权限', class: 'expand-permission-pane' }, () =>
            h(NScrollbar, { xScrollable: true }, () => h('div', { style: 'min-width: 800px; padding-bottom: 10px;' }, [expandPermissionChildrenVNode]))
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
      return [
        h(NButton,
          {
            size: 'medium',
            type: 'info',
            style: 'margin-right: 10px',
            onClick: () => showEditRoleMenusModal(row)
          },
          () => h(Icon, { icon: 'ion:logo-slack' })
        ),
        h(NButton,
          {
            size: 'medium',
            type: 'info',
            style: 'margin-right: 10px',
            onClick: () => showEditRolePermissionsModal(row)
          },
          () => h(Icon, { icon: 'ion:key-outline' })
        ),
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

// 加载列表
const dataData = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  proxy.$http.get('system/role').then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('warning', `获取${funName}列表失败`, res.msg)
    }
    dataLoading.value = false
    // 清除展开行
    dataExpandedRowKeys.value = []
    dataData.value = res.data.systemRoleList
  })
}
onMounted(getDataList)
// 本地筛选数据
const filterDataListParams = ref({
  keyword: ''
})
const filterDataList = computed(() =>
  dataData.value?.filter((d) => {
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
    const row = _.find(dataData.value, { id: diff })
    if (row) {
      proxy.$http.get(`system/role/${row.id}`).then(({ data: res }) => {
        if (res.code !== 200) {
          return createStrixNotify('error', '获取角色的详细信息失败', res.msg)
        }
        row.menus = res.data.menus
        row.permissionsRead = res.data.permissions.filter(p => {
          return p.permissionType === 1
        })
        row.permissionsReadAndWrite = res.data.permissions.filter(p => {
          return p.permissionType === 2
        })
        row.loaded = true
      })
    }
  })
}
const clearSearch = () => {
  filterDataListParams.value.keyword = ''
}

const initDataForm = () => {
  addDataModalShow.value = false
  editDataModalShow.value = false
  editDataFormLoading.value = false
  addDataForm.value = {
    name: ''
  }
  editDataId = ''
  editDataForm.value = {
    name: ''
  }
}

const addDataModalShow = ref(false)
const addDataForm = ref({
  name: ''
})
const addDataRules = {
  name: [
    {
      required: true,
      message: '请输入角色名称',
      trigger: 'blur'
    }, {
      min: 2,
      max: 12,
      message: '角色名称昵称长度需在2-12之间',
      trigger: 'blur'
    }
  ]
}
const showAddDataModal = (id) => {
  if (id) {
    addDataForm.value.parentId = id
  }
  addDataModalShow.value = true
}
const addData = () => {
  proxy.$refs.addDataFormRef.validate((errors) => {
    if (!errors) {
      proxy.$http.post('system/role/update', addDataForm.value).then(({ data: res }) => {
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
  name: ''
})
const editDataRules = {
  name: [
    {
      required: true,
      message: '请输入角色名称',
      trigger: 'blur'
    }, {
      min: 2,
      max: 12,
      message: '角色名称长度需在2-12之间',
      trigger: 'blur'
    }
  ]
}
const showEditDataModal = (id) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  proxy.$http.get(`system/role/${id}`).then(({ data: res }) => {
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
      proxy.$http.post(`system/role/update/${editDataId}`, editDataForm.value).then(({ data: res }) => {
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
  proxy.$http.post(`system/role/remove/${id}`).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', `删除${funName}失败`, res.msg)
    }
    createStrixNotify('success', '提示信息', `删除${funName}成功`)
    getDataList()
  })
}

const removeRoleMenu = (row, menuId) => {
  proxy.$http.post(`system/role/remove/${row.id}/menu/${menuId}`).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', '移除角色与菜单权限失败', res.msg)
    }
    createStrixNotify('success', '提示信息', '移除角色菜单权限成功')
    handleEditSuccessResponse(row, res.data)
  })
}
const removeRolePermission = (row, permissionId) => {
  proxy.$http.post(`system/role/remove/${row.id}/permission/${permissionId}`).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', '移除角色系统权限失败', res.msg)
    }
    createStrixNotify('success', '提示信息', '移除角色系统权限成功')
    handleEditSuccessResponse(row, res.data)
  })
}
const handleEditSuccessResponse = (row, data) => {
  row.menus = data.menus
  row.permissionsRead = data.permissions?.filter(p => {
    return p.permissionType === 1
  })
  row.permissionsReadAndWrite = data.permissions?.filter(p => {
    return p.permissionType === 2
  })
  row.loaded = true
}

const systemMenuTreeData = ref([])
const getSystemMenuTreeData = () => {
  proxy.$http.get('system/menu').then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', '加载系统菜单树菜单数据失败', res.msg)
    }
    systemMenuTreeData.value = res.data.systemMenuList
    // 去除children为空的展开按钮
    systemMenuTreeData.value.forEach((m) => {
      if (m.children?.length == 0) { m.children = null }
    })
  })
}
onMounted(getSystemMenuTreeData)
const systemPermissionTransferData = ref([])
const getSystemPermissionTransferData = () => {
  proxy.$http.get('system/permission/transfer').then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', '加载系统权限穿梭框数据失败', res.msg)
    }
    systemPermissionTransferData.value = res.data.transferData
    // TODO 转为后端处理
    systemPermissionTransferData.value.forEach((p) => p.value = p.key)
  })
}
onMounted(getSystemPermissionTransferData)
const renderSystemPermissionTransferData = ({ option }) => {
  return h(
    'div',
    {
      style: { color: option.status == 1 ? '#F4A460' : '#1E90FF' }
    },
    {
      default: () => option.label + ' （' + (option.status == 1 ? '只读' : '读写') + '）'
    }
  )
}

const initModifyForm = () => {
  editRoleMenusModalShow.value = false
  editRolePermissionsModalShow.value = false
  editRoleMenusLoading.value = false
  editRolePermissionsLoading.value = false
  editRoleMenusRoleId = ''
  editRolePermissionsRoleId = ''
  editRoleMenusRoleRow = null
  editRolePermissionsRoleRow = null
  editRoleMenusCheckedKeys.value = []
  editRolePermissionsCheckedKeys.value = []
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
  proxy.$http.get(`system/role/${roleRow.id}`).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', `查询${funName}信息失败`, res.msg)
    }
    editRoleMenusRoleId = res.data.id
    editRoleMenusRoleRow = roleRow
    editRoleMenusCheckedKeys.value = deepMap(res.data.menus, 'id')
    editRoleMenusLoading.value = false
  })
}
const editRoleMenus = () => {
  proxy.$http.post(`system/role/modify/${editRoleMenusRoleId}`, {
    field: 'menus',
    value: editRoleMenusCheckedKeys.value.join(',')
  }).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', `更改${funName}菜单权限失败`, res.msg)
    }
    createStrixNotify('success', '操作成功', `更改${funName}菜单权限成功`)
    editRoleMenusModalShow.value = false
    handleEditSuccessResponse(editRoleMenusRoleRow, res.data)
  })
}


const editRolePermissionsModalShow = ref(false)
const editRolePermissionsLoading = ref(false)
let editRolePermissionsRoleId = ''
let editRolePermissionsRoleRow = null
const editRolePermissionsCheckedKeys = ref([])
const showEditRolePermissionsModal = (roleRow) => {
  editRolePermissionsLoading.value = true
  editRolePermissionsModalShow.value = true
  // 加载编辑前信息
  proxy.$http.get(`system/role/${roleRow.id}`).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', `查询${funName}信息失败`, res.msg)
    }
    editRolePermissionsRoleId = res.data.id
    editRolePermissionsRoleRow = roleRow
    editRolePermissionsCheckedKeys.value = deepMap(res.data.permissions, 'id')
    editRolePermissionsLoading.value = false
  })
}
const editRolePermissions = () => {
  proxy.$http.post(`system/role/modify/${editRolePermissionsRoleId}`, {
    field: 'permissions',
    value: editRolePermissionsCheckedKeys.value.join(',')
  }).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', `更改${funName}系统权限失败`, res.msg)
    }
    createStrixNotify('success', '操作成功', `更改${funName}系统权限成功`)
    editRolePermissionsModalShow.value = false
    handleEditSuccessResponse(editRolePermissionsRoleRow, res.data)
  })
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
    border-bottom: 1px solid var(--color-border);
  }

  .n-grid {
    align-items: center;
  }
}

::v-deep(.expand-permission-pane) {
  .n-tag:not(:last-child) {
    margin: 0 8px 8px 0;
  }
}
</style>
