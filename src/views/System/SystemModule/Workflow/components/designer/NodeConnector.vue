<!-- src/views/System/SystemModule/Workflow/components/designer/NodeConnector.vue -->
<template>
  <div class="wf-connector">
    <div class="wf-connector__line"></div>
    <add-node-menu v-if="!readonly" @select="(type) => emit('addNode', type)" />
    <div class="wf-connector__line"></div>
  </div>
</template>

<script lang="ts" setup>
import AddNodeMenu from "./AddNodeMenu.vue";
import type { NodeType } from "@/api/workflow";

defineProps<{
  readonly?: boolean;
}>();

const emit = defineEmits<{
  addNode: [type: NodeType];
}>();
</script>

<style lang="scss">
// Styles provided by global workflow.scss — no scoped overrides needed
</style>
