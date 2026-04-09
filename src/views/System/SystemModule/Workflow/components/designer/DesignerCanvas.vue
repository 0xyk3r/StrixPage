<!-- src/views/System/SystemModule/Workflow/components/designer/DesignerCanvas.vue -->
<template>
  <div class="wf-canvas" @click="store.selectNode(null)">
    <div class="wf-canvas__flow">
      <render-node :node="store.tree" :readonly="readonly" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, defineComponent } from "vue";
import type { DesignerTreeNode, NodeType } from "@/api/workflow";
import { useWorkflowStore } from "@/stores/workflow";
import NodeCard from "./NodeCard.vue";
import NodeConnector from "./NodeConnector.vue";
import ConditionBranch from "./ConditionBranch.vue";
import ParallelBranch from "./ParallelBranch.vue";

defineProps<{
  readonly?: boolean;
}>();

const store = useWorkflowStore();

// Recursive render component
const RenderNode = defineComponent({
  name: "RenderNode",
  props: {
    node: { type: Object as () => DesignerTreeNode, required: true },
    readonly: { type: Boolean, default: false },
  },
  setup(props) {
    return () => {
      const elements: any[] = [];

      // 1. Render the node card
      elements.push(
        h(NodeCard, {
          node: props.node,
          readonly: props.readonly,
          onDelete: (id: string) => store.deleteNode(id),
        }),
      );

      // 2. If branches exist (CONDITION_GROUP or PARALLEL)
      if (props.node.branches && props.node.branches.length > 0) {
        const BranchComponent =
          props.node.type === "CONDITION_GROUP" ? ConditionBranch : ParallelBranch;

        elements.push(
          h(BranchComponent, {
            node: props.node,
            readonly: props.readonly,
          }),
        );
      }

      // 3. Connector + next node
      if (props.node.next) {
        elements.push(
          h(NodeConnector, {
            readonly: props.readonly,
            onAddNode: (type: NodeType) => store.addNode(props.node.id, type),
          }),
        );
        elements.push(
          h(RenderNode, {
            node: props.node.next,
            readonly: props.readonly,
          }),
        );
      }

      return h("div", { class: "wf-canvas__node-wrapper" }, elements);
    };
  },
});
</script>

<style lang="scss">
// Styles provided by global workflow.scss — no scoped overrides needed
</style>
