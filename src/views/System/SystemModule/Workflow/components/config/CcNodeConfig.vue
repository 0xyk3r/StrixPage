<template>
  <n-form label-placement="left" label-width="auto">
    <n-form-item label="节点名称">
      <n-input v-model:value="config.name" @update:value="emitUpdate" />
    </n-form-item>

    <assignee-selector
      :assignee-type="config.assigneeType"
      :assignee-ids="config.assigneeIds"
      @update:assignee-type="
        (v) => {
          config.assigneeType = v;
          emitUpdate();
        }
      "
      @update:assignee-ids="
        (v) => {
          config.assigneeIds = v;
          emitUpdate();
        }
      "
    />
  </n-form>
</template>

<script lang="ts" setup>
import { reactive, watch } from "vue";
import type { DesignerTreeNode } from "@/api/workflow";
import AssigneeSelector from "../common/AssigneeSelector.vue";

const props = defineProps<{ node: DesignerTreeNode }>();
const emit = defineEmits<{ update: [config: Record<string, any>, name: string] }>();

const config = reactive({
  name: props.node.name,
  assigneeType: props.node.config.assigneeType || "MANAGER",
  assigneeIds: props.node.config.assigneeIds || [],
});

watch(
  () => props.node.id,
  () => {
    Object.assign(config, {
      name: props.node.name,
      assigneeType: props.node.config.assigneeType || "MANAGER",
      assigneeIds: props.node.config.assigneeIds || [],
    });
  },
);

function emitUpdate() {
  const { name, ...rest } = config;
  emit("update", rest, name);
}
</script>
