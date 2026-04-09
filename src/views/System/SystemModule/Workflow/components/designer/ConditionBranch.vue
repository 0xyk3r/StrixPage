<!-- src/views/System/SystemModule/Workflow/components/designer/ConditionBranch.vue -->
<template>
  <div class="wf-branch wf-branch--condition">
    <!-- Top connector: single line splits into branches -->
    <div class="wf-branch__top-line"></div>

    <div class="wf-branch__container">
      <!-- Add branch button -->
      <div v-if="!readonly" class="wf-branch__add" @click="store.addBranch(node.id)">
        <n-button size="tiny" quaternary type="warning">+ 添加条件</n-button>
      </div>

      <div class="wf-branch__lanes">
        <div v-for="(branch, idx) in node.branches" :key="branch.id" class="wf-branch__lane">
          <!-- Branch header -->
          <div class="wf-branch__header">
            <span class="wf-branch__label">{{ branch.name }}</span>
            <n-button
              v-if="!readonly && node.branches!.length > 2"
              text
              type="error"
              size="tiny"
              @click="store.removeBranch(node.id, branch.id)"
            >
              <template #icon><X :size="12" /></template>
            </n-button>
          </div>

          <!-- Branch connector line -->
          <div class="wf-branch__line-down"></div>

          <!-- Branch children -->
          <div class="wf-branch__children">
            <template v-if="branch.children.length > 0">
              <template v-for="(child, ci) in branch.children" :key="child.id">
                <render-branch-node :node="child" :readonly="readonly" />
                <node-connector
                  v-if="ci < branch.children.length - 1"
                  :readonly="readonly"
                  @add-node="(type) => store.addNode(child.id, type)"
                />
              </template>
            </template>
            <div v-else class="wf-branch__empty">
              <add-node-menu v-if="!readonly"
                             @select="(type) => addNodeToBranch(branch.id, idx, type)" />
            </div>
          </div>

          <!-- Bottom connector line -->
          <div class="wf-branch__line-down"></div>
        </div>
      </div>
    </div>

    <!-- Bottom connector: branches reconverge -->
    <div class="wf-branch__bottom-line"></div>
  </div>
</template>

<script lang="ts" setup>
import { h, defineComponent } from 'vue'
import type { DesignerTreeNode, NodeType } from '@/api/workflow'
import { useWorkflowStore } from '@/stores/workflow'
import { createNode } from '@/utils/workflow-graph'
import NodeCard from './NodeCard.vue'
import NodeConnector from './NodeConnector.vue'
import AddNodeMenu from './AddNodeMenu.vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  node: DesignerTreeNode
  readonly?: boolean
}>()

const store = useWorkflowStore()

function addNodeToBranch(branchId: string, branchIdx: number, type: NodeType) {
  const branch = props.node.branches?.find((b) => b.id === branchId)
  if (branch) {
    const newNode = createNode(type)
    branch.children.push(newNode)
    store.selectNode(newNode.id)
  }
}

// Sub-renderer for branch children (avoids circular import)
const RenderBranchNode = defineComponent({
  name: 'RenderBranchNode',
  props: {
    node: { type: Object as () => DesignerTreeNode, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(nodeProps) {
    return () => {
      return h(NodeCard, {
        node: nodeProps.node,
        readonly: nodeProps.readonly,
        onDelete: (id: string) => store.deleteNode(id)
      })
    }
  }
})
</script>

<style lang="scss">
// Styles provided by global workflow.scss — no scoped overrides needed
</style>
