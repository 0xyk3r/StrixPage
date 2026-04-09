<!-- src/views/System/SystemModule/Workflow/components/designer/AddNodeMenu.vue -->
<template>
  <n-popover trigger="click" placement="bottom" :show="showMenu" @update:show="showMenu = $event">
    <template #trigger>
      <div class="wf-add-btn" @click.stop="showMenu = true">
        <n-button circle size="tiny" type="primary">
          <template #icon><Plus :size="12" /></template>
        </n-button>
      </div>
    </template>
    <div class="wf-add-menu">
      <div class="wf-add-menu__title">添加节点</div>
      <div class="wf-add-menu__grid">
        <div v-for="item in nodeOptions" :key="item.type" class="wf-add-menu__item"
             @click="handleSelect(item.type)">
          <div class="wf-add-menu__icon"
               :class="`wf-add-menu__icon--${item.type.toLowerCase().replace('_', '-')}`">
            <component :is="item.icon" :size="16" color="#fff" />
          </div>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </div>
  </n-popover>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { NodeType } from '@/api/workflow'
import {
  Plus,
  UserCheck,
  Send,
  GitBranch,
  GitFork,
  Clock,
  Zap,
  CornerUpRight,
  Workflow
} from 'lucide-vue-next'

const emit = defineEmits<{
  select: [type: NodeType]
}>()

const showMenu = ref(false)

const nodeOptions = [
  { type: 'APPROVAL' as NodeType, label: '审批', icon: UserCheck },
  { type: 'CC' as NodeType, label: '抄送', icon: Send },
  { type: 'CONDITION_GROUP' as NodeType, label: '条件分支', icon: GitBranch },
  { type: 'PARALLEL' as NodeType, label: '并行分支', icon: GitFork },
  { type: 'DELAY' as NodeType, label: '延迟', icon: Clock },
  { type: 'TRIGGER' as NodeType, label: '触发器', icon: Zap },
  { type: 'JUMP' as NodeType, label: '跳转', icon: CornerUpRight },
  { type: 'SUB_PROCESS' as NodeType, label: '子流程', icon: Workflow }
]

function handleSelect(type: NodeType) {
  showMenu.value = false
  emit('select', type)
}
</script>

<style lang="scss">
// Styles provided by global workflow.scss — no scoped overrides needed
</style>
