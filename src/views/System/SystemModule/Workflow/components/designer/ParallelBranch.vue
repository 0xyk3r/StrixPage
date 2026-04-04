<!-- src/views/System/SystemModule/Workflow/components/designer/ParallelBranch.vue -->
<template>
  <div class="wf-branch wf-branch--parallel">
    <div class="wf-branch__top-line"></div>

    <div class="wf-branch__container">
      <div v-if="!readonly" class="wf-branch__add" @click="store.addBranch(node.id)">
        <n-button size="tiny" quaternary type="info">+ 添加分支</n-button>
      </div>

      <div class="wf-branch__lanes">
        <div
          v-for="(branch, idx) in node.branches"
          :key="branch.id"
          class="wf-branch__lane"
        >
          <div class="wf-branch__header">
            <span class="wf-branch__label">{{ branch.name }}</span>
            <n-button
              v-if="!readonly && node.branches!.length > 2"
              text type="error" size="tiny"
              @click="store.removeBranch(node.id, branch.id)"
            >
              <template #icon><X :size="12" /></template>
            </n-button>
          </div>

          <div class="wf-branch__line-down"></div>

          <div class="wf-branch__children">
            <template v-if="branch.children.length > 0">
              <template v-for="(child, ci) in branch.children" :key="child.id">
                <node-card
                  :node="child"
                  :readonly="readonly"
                  @delete="id => store.deleteNode(id)"
                />
                <node-connector
                  v-if="ci < branch.children.length - 1"
                  :readonly="readonly"
                  @add-node="type => store.addNode(child.id, type)"
                />
              </template>
            </template>
            <div v-else class="wf-branch__empty">
              <add-node-menu v-if="!readonly" @select="type => addNodeToBranch(branch.id, idx, type)" />
            </div>
          </div>

          <div class="wf-branch__line-down"></div>
        </div>
      </div>
    </div>

    <div class="wf-branch__bottom-line"></div>
  </div>
</template>

<script lang="ts" setup>
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
  const branch = props.node.branches?.find(b => b.id === branchId)
  if (branch) {
    const newNode = createNode(type)
    branch.children.push(newNode)
    store.selectNode(newNode.id)
  }
}
</script>

<style lang="scss">
// Styles provided by global workflow.scss — no scoped overrides needed
</style>
