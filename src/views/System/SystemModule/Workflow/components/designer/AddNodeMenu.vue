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
        <div
          v-for="item in nodeOptions"
          :key="item.type"
          class="wf-add-menu__item"
          @click="handleSelect(item.type)"
        >
          <div class="wf-add-menu__icon" :style="{ background: item.color }">
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
  Plus, UserCheck, Send, GitBranch, GitFork,
  Clock, Zap, CornerUpRight, Workflow
} from 'lucide-vue-next'

const emit = defineEmits<{
  select: [type: NodeType]
}>()

const showMenu = ref(false)

const nodeOptions = [
  { type: 'APPROVAL' as NodeType, label: '审批', icon: UserCheck, color: '#409eff' },
  { type: 'CC' as NodeType, label: '抄送', icon: Send, color: '#e6a23c' },
  { type: 'CONDITION_GROUP' as NodeType, label: '条件分支', icon: GitBranch, color: '#e6a23c' },
  { type: 'PARALLEL' as NodeType, label: '并行分支', icon: GitFork, color: '#909399' },
  { type: 'DELAY' as NodeType, label: '延迟', icon: Clock, color: '#f56c6c' },
  { type: 'TRIGGER' as NodeType, label: '触发器', icon: Zap, color: '#9b59b6' },
  { type: 'JUMP' as NodeType, label: '跳转', icon: CornerUpRight, color: '#00b894' },
  { type: 'SUB_PROCESS' as NodeType, label: '子流程', icon: Workflow, color: '#3498db' }
]

function handleSelect(type: NodeType) {
  showMenu.value = false
  emit('select', type)
}
</script>

<style lang="scss" scoped>
.wf-add-btn {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}

.wf-add-menu {
  width: 280px;

  &__title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #303133;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
    font-size: 12px;
    color: #606266;

    &:hover { background: #f5f7fa; }
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
