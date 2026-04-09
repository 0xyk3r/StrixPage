<template>
  <n-form label-placement="left" label-width="auto">
    <n-form-item label="节点名称">
      <n-input v-model:value="config.name" @update:value="emitUpdate" />
    </n-form-item>

    <n-form-item label="审批模式">
      <n-radio-group v-model:value="config.approvalMode" @update:value="emitUpdate">
        <n-radio-button value="ANY">任一通过</n-radio-button>
        <n-radio-button value="ALL">会签(全部)</n-radio-button>
        <n-radio-button value="SEQUENTIAL">顺序审批</n-radio-button>
      </n-radio-group>
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

    <n-divider />

    <n-form-item label="允许转办">
      <n-switch v-model:value="config.allowDelegate" @update:value="emitUpdate" />
    </n-form-item>
    <n-form-item label="允许回退">
      <n-switch v-model:value="config.allowReturn" @update:value="emitUpdate" />
    </n-form-item>
    <n-form-item label="允许加签">
      <n-switch v-model:value="config.allowCountersign" @update:value="emitUpdate" />
    </n-form-item>
    <n-form-item label="允许撕回">
      <n-switch v-model:value="config.allowWithdraw" @update:value="emitUpdate" />
    </n-form-item>

    <n-divider />

    <n-form-item label="超时(小时)">
      <n-input-number
        v-model:value="config.timeoutHours"
        :min="0"
        :max="720"
        @update:value="emitUpdate"
      />
    </n-form-item>
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
  approvalMode: props.node.config.approvalMode || "ANY",
  assigneeType: props.node.config.assigneeType || "MANAGER",
  assigneeIds: props.node.config.assigneeIds || [],
  allowDelegate: props.node.config.allowDelegate ?? true,
  allowReturn: props.node.config.allowReturn ?? true,
  allowCountersign: props.node.config.allowCountersign ?? true,
  allowWithdraw: props.node.config.allowWithdraw ?? true,
  timeoutHours: props.node.config.timeoutHours ?? 0,
});

watch(
  () => props.node.id,
  () => {
    Object.assign(config, {
      name: props.node.name,
      approvalMode: props.node.config.approvalMode || "ANY",
      assigneeType: props.node.config.assigneeType || "MANAGER",
      assigneeIds: props.node.config.assigneeIds || [],
      allowDelegate: props.node.config.allowDelegate ?? true,
      allowReturn: props.node.config.allowReturn ?? true,
      allowCountersign: props.node.config.allowCountersign ?? true,
      allowWithdraw: props.node.config.allowWithdraw ?? true,
      timeoutHours: props.node.config.timeoutHours ?? 0,
    });
  },
);

function emitUpdate() {
  const { name, ...rest } = config;
  emit("update", rest, name);
}
</script>
