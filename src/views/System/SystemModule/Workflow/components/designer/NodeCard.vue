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

<style lang="scss" scoped>
.wf-node-card {
  width: 220px;
  border-radius: 8px;
  border: 2px solid #e4e7ed;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;

  &:hover { border-color: #409eff; box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15); }
  &--selected { border-color: #409eff; box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3); }

  &--start { border-color: #67c23a; .wf-node-card__header { background: #f0f9eb; } }
  &--end { border-color: #909399; .wf-node-card__header { background: #f4f4f5; } }
  &--approval { border-color: #409eff; .wf-node-card__header { background: #ecf5ff; } }
  &--cc { border-color: #e6a23c; .wf-node-card__header { background: #fdf6ec; } }
  &--condition, &--condition_group { border-color: #e6a23c; .wf-node-card__header { background: #fdf6ec; } }
  &--parallel { border-color: #909399; .wf-node-card__header { background: #f4f4f5; } }
  &--delay { border-color: #f56c6c; .wf-node-card__header { background: #fef0f0; } }
  &--trigger { border-color: #9b59b6; .wf-node-card__header { background: #f3e8ff; } }
  &--jump { border-color: #00b894; .wf-node-card__header { background: #e8fff8; } }

  &__header {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-radius: 6px 6px 0 0;
    gap: 8px;
  }

  &__icon { display: flex; align-items: center; }
  &__title { flex: 1; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__actions { display: flex; gap: 4px; }

  &__body {
    padding: 8px 12px;
  }

  &__desc {
    font-size: 12px;
    color: #909399;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
  }
}
</style>
