<template>
  <div>
    <strix-block style="margin-bottom: 20px">
      <template #body>
        <n-grid :cols="6">
          <n-gi :span="1">
            <n-button type="primary" @click="() => showAddDataModal({ id: '', key: '' })">
              添加{{ _baseName }}
            </n-button>
          </n-gi>
        </n-grid>
        <n-alert title="提醒" type="warning" style="margin-top: 15px">
          Strix 理论支持无限级别菜单，但考虑到 UI 展示和性能问题，仍不建议配置超过 3 级菜单。
        </n-alert>
      </template>
    </strix-block>

    <n-data-table
      :remote="true"
      :loading="dataLoading"
      :columns="dataColumns"
      :data="dataRef"
      :row-key="dataRowKey"
      :cascade="false"
      :allow-checking-not-loaded="true"
    />

    <n-modal
      v-model:show="addDataModalShow"
      preset="card"
      :title="'添加' + _baseName"
      class="strix-form-modal"
      size="huge"
      @after-leave="initDataForm"
    >
      <n-tabs v-model:value="addDataModalType" type="segment" :animated="true">
        <n-tab-pane name="menu" tab="菜单">
          <n-form
            ref="addDataFormRef"
            :model="addDataForm"
            :rules="addDataRules"
            label-placement="left"
            label-width="auto"
            require-mark-placement="right-hanging"
          >
            <n-grid :cols="2" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
              <n-form-item-gi span="2 s:1" label="菜单名称" path="name">
                <n-input v-model:value="addDataForm.name" placeholder="请输入菜单名称" clearable />
              </n-form-item-gi>
              <n-form-item-gi span="2 s:1" label="父级菜单" path="parentId">
                <n-tree-select
                  v-model:value="addDataForm.parentId"
                  :options="menuTreeRef"
                  placeholder="选择父级菜单"
                  cascade
                  clearable
                  filterable
                  key-field="value"
                />
              </n-form-item-gi>
              <n-form-item-gi span="2 s:2" label="权限标识" path="key">
                <n-input v-model:value="addDataForm.key" placeholder="请输入权限标识" clearable />
              </n-form-item-gi>
              <n-form-item-gi span="2 s:2" label="菜单路由" path="url">
                <n-input v-model:value="addDataForm.url" placeholder="请输入菜单路由" clearable />
              </n-form-item-gi>
              <n-form-item-gi span="2 s:1" label="菜单图标" path="icon">
                <n-input v-model:value="addDataForm.icon" placeholder="请输入菜单图标" clearable />
              </n-form-item-gi>
              <n-form-item-gi span="2 s:1" label="菜单排序" path="sortValue">
                <n-input-number
                  v-model:value="addDataForm.sortValue"
                  placeholder="请输入菜单排序"
                  clearable
                />
              </n-form-item-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="permission" tab="按钮 / 功能">
          <n-form
            ref="addPermissionFormRef"
            :model="addPermissionForm"
            :rules="addPermissionRules"
            label-placement="left"
            label-width="auto"
            require-mark-placement="right-hanging"
          >
            <n-grid :cols="2" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
              <n-form-item-gi span="2 s:1" label="权限名称" path="name">
                <n-input
                  v-model:value="addPermissionForm.name"
                  placeholder="请输入权限名称"
                  clearable
                />
              </n-form-item-gi>
              <n-form-item-gi span="2 s:1" label="父级菜单" path="menuId">
                <n-tree-select
                  v-model:value="addPermissionForm.menuId"
                  :options="menuTreeRef"
                  placeholder="选择父级菜单"
                  cascade
                  clearable
                  filterable
                  key-field="value"
                />
              </n-form-item-gi>
              <n-form-item-gi span="2 s:2" label="权限标识" path="key">
                <n-input
                  v-model:value="addPermissionForm.key"
                  placeholder="请输入权限标识"
                  clearable
                />
              </n-form-item-gi>
              <n-form-item-gi span="2 s:2" label="权限介绍" path="description">
                <n-input
                  v-model:value="addPermissionForm.description"
                  placeholder="请输入权限介绍"
                  type="textarea"
                  clearable
                  :autosize="{
                    minRows: 1,
                    maxRows: 5
                  }"
                />
              </n-form-item-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
      </n-tabs>

      <template #footer>
        <n-space class="strix-form-modal-footer">
          <n-button @click="addDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="addData"> 确定 </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="editDataModalShow"
      preset="card"
      :title="'修改' + _baseName"
      class="strix-form-modal"
      size="huge"
      @after-leave="initDataForm"
    >
      <n-spin :show="editDataFormLoading">
        <n-tabs v-model:value="editDataModalType" type="segment" :animated="true">
          <n-tab-pane name="menu" tab="菜单" disabled>
            <n-form
              ref="editDataFormRef"
              :model="editDataForm"
              :rules="editDataRules"
              label-placement="left"
              label-width="auto"
              require-mark-placement="right-hanging"
            >
              <n-grid :cols="2" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
                <n-form-item-gi span="2 s:1" label="菜单名称" path="name">
                  <n-input
                    v-model:value="editDataForm.name"
                    placeholder="请输入菜单名称"
                    clearable
                  />
                </n-form-item-gi>
                <n-form-item-gi span="2 s:1" label="父级菜单" path="parentId">
                  <n-tree-select
                    v-model:value="editDataForm.parentId"
                    :options="menuTreeRef"
                    placeholder="选择父级菜单"
                    cascade
                    clearable
                    filterable
                    key-field="value"
                  />
                </n-form-item-gi>
                <n-form-item-gi span="2 s:2" label="权限标识" path="key">
                  <n-input
                    v-model:value="editDataForm.key"
                    placeholder="请输入权限标识"
                    clearable
                  />
                </n-form-item-gi>
                <n-form-item-gi span="2 s:2" label="菜单路由" path="url">
                  <n-input
                    v-model:value="editDataForm.url"
                    placeholder="请输入菜单路由"
                    clearable
                  />
                </n-form-item-gi>
                <n-form-item-gi span="2 s:1" label="菜单图标" path="icon">
                  <n-input
                    v-model:value="editDataForm.icon"
                    placeholder="请输入菜单图标"
                    clearable
                  />
                </n-form-item-gi>
                <n-form-item-gi span="2 s:1" label="菜单排序" path="sortValue">
                  <n-input-number
                    v-model:value="editDataForm.sortValue"
                    placeholder="请输入菜单排序"
                    clearable
                  />
                </n-form-item-gi>
              </n-grid>
            </n-form>
          </n-tab-pane>
          <n-tab-pane name="permission" tab="按钮 / 功能" disabled>
            <n-form
              ref="editPermissionFormRef"
              :model="editPermissionForm"
              :rules="editPermissionRules"
              label-placement="left"
              label-width="auto"
              require-mark-placement="right-hanging"
            >
              <n-grid :cols="2" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
                <n-form-item-gi span="2 s:1" label="权限名称" path="name">
                  <n-input
                    v-model:value="editPermissionForm.name"
                    placeholder="请输入权限名称"
                    clearable
                  />
                </n-form-item-gi>
                <n-form-item-gi span="2 s:1" label="父级菜单" path="menuId">
                  <n-tree-select
                    v-model:value="editPermissionForm.menuId"
                    :options="menuTreeRef"
                    placeholder="选择父级菜单"
                    cascade
                    clearable
                    filterable
                    key-field="value"
                  />
                </n-form-item-gi>
                <n-form-item-gi span="2 s:2" label="权限标识" path="key">
                  <n-input
                    v-model:value="editPermissionForm.key"
                    placeholder="请输入权限标识"
                    clearable
                  />
                </n-form-item-gi>
                <n-form-item-gi span="2 s:2" label="权限介绍" path="description">
                  <n-input
                    v-model:value="editPermissionForm.description"
                    placeholder="请输入权限介绍"
                    type="textarea"
                    clearable
                    :autosize="{
                      minRows: 1,
                      maxRows: 5
                    }"
                  />
                </n-form-item-gi>
              </n-grid>
            </n-form>
          </n-tab-pane>
        </n-tabs>
      </n-spin>

      <template #footer>
        <n-space class="strix-form-modal-footer">
          <n-button @click="editDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="editData">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import StrixBlock from '@/components/StrixBlock.vue'
import { http } from '@/plugins/axios'
import { EventBus } from '@/plugins/event-bus'
import { usePage } from '@/utils/common-page-util'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { Icon } from '@iconify/vue'
import { cloneDeep, kebabCase, pick } from 'lodash'
import { NTag, type DataTableColumns, type FormInst, type FormRules } from 'naive-ui'

// 本页面操作提示关键词
const _baseName = '系统菜单'

const {
  getDataListParams,
  dataRowKey,
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
  {
    pageIndex: 1,
    pageSize: 10
  },
  () => {
    getDataList()
  },
  {
    name: null,
    key: null,
    url: '/',
    icon: null,
    parentId: null,
    sortValue: 0
  },
  {
    name: null,
    key: null,
    url: null,
    icon: null,
    parentId: null,
    sortValue: null
  },
  () => {
    addDataModalType.value = 'menu'
    editDataModalType.value = 'menu'
    addPermissionForm.value = cloneDeep(initAddPermissionForm)
    editPermissionForm.value = cloneDeep(initEditPermissionForm)
  }
)

// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'name', title: '菜单名称', width: 200 },
  {
    key: 'icon',
    title: '类型',
    align: 'center',
    width: 100,
    render(row) {
      return h(NTag, { type: row.type === 'menu' ? 'success' : 'info', bordered: false }, () =>
        row.type === 'menu' ? '菜单' : '按钮'
      )
    }
  },
  { key: 'key', title: '权限标识', width: 200 },
  { key: 'url', title: '菜单路由', width: 320 },
  {
    key: 'icon',
    title: '菜单图标',
    align: 'center',
    width: 90,
    render(row: any) {
      return h(Icon, { icon: kebabCase(row.icon), width: 24 })
    }
  },
  { key: 'sortValue', title: '菜单排序', width: 90 },
  {
    key: 'actions',
    title: '操作',
    width: 200,
    render(row: any) {
      return handleOperate([
        {
          type: 'info',
          label: '添加',
          icon: 'ion:add',
          disabled: row.type === 'permission',
          onClick: () => showAddDataModal(row)
        },
        {
          type: 'warning',
          label: '编辑',
          icon: 'ion:create-outline',
          onClick: () => showEditDataModal(row)
        },
        {
          type: 'error',
          label: '删除',
          icon: 'ion:trash-outline',
          onClick: () => deleteData(row),
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
  http
    .get('system/menu', {
      params: getDataListParams.value,
      meta: { operate: `加载${_baseName}列表` }
    })
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.systemMenuList
    })
}
onMounted(getDataList)

const addDataModalType = ref('menu')
const addDataRules: FormRules = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 2, max: 10, message: '菜单名称需为 2-10 字符', trigger: 'blur' }
  ],
  key: [
    { required: true, message: '请输入权限标识', trigger: 'blur' },
    { min: 2, max: 32, message: '权限标识需为 2-32 字符', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入菜单路由' },
    { min: 1, max: 128, message: '权限标识需为 1-128 字符', trigger: 'blur' }
  ],
  sortValue: [
    { type: 'number', required: true, message: '请输入菜单排序值', trigger: 'change' },
    { type: 'number', min: 0, max: 99999, message: '请输入有效排序值 (1-99999)', trigger: 'change' }
  ]
}
const showAddDataModal = ({ id, key }: { id: string; key: string } | any) => {
  if (id) {
    addDataForm.value.parentId = id
    addDataForm.value.key = key + ':'
  }
  if (key) {
    addPermissionForm.value.menuId = id
    addPermissionForm.value.key = key + ':'
  }

  addDataModalShow.value = true
}
const addData = () => {
  if (addDataModalType.value === 'menu') {
    addDataFormRef.value?.validate((errors) => {
      if (errors)
        return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

      http
        .post('system/menu/update', addDataForm.value, { meta: { operate: `添加${_baseName}` } })
        .then(() => {
          initDataForm()
          getDataList()
          EventBus.emit('refresh-menu')
        })
    })
  } else {
    addPermissionFormRef.value?.validate((errors) => {
      if (errors)
        return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

      http
        .post('system/permission/update', addPermissionForm.value, {
          meta: { operate: `添加系统权限` }
        })
        .then(() => {
          initDataForm()
          getDataList()
        })
    })
  }
}

const editDataModalType = ref('menu')
const editDataRules: FormRules = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 2, max: 10, message: '菜单名称需为 2-10 字符', trigger: 'blur' }
  ],
  key: [
    { required: true, message: '请输入权限标识', trigger: 'blur' },
    { min: 2, max: 32, message: '权限标识需为 2-32 字符', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入菜单路由' },
    { min: 1, max: 128, message: '权限标识需为 1-128 字符', trigger: 'blur' }
  ],
  sortValue: [
    { type: 'number', required: true, message: '请输入菜单排序值', trigger: 'change' },
    { type: 'number', min: 0, max: 99999, message: '请输入有效排序值 (1-99999)', trigger: 'change' }
  ]
}
const showEditDataModal = (row: any) => {
  editDataModalShow.value = true
  editDataModalType.value = row.type
  editDataFormLoading.value = true
  // 加载编辑前信息
  if (row.type === 'menu') {
    http
      .get(`system/menu/${row.id}`, { meta: { operate: `加载${_baseName}信息` } })
      .then(({ data: res }) => {
        editDataId.value = row.id
        const canUpdateFields = Object.keys(initEditDataForm)
        editDataForm.value = pick(res.data, canUpdateFields)
        editDataFormLoading.value = false
      })
  } else {
    http
      .get(`system/permission/${row.id}`, { meta: { operate: `加载权限信息信息` } })
      .then(({ data: res }) => {
        editDataId.value = row.id
        const canUpdateFields = Object.keys(initEditPermissionForm)
        editPermissionForm.value = pick(res.data, canUpdateFields)
        editDataFormLoading.value = false
      })
  }
}
const editData = () => {
  if (editDataModalType.value === 'menu') {
    editDataFormRef.value?.validate((errors) => {
      if (errors)
        return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

      http
        .post(`system/menu/update/${editDataId.value}`, editDataForm.value, {
          meta: { operate: `修改${_baseName}` }
        })
        .then(() => {
          initDataForm()
          getDataList()
          EventBus.emit('refresh-menu')
        })
    })
  } else {
    editPermissionFormRef.value?.validate((errors) => {
      if (errors)
        return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

      http
        .post(`system/permission/update/${editDataId.value}`, editPermissionForm.value, {
          meta: { operate: `修改系统权限` }
        })
        .then(() => {
          initDataForm()
          getDataList()
        })
    })
  }
}

const deleteData = ({ id, type }: { id: string; type: string }) => {
  if (type === 'menu') {
    http
      .post(`system/menu/remove/${id}`, null, { meta: { operate: `删除${_baseName}` } })
      .then(() => {
        getDataList()
        EventBus.emit('refresh-menu')
      })
  } else {
    http
      .post(`system/permission/remove/${id}`, null, { meta: { operate: `删除系统权限` } })
      .then(() => {
        getDataList()
      })
  }
}

// 树形选择器数据
const menuTreeRef = ref([])
const getMenuTree = () => {
  http
    .get('system/menu/tree', { meta: { operate: `加载${_baseName}树形列表` } })
    .then(({ data: res }) => {
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
const addPermissionRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 12, message: '系统权限名称长度需在2-12之间', trigger: 'blur' }
  ],
  key: [
    { required: true, message: '请输入权限标识', trigger: 'blur' },
    { min: 2, max: 64, message: '权限标识长度需在2-64之间', trigger: 'blur' }
  ],
  menuId: [{ required: true, message: '请选择父级菜单', trigger: 'change' }],
  description: [{ max: 128, message: '权限介绍长度需在128字符以内', trigger: 'blur' }]
}

const initEditPermissionForm = {
  name: null,
  key: null,
  menuId: null,
  description: null
}
const editPermissionForm = ref<any>(cloneDeep(initEditPermissionForm))
const editPermissionFormRef = ref<FormInst | null>(null)
const editPermissionRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 12, message: '系统权限名称长度需在2-12之间', trigger: 'blur' }
  ],
  key: [
    { required: true, message: '请输入权限标识', trigger: 'blur' },
    { min: 2, max: 64, message: '权限标识长度需在2-64之间', trigger: 'blur' }
  ],
  menuId: [{ required: true, message: '请选择父级菜单', trigger: 'change' }],
  description: [{ max: 128, message: '权限介绍长度需在128字符以内', trigger: 'blur' }]
}
</script>

<style lang="scss" scoped></style>
