<!-- src/views/System/SystemModule/Workflow/WorkflowDelegation.vue -->
<template>
  <div>
    <strix-block>
      <template #body>
        <n-flex :size="12">
          <n-button type="primary" @click="showAddModal = true">设置代理</n-button>
        </n-flex>
      </template>
    </strix-block>

    <n-data-table
      :columns="columns"
      :data="delegations"
      :loading="loading"
      :row-key="(row: any) => row.id"
      table-layout="fixed"
    />

    <!-- Add delegation modal -->
    <n-modal v-model:show="showAddModal" preset="card" title="设置审批代理" size="medium">
      <n-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-placement="left"
        label-width="auto"
      >
        <n-form-item label="代理人" path="delegateId">
          <n-select
            v-model:value="form.delegateId"
            filterable
            remote
            :options="managerOptions"
            :loading="managerLoading"
            placeholder="搜索选择代理人"
            @search="searchManagers"
          />
        </n-form-item>
        <n-form-item label="代理流程" path="definitionId">
          <n-select
            v-model:value="form.definitionId"
            :options="definitionOptions"
            placeholder="全部流程（可选）"
            clearable
          />
        </n-form-item>
        <n-form-item label="开始时间" path="startTime">
          <n-date-picker
            v-model:formatted-value="form.startTime"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            clearable
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="结束时间" path="endTime">
          <n-date-picker
            v-model:formatted-value="form.endTime"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            clearable
            style="width: 100%"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="showAddModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="submitDelegation">确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, h } from "vue";
import StrixBlock from "@/components/common/StrixBlock.vue";
import { workflowApi } from "@/api/workflow";
import type { WfDelegation } from "@/api/workflow";
import { handleOperate } from "@/utils/strix-table-tool";
import { http } from "@/plugins/axios";
import type { RetResult } from "@/api/types";
import { type DataTableColumns, type FormRules, useMessage } from "naive-ui";

const message = useMessage();
const delegations = ref<WfDelegation[]>([]);
const loading = ref(true);

const showAddModal = ref(false);
const submitting = ref(false);
const formRef = ref();

const form = reactive({
  delegateId: null as string | null,
  definitionId: null as string | null,
  startTime: "",
  endTime: "",
});

const formRules: FormRules = {
  delegateId: { required: true, message: "请选择代理人", trigger: "change" },
  startTime: { required: true, message: "请选择开始时间", trigger: "change" },
  endTime: { required: true, message: "请选择结束时间", trigger: "change" },
};

// Manager search
const managerOptions = ref<Array<{ label: string; value: string }>>([]);
const managerLoading = ref(false);

async function searchManagers(query: string) {
  if (!query) return;
  managerLoading.value = true;
  try {
    const { data: res } = await http.get<RetResult<{ items: any[] }>>("system/manager", {
      params: { keyword: query, pageIndex: 1, pageSize: 20 },
    });
    managerOptions.value = res.data.items.map((m: any) => ({
      label: m.realName || m.managerName,
      value: m.id,
    }));
  } finally {
    managerLoading.value = false;
  }
}

// Definition options
const definitionOptions = ref<Array<{ label: string; value: string }>>([]);

async function loadDefinitions() {
  try {
    const { data: res } = await workflowApi.definitionList({ pageIndex: 1, pageSize: 100 });
    definitionOptions.value = res.data.items.map((d) => ({ label: d.name, value: d.id }));
  } catch {}
}

const columns: DataTableColumns = [
  { key: "delegatorId", title: "委托人", width: 150 },
  { key: "delegateId", title: "代理人", width: 150 },
  {
    key: "definitionId",
    title: "流程范围",
    width: 200,
    render: (row: any) => row.definitionId || "全部流程",
  },
  { key: "startTime", title: "开始时间", width: 180 },
  { key: "endTime", title: "结束时间", width: 180 },
  {
    key: "actions",
    title: "操作",
    width: 100,
    render(row: any) {
      return handleOperate([
        {
          type: "error",
          label: "撤销",
          icon: "trash",
          onClick: () => removeDelegation(row.id),
          popconfirm: true,
        },
      ]);
    },
  },
];

async function loadDelegations() {
  loading.value = true;
  try {
    const { data: res } = await workflowApi.delegationList();
    delegations.value = res.data;
  } finally {
    loading.value = false;
  }
}

async function submitDelegation() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    await workflowApi.delegationCreate({
      delegateId: form.delegateId!,
      definitionId: form.definitionId || undefined,
      startTime: form.startTime,
      endTime: form.endTime,
    });
    message.success("代理设置成功");
    showAddModal.value = false;
    loadDelegations();
  } finally {
    submitting.value = false;
  }
}

async function removeDelegation(id: string) {
  await workflowApi.delegationRemove(id);
  message.success("已撤销");
  loadDelegations();
}

onMounted(() => {
  loadDelegations();
  loadDefinitions();
});
</script>
