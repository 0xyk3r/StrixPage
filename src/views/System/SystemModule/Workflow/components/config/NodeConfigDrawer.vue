<template>
  <n-drawer :show="!!store.selectedNode" :width="400" placement="right" @update:show="handleClose">
    <n-drawer-content :title="drawerTitle" closable>
      <template v-if="store.selectedNode">
        <approval-node-config
          v-if="store.selectedNode.type === 'APPROVAL'"
          :node="store.selectedNode"
          @update="handleUpdate"
        />
        <cc-node-config
          v-else-if="store.selectedNode.type === 'CC'"
          :node="store.selectedNode"
          @update="handleUpdate"
        />
        <condition-node-config
          v-else-if="store.selectedNode.type === 'CONDITION'"
          :node="store.selectedNode"
          @update="handleUpdate"
        />
        <delay-node-config
          v-else-if="store.selectedNode.type === 'DELAY'"
          :node="store.selectedNode"
          @update="handleUpdate"
        />
        <trigger-node-config
          v-else-if="store.selectedNode.type === 'TRIGGER'"
          :node="store.selectedNode"
          @update="handleUpdate"
        />
        <jump-node-config
          v-else-if="store.selectedNode.type === 'JUMP'"
          :node="store.selectedNode"
          @update="handleUpdate"
        />
        <div v-else class="config-placeholder">
          <n-empty description="该节点类型无需配置" />
        </div>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'
import ApprovalNodeConfig from './ApprovalNodeConfig.vue'
import CcNodeConfig from './CcNodeConfig.vue'
import ConditionNodeConfig from './ConditionNodeConfig.vue'
import DelayNodeConfig from './DelayNodeConfig.vue'
import TriggerNodeConfig from './TriggerNodeConfig.vue'
import JumpNodeConfig from './JumpNodeConfig.vue'

const store = useWorkflowStore()

const drawerTitle = computed(() => {
  if (!store.selectedNode) return ''
  return `配置: ${store.selectedNode.name}`
})

function handleUpdate(config: Record<string, any>, name: string) {
  if (!store.selectedNode) return
  store.updateNodeConfig(store.selectedNode.id, config)
  if (name !== store.selectedNode.name) {
    store.updateNodeName(store.selectedNode.id, name)
  }
}

function handleClose(show: boolean) {
  if (!show) {
    store.selectNode(null)
  }
}
</script>

<style lang="scss" scoped>
.config-placeholder {
  padding: 40px 0;
}
</style>
