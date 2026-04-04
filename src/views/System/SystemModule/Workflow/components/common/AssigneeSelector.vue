<template>
  <div class="assignee-selector">
    <n-form-item label="审批人类型">
      <n-radio-group v-model:value="localType" @update:value="handleTypeChange">
        <n-radio value="MANAGER">指定人员</n-radio>
        <n-radio value="ROLE">指定角色</n-radio>
        <n-radio value="INITIATOR">发起人</n-radio>
        <n-radio value="INITIATOR_DEPT_LEADER">发起人部门主管</n-radio>
      </n-radio-group>
    </n-form-item>

    <n-form-item v-if="localType === 'MANAGER'" label="选择人员">
      <n-select
        v-model:value="localIds"
        multiple
        filterable
        remote
        :options="managerOptions"
        :loading="managerLoading"
        placeholder="搜索并选择人员"
        @search="searchManagers"
        @update:value="handleIdsChange"
      />
    </n-form-item>

    <n-form-item v-if="localType === 'ROLE'" label="选择角色">
      <n-select
        v-model:value="localIds"
        multiple
        filterable
        :options="roleOptions"
        :loading="roleLoading"
        placeholder="选择角色"
        @update:value="handleIdsChange"
      />
    </n-form-item>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import type { SelectOption } from 'naive-ui'
import { http } from '@/plugins/axios'
import type { RetResult } from '@/api/types'

const props = defineProps<{
  assigneeType: string
  assigneeIds: string[]
}>()

const emit = defineEmits<{
  'update:assigneeType': [value: string]
  'update:assigneeIds': [value: string[]]
}>()

const localType = ref(props.assigneeType || 'MANAGER')
const localIds = ref<string[]>(props.assigneeIds || [])

watch(() => props.assigneeType, v => { localType.value = v })
watch(() => props.assigneeIds, v => { localIds.value = v || [] })

// Manager search
const managerOptions = ref<SelectOption[]>([])
const managerLoading = ref(false)

async function searchManagers(query: string) {
  if (!query || query.length < 1) return
  managerLoading.value = true
  try {
    const { data: res } = await http.get<RetResult<{ items: any[]; total: number }>>('system/manager', {
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

// Role options
const roleOptions = ref<SelectOption[]>([])
const roleLoading = ref(false)

async function loadRoles() {
  roleLoading.value = true
  try {
    const { data: res } = await http.get<RetResult<{ items: any[]; total: number }>>('system/role', {
      params: { pageIndex: 1, pageSize: 100 }
    })
    roleOptions.value = res.data.items.map((r: any) => ({
      label: r.name,
      value: r.id
    }))
  } finally {
    roleLoading.value = false
  }
}

onMounted(loadRoles)

function handleTypeChange(value: string) {
  localIds.value = []
  emit('update:assigneeType', value)
  emit('update:assigneeIds', [])
}

function handleIdsChange(value: string[]) {
  emit('update:assigneeIds', value)
}
</script>

<style lang="scss" scoped>
.assignee-selector {
  width: 100%;
}
</style>
