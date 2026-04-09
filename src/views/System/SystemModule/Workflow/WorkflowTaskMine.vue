<!-- src/views/System/SystemModule/Workflow/WorkflowTaskMine.vue -->
<template>
  <div>
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="listParams.keyword" clearable placeholder="搜索流程名称..." />
              <n-button ghost type="primary" @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
        </n-grid>
      </template>
    </strix-block>

    <n-data-table
      :columns="columns"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="pagination"
      :row-key="(row: any) => row.id"
      table-layout="fixed"
    />

    <task-action-dialog
      v-model="showAction"
      :task-id="currentTaskId"
      :action="currentAction"
      @success="getDataList"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, h, onMounted } from "vue";
import { useRouter } from "vue-router";
import StrixBlock from "@/components/common/StrixBlock.vue";
import TaskActionDialog from "./components/common/TaskActionDialog.vue";
import { workflowApi } from "@/api/workflow";
import type { WfTask } from "@/api/workflow";
import { handleOperate } from "@/utils/strix-table-tool";
import type { DataTableColumns } from "naive-ui";

const router = useRouter();
const dataRef = ref<WfTask[]>([]);
const dataLoading = ref(true);
const listParams = ref({ keyword: null as string | null, pageIndex: 1, pageSize: 10 });
const pagination = ref({ page: 1, pageSize: 10, itemCount: 0, showSizePicker: true });

const showAction = ref(false);
const currentTaskId = ref("");
const currentAction = ref<any>("approve");

function clearSearch() {
  listParams.value.keyword = null;
  getDataList();
}

const columns: DataTableColumns = [
  { key: "instanceTitle", title: "流程名称", width: 200 },
  { key: "nodeName", title: "当前节点", width: 150 },
  { key: "createdTime", title: "到达时间", width: 180 },
  {
    key: "actions",
    title: "操作",
    width: 320,
    align: "center",
    render(row: any) {
      return handleOperate([
        {
          type: "success",
          label: "通过",
          icon: "check",
          onClick: () => openAction(row.id, "approve"),
        },
        { type: "error", label: "拒绝", icon: "x", onClick: () => openAction(row.id, "reject") },
        {
          type: "warning",
          label: "回退",
          icon: "undo",
          onClick: () => openAction(row.id, "return"),
        },
        {
          type: "info",
          label: "转办",
          icon: "user-plus",
          onClick: () => openAction(row.id, "delegate"),
        },
        {
          type: "primary",
          label: "详情",
          icon: "eye",
          onClick: () =>
            router.push({ name: "WorkflowInstanceDetail", params: { id: row.instanceId } }),
        },
      ]);
    },
  },
];

function openAction(taskId: string, action: string) {
  currentTaskId.value = taskId;
  currentAction.value = action;
  showAction.value = true;
}

async function getDataList() {
  dataLoading.value = true;
  try {
    const { data: res } = await workflowApi.tasksMine(listParams.value);
    dataRef.value = res.data.items;
    pagination.value.itemCount = res.data.total;
  } finally {
    dataLoading.value = false;
  }
}

onMounted(getDataList);
</script>
