<template>
  <n-form label-placement="left" label-width="auto">
    <n-form-item label="节点名称">
      <n-input v-model:value="config.name" @update:value="emitUpdate" />
    </n-form-item>
    <n-form-item label="跳转目标">
      <n-select
        v-model:value="config.targetNodeId"
        :options="nodeOptions"
        placeholder="选择目标节点"
        filterable
        @update:value="emitUpdate"
      />
    </n-form-item>
  </n-form>
</template>

<script lang="ts" setup>
import { reactive, watch, computed } from 'vue'
import type { DesignerTreeNode } from '@/api/workflow'
import { useWorkflowStore } from '@/stores/workflow'

const props = defineProps<{ node: DesignerTreeNode }>()
const emit = defineEmits<{ update: [config: Record<string, any>, name: string] }>()

const store = useWorkflowStore()

const config = reactive({
  name: props.node.name,
  targetNodeId: props.node.config.targetNodeId || ''
})

// Collect all node IDs from tree for selection (exclude self, START, END)
const nodeOptions = computed(() => {
  const options: Array<{ label: string; value: string }> = []
  collectNodes(store.tree, options)
  return options.filter((o) => o.value !== props.node.id)
})

function collectNodes(node: DesignerTreeNode, acc: Array<{ label: string; value: string }>) {
  if (node.type !== 'START' && node.type !== 'END') {
    acc.push({ label: `${node.name} (${node.type})`, value: node.id })
  }
  if (node.branches) {
    for (const branch of node.branches) {
      for (const child of branch.children) {
        collectNodes(child, acc)
      }
    }
  }
  if (node.next) {
    collectNodes(node.next, acc)
  }
}

watch(
  () => props.node.id,
  () => {
    config.name = props.node.name
    config.targetNodeId = props.node.config.targetNodeId || ''
  }
)

function emitUpdate() {
  emit('update', { targetNodeId: config.targetNodeId }, config.name)
}
</script>
