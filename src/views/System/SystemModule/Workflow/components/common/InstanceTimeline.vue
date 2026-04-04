<!-- src/views/System/SystemModule/Workflow/components/common/InstanceTimeline.vue -->
<template>
  <n-timeline>
    <n-timeline-item
      v-for="log in logs"
      :key="log.id"
      :type="getLogType(log.action)"
      :title="log.nodeName"
      :content="log.comment || log.detail || ''"
      :time="log.createdTime"
    >
      <template #header>
        <n-flex align="center" :size="8">
          <span class="timeline-action">{{ getActionLabel(log.action) }}</span>
          <span v-if="log.operatorName" class="timeline-operator">{{ log.operatorName }}</span>
        </n-flex>
      </template>
    </n-timeline-item>
  </n-timeline>
</template>

<script lang="ts" setup>
import type { WfLog } from '@/api/workflow'

defineProps<{
  logs: WfLog[]
}>()

const actionLabels: Record<string, string> = {
  START: '发起流程',
  APPROVE: '通过',
  REJECT: '拒绝',
  RETURN: '回退',
  DELEGATE: '转办',
  COUNTERSIGN: '加签',
  REMOVE_SIGN: '降签',
  WITHDRAW: '撕回',
  CC: '抄送',
  AUTO_COMPLETE: '自动完成',
  TIMEOUT: '超时',
  CANCEL: '撤销',
  COMPLETE: '流程结束',
  SUSPEND: '挂起',
  RESUME: '恢复'
}

const typeMap: Record<string, string> = {
  START: 'info',
  APPROVE: 'success',
  REJECT: 'error',
  RETURN: 'warning',
  DELEGATE: 'info',
  COMPLETE: 'success',
  CANCEL: 'error'
}

function getActionLabel(action: string): string {
  return actionLabels[action] || action
}

function getLogType(action: string): 'default' | 'info' | 'success' | 'warning' | 'error' {
  return (typeMap[action] || 'default') as any
}
</script>

<style lang="scss" scoped>
.timeline-action {
  font-weight: 600;
  font-size: 13px;
}
.timeline-operator {
  font-size: 12px;
  color: #909399;
}
</style>
