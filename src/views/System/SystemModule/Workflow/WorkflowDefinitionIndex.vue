<template>
  <div>
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="listParams.keyword" clearable placeholder="搜索流程名称..." />
              <n-button ghost type="primary" @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAdd()">创建流程</n-button>
          </n-gi>
        </n-grid>
      </template>
    </strix-block>

    <n-data-table
      :columns="columns"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="pagination"
      :row-key="(row: any) => row.id"
      table-layout="fixed"
    />

    <!-- Create definition modal -->
    <n-modal
      :show="addModal"
      title="创建流程定义"
      class="strix-form-modal"
      preset="card"
      @update:show="tryCloseAdd"
      size="huge"
      @after-leave="resetForms"
    >
      <n-form ref="addFormRef" :model="addForm" :rules="formRules" label-placement="left" label-width="auto" require-mark-placement="right-hanging">
        <n-form-item label="流程名称" path="name">
          <n-input v-model:value="addForm.name" clearable placeholder="请输入流程名称" />
        </n-form-item>
        <n-form-item label="流程标识" path="key">
          <n-input v-model:value="addForm.key" clearable placeholder="英文标识，如 leave-approval" />
        </n-form-item>
        <n-form-item label="分类" path="category">
          <n-input v-model:value="addForm.category" clearable placeholder="可选，如 人事、行政" />
        </n-form-item>
        <n-form-item label="描述" path="description">
          <n-input v-model:value="addForm.description" type="textarea" :rows="3" clearable placeholder="流程描述" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="tryCloseAdd">取消</n-button>
          <n-button type="primary" @click="submitAdd">确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StrixBlock from '@/components/common/StrixBlock.vue'
import { workflowApi } from '@/api/workflow'
import type { WfDefinition } from '@/api/workflow'
import { useCrud } from '@/composables/useCrud'
import { handleOperate } from '@/utils/strix-table-tool'
import { textField } from '@/utils/form-rules'
import { type DataTableColumns, type FormRules, useMessage, NTag } from 'naive-ui'

const _baseName = '流程定义'
const router = useRouter()
const message = useMessage()

const {
  listParams, clearSearch, pagination,
  addModal, addForm, addFormRef,
  showAdd, submitAdd, tryCloseAdd, resetForms
} = useCrud({
  list: { keyword: null, pageIndex: 1, pageSize: 10 },
  fetchList: () => getDataList(),
  addForm: { name: null, key: null, category: null, description: null },
  editForm: {},
  api: {
    create: (data: any) => workflowApi.definitionCreate(data),
    remove: (id: string) => workflowApi.definitionRemove(id)
  },
  draftKey: 'WorkflowDefinition'
})

const formRules: FormRules = {
  name: textField('流程名称', { min: 2, max: 64 }),
  key: textField('流程标识', { min: 2, max: 64 })
}

const columns: DataTableColumns = [
  { key: 'name', title: '流程名称', width: 200 },
  { key: 'key', title: '流程标识', width: 180 },
  { key: 'category', title: '分类', width: 120 },
  {
    key: 'status',
    title: '状态',
    width: 100,
    align: 'center',
    render(row: any) {
      return h(NTag, {
        type: row.status === 1 ? 'success' : 'default',
        size: 'small'
      }, () => row.status === 1 ? '已启用' : '已停用')
    }
  },
  { key: 'description', title: '描述', width: 200, ellipsis: { tooltip: true } },
  { key: 'createdTime', title: '创建时间', width: 180 },
  {
    key: 'actions',
    title: '操作',
    width: 280,
    align: 'center',
    render(row: any) {
      return handleOperate([
        {
          type: 'primary',
          label: '设计',
          icon: 'pencil-ruler',
          onClick: () => router.push({ name: 'WorkflowDesigner', params: { definitionId: row.id } })
        },
        {
          type: row.status === 1 ? 'warning' : 'success',
          label: row.status === 1 ? '停用' : '启用',
          icon: row.status === 1 ? 'pause' : 'play',
          onClick: () => toggleStatus(row)
        },
        {
          type: 'error',
          label: '删除',
          icon: 'trash',
          onClick: () => deleteDefinition(row.id),
          popconfirm: true
        }
      ])
    }
  }
]

const dataRef = ref<WfDefinition[]>([])
const dataLoading = ref(true)

async function getDataList() {
  dataLoading.value = true
  try {
    const { data: res } = await workflowApi.definitionList(listParams.value)
    dataRef.value = res.data.items
    pagination.itemCount = res.data.total
  } finally {
    dataLoading.value = false
  }
}

async function toggleStatus(row: WfDefinition) {
  try {
    if (row.status === 1) {
      await workflowApi.definitionDisable(row.id)
      message.success('已停用')
    } else {
      await workflowApi.definitionEnable(row.id)
      message.success('已启用')
    }
    getDataList()
  } catch {}
}

async function deleteDefinition(id: string) {
  try {
    await workflowApi.definitionRemove(id)
    message.success('删除成功')
    getDataList()
  } catch {}
}

onMounted(getDataList)
</script>
