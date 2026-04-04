<!-- src/views/System/SystemModule/Workflow/components/designer/NodeCard.vue -->
<template>
  <div
    class="wf-node-card"
    :class="[
      `wf-node-card--${node.type.toLowerCase()}`,
      { 'wf-node-card--selected': isSelected }
    ]"
    @click.stop="handleClick"
  >
    <div class="wf-node-card__header">
      <div class="wf-node-card__icon">
        <component :is="nodeIcon" :size="16" />
      </div>
      <span class="wf-node-card__title">{{ node.name }}</span>
      <div v-if="showActions" class="wf-node-card__actions">
        <n-button
          v-if="canDelete"
          text
          type="error"
          size="tiny"
          @click.stop="emit('delete', node.id)"
        >
          <template #icon><Trash2 :size="14" /></template>
        </n-button>
      </div>
    </div>
    <div class="wf-node-card__body">
      <span class="wf-node-card__desc">{{ description }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { DesignerTreeNode, NodeType } from '@/api/workflow'
import { useWorkflowStore } from '@/stores/workflow'
import {
  Play, Square, UserCheck, Send, GitBranch, GitFork,
  Clock, Zap, CornerUpRight, Workflow, Trash2
} from 'lucide-vue-next'

const props = defineProps<{
  node: DesignerTreeNode
  readonly?: boolean
}>()

const emit = defineEmits<{
  delete: [nodeId: string]
}>()

const store = useWorkflowStore()
const isSelected = computed(() => store.selectedNodeId === props.node.id)
const canDelete = computed(() => !props.readonly && props.node.type !== 'START' && props.node.type !== 'END')
const showActions = computed(() => !props.readonly && props.node.type !== 'START' && props.node.type !== 'END')

const iconMap: Record<NodeType, any> = {
  START: Play,
  END: Square,
  APPROVAL: UserCheck,
  CC: Send,
  CONDITION: GitBranch,
  CONDITION_GROUP: GitBranch,
  PARALLEL: GitFork,
  DELAY: Clock,
  TRIGGER: Zap,
  JUMP: CornerUpRight,
  SUB_PROCESS: Workflow
}

const nodeIcon = computed(() => iconMap[props.node.type] || Workflow)

const description = computed(() => {
  const c = props.node.config
  switch (props.node.type) {
    case 'START': return '流程开始'
    case 'END': return '流程结束'
    case 'APPROVAL': {
      const modeMap: Record<string, string> = { ANY: '任一审批', ALL: '会签', SEQUENTIAL: '顺序审批' }
      return modeMap[c.approvalMode] || '审批'
    }
    case 'CC': return `抄送 ${c.ccIds?.length || 0} 人`
    case 'DELAY': return `等待 ${c.delayTime || 0} ${c.delayUnit || '分钟'}`
    case 'TRIGGER': return c.triggerKey || '未配置'
    case 'JUMP': return c.targetNodeId ? '跳转到指定节点' : '未配置'
    case 'CONDITION_GROUP': return `${props.node.branches?.length || 0} 个条件分支`
    case 'PARALLEL': return `${props.node.branches?.length || 0} 个并行分支`
    default: return ''
  }
})

function handleClick() {
  store.selectNode(props.node.id)
}
</script>

<style lang="scss">
// Styles provided by global workflow.scss — no scoped overrides needed
</style>
