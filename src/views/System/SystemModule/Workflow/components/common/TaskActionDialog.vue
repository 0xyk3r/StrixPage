<!-- src/views/System/SystemModule/Workflow/components/common/TaskActionDialog.vue -->
<template>
  <n-modal :show="modelValue" preset="card" :title="dialogTitle" size="medium" @update:show="emit('update:modelValue', false)">
    <n-form ref="formRef" :model="form" :rules="formRules" label-placement="left" label-width="auto">
      <!-- Comment (all actions) -->
      <n-form-item label="意见" path="comment">
        <n-input v-model:value="form.comment" type="textarea" :rows="3" placeholder="请输入处理意见" />
      </n-form-item>

      <!-- Reject reason -->
      <n-form-item v-if="action === 'reject'" label="拒绝原因" path="reason">
        <n-input v-model:value="form.reason" placeholder="请输入拒绝原因" />
      </n-form-item>

      <!-- Return target -->
      <n-form-item v-if="action === 'return'" label="回退至" path="targetNodeId">
        <n-select v-model:value="form.targetNodeId" :options="returnNodeOptions" placeholder="选择回退节点" />
      </n-form-item>

      <!-- Delegate person -->
      <n-form-item v-if="action === 'delegate'" label="转办人" path="delegateId">
        <n-select
          v-model:value="form.delegateId"
          filterable remote
          :options="managerOptions"
          :loading="managerLoading"
          placeholder="搜索人员"
          @search="searchManagers"
        />
      </n-form-item>

      <!-- Countersign persons -->
      <n-form-item v-if="action === 'countersign'" label="加签人" path="assigneeIds">
        <n-select
          v-model:value="form.assigneeIds"
          multiple filterable remote
          :options="managerOptions"
          :loading="managerLoading"
          placeholder="搜索人员"
          @search="searchManagers"
        />
      </n-form-item>

      <!-- Remove sign person -->
      <n-form-item v-if="action === 'remove-sign'" label="降签人" path="assigneeId">
        <n-select
          v-model:value="form.assigneeId"
          filterable
          :options="currentAssigneeOptions"
          placeholder="选择降签人"
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-flex justify="end">
        <n-button @click="emit('update:modelValue', false)">取消</n-button>
        <n-button :type="actionType" :loading="loading" @click="handleSubmit">{{ dialogTitle }}</n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import type { ButtonProps } from 'naive-ui'
import { ref, reactive, computed, watch } from 'vue'
import type { FormRules } from 'naive-ui'
import { workflowApi } from '@/api/workflow'
import { http } from '@/plugins/axios'
import type { RetResult } from '@/api/types'
import { textField } from '@/utils/form-rules'

type ActionType = 'approve' | 'reject' | 'return' | 'delegate' | 'countersign' | 'remove-sign'

const props = defineProps<{
  modelValue: boolean
  taskId: string
  action: ActionType
  returnNodes?: Array<{ label: string; value: string }>
  currentAssignees?: Array<{ label: string; value: string }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const formRef = ref()
const loading = ref(false)
const managerOptions = ref<Array<{ label: string; value: string }>>([])
const managerLoading = ref(false)

const form = reactive({
  comment: '',
  reason: '',
  targetNodeId: '',
  delegateId: '',
  assigneeIds: [] as string[],
  assigneeId: ''
})

const titleMap: Record<ActionType, string> = {
  approve: '通过', reject: '拒绝', return: '回退',
  delegate: '转办', countersign: '加签', 'remove-sign': '降签'
}

const typeMap: Record<ActionType, ButtonProps['type']> = {
  approve: 'success', reject: 'error', return: 'warning',
  delegate: 'info', countersign: 'info', 'remove-sign': 'warning'
}

const dialogTitle = computed(() => titleMap[props.action] || '操作')
const actionType = computed(() => typeMap[props.action] || 'primary')
const returnNodeOptions = computed(() => props.returnNodes || [])
const currentAssigneeOptions = computed(() => props.currentAssignees || [])

const formRules = computed<FormRules>(() => {
  const rules: FormRules = {}
  if (props.action === 'reject') {
    rules.reason = textField('拒绝原因')
  }
  if (props.action === 'return') {
    rules.targetNodeId = { required: true, message: '请选择回退节点', trigger: 'change' }
  }
  if (props.action === 'delegate') {
    rules.delegateId = { required: true, message: '请选择转办人', trigger: 'change' }
  }
  if (props.action === 'countersign') {
    rules.assigneeIds = { type: 'array', required: true, min: 1, message: '请选择加签人', trigger: 'change' }
  }
  return rules
})

watch(() => props.modelValue, (val) => {
  if (val) {
    Object.assign(form, { comment: '', reason: '', targetNodeId: '', delegateId: '', assigneeIds: [], assigneeId: '' })
  }
})

async function searchManagers(query: string) {
  if (!query) return
  managerLoading.value = true
  try {
    const { data: res } = await http.get<RetResult<{ items: any[] }>>('system/manager', {
      params: { keyword: query, pageIndex: 1, pageSize: 20 }
    })
    managerOptions.value = res.data.items.map((m: any) => ({
      label: m.realName || m.managerName,
      value: m.id
    }))
  } finally {
    managerLoading.value = false
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch { return }

  loading.value = true
  try {
    const apiMap: Record<ActionType, () => Promise<any>> = {
      approve: () => workflowApi.taskApprove(props.taskId, { comment: form.comment }),
      reject: () => workflowApi.taskReject(props.taskId, { comment: form.comment, reason: form.reason }),
      return: () => workflowApi.taskReturn(props.taskId, { targetNodeId: form.targetNodeId, comment: form.comment }),
      delegate: () => workflowApi.taskDelegate(props.taskId, { delegateId: form.delegateId, comment: form.comment }),
      countersign: () => workflowApi.taskCountersign(props.taskId, { assigneeIds: form.assigneeIds, comment: form.comment }),
      'remove-sign': () => workflowApi.taskRemoveSign(props.taskId, { assigneeId: form.assigneeId, comment: form.comment })
    }
    await apiMap[props.action]()
    emit('success')
    emit('update:modelValue', false)
  } finally {
    loading.value = false
  }
}
</script>
