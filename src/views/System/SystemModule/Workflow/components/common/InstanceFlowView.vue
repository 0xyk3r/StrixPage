<!-- src/views/System/SystemModule/Workflow/components/common/InstanceFlowView.vue -->
<template>
  <div class="wf-flow-view">
    <div v-if="loading" class="wf-flow-view__loading">
      <n-spin size="large" />
    </div>
    <designer-canvas v-else-if="tree" :readonly="true" />
    <n-empty v-else description="暂无流程图数据" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { workflowApi } from '@/api/workflow'
import { graphToTree } from '@/utils/workflow-graph'
import type { DesignerTreeNode, WorkflowGraph } from '@/api/workflow'
import { useWorkflowStore } from '@/stores/workflow'
import DesignerCanvas from '../designer/DesignerCanvas.vue'

const props = defineProps<{
  instanceId: string
}>()

const store = useWorkflowStore()
const loading = ref(true)
const tree = ref<DesignerTreeNode | null>(null)

async function loadGraph() {
  loading.value = true
  try {
    const { data: res } = await workflowApi.instanceGraph(props.instanceId)
    if (res.data.graphJson) {
      const graph: WorkflowGraph = JSON.parse(res.data.graphJson)
      const graphTree = graphToTree(graph)
      // For read-only view, directly set the store tree temporarily
      store.tree = graphTree
      tree.value = graphTree
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadGraph)
watch(() => props.instanceId, loadGraph)
</script>

<style lang="scss" scoped>
.wf-flow-view {
  width: 100%;
  min-height: 300px;

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }
}
</style>
