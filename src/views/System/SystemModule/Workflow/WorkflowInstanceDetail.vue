<!-- src/views/System/SystemModule/Workflow/WorkflowInstanceDetail.vue -->
<template>
  <div v-if="instance" class="instance-detail">
    <!-- Header -->
    <n-card size="small">
      <n-descriptions :column="3" label-placement="left" bordered>
        <n-descriptions-item label="流程名称">{{ instance.title }}</n-descriptions-item>
        <n-descriptions-item label="发起人">{{
          instance.initiatorName || instance.initiatorId
        }}</n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="statusType" size="small">{{ statusLabel }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="发起时间">{{ instance.startTime }}</n-descriptions-item>
        <n-descriptions-item label="结束时间">{{ instance.endTime || "-" }}</n-descriptions-item>
        <n-descriptions-item label="业务关联">{{
          instance.bizType ? `${instance.bizType}:${instance.bizId}` : "-"
        }}</n-descriptions-item>
      </n-descriptions>
    </n-card>

    <!-- Tabs: Timeline / Flow View -->
    <n-tabs type="line" style="margin-top: 16px">
      <n-tab-pane name="timeline" tab="审批记录">
        <instance-timeline :logs="logs" />
      </n-tab-pane>
      <n-tab-pane name="flow" tab="流程图">
        <instance-flow-view :instance-id="instanceId" />
      </n-tab-pane>
    </n-tabs>

    <!-- Actions (for running instances) -->
    <n-card v-if="instance.status === 1" size="small" style="margin-top: 16px">
      <n-flex :size="12">
        <n-button type="warning" ghost @click="handleSuspend" :disabled="instance.status !== 1"
          >挂起</n-button
        >
        <n-button type="error" ghost @click="handleCancel">撤销流程</n-button>
      </n-flex>
    </n-card>
  </div>
  <div v-else class="instance-detail__loading">
    <n-spin size="large" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useMessage, useDialog } from "naive-ui";
import { workflowApi } from "@/api/workflow";
import type { WfInstance, WfLog } from "@/api/workflow";
import InstanceTimeline from "./components/common/InstanceTimeline.vue";
import InstanceFlowView from "./components/common/InstanceFlowView.vue";

const route = useRoute();
const message = useMessage();
const dialog = useDialog();
const instanceId = route.params.id as string;

const instance = ref<WfInstance | null>(null);
const logs = ref<WfLog[]>([]);

const statusMap: Record<number, { label: string; type: string }> = {
  1: { label: "运行中", type: "info" },
  2: { label: "已完成", type: "success" },
  3: { label: "已拒绝", type: "error" },
  4: { label: "已撤销", type: "warning" },
  5: { label: "已挂起", type: "default" },
};

const statusLabel = computed(() => statusMap[instance.value?.status ?? 0]?.label || "未知");
const statusType = computed(
  () => (statusMap[instance.value?.status ?? 0]?.type || "default") as any,
);

onMounted(async () => {
  const [instRes, logsRes] = await Promise.all([
    workflowApi.instanceDetail(instanceId),
    workflowApi.instanceLogs(instanceId),
  ]);
  instance.value = instRes.data.data;
  logs.value = logsRes.data.data.items;
});

function handleSuspend() {
  dialog.warning({
    title: "确认挂起",
    content: "挂起后该流程将暂停执行，是否继续？",
    positiveText: "确认",
    negativeText: "取消",
    onPositiveClick: async () => {
      await workflowApi.instanceSuspend(instanceId);
      message.success("已挂起");
      instance.value!.status = 5;
    },
  });
}

function handleCancel() {
  dialog.error({
    title: "确认撤销",
    content: "撤销后该流程将终止，是否继续？",
    positiveText: "确认撤销",
    negativeText: "取消",
    onPositiveClick: async () => {
      await workflowApi.instanceCancel(instanceId, { reason: "管理员撤销" });
      message.success("已撤销");
      instance.value!.status = 4;
    },
  });
}
</script>

<style lang="scss" scoped>
.instance-detail {
  &__loading {
    display: flex;
    justify-content: center;
    padding: 60px 0;
  }
}
</style>
