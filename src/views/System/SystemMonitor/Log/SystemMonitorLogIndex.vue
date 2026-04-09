<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="listParams.keyword" clearable placeholder="按操作名称搜索" />
              <n-button ghost type="primary" @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi span="6 s:3 m:4" class="nebula-export__trigger-gi">
            <n-button quaternary type="primary" @click="showColumnPanel = !showColumnPanel">
              <template #icon><strix-icon icon="columns-3" :size="16" /></template>
              列配置
            </n-button>
            <n-button quaternary type="primary" @click="showExportDialog = true">
              <template #icon><strix-icon icon="download" :size="16" /></template>
              导出
            </n-button>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="listParams" :show-feedback="false" label-placement="left" label-width="auto">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi label="操作类型" path="operationType" span="6 s:3 m:2">
            <n-select
              v-model:value="listParams.operationType"
              :options="systemLogOperTypeRef"
              clearable
              placeholder="请选择操作类型"
              @update:value="getDataList"
            />
          </n-form-item-gi>
          <!-- <n-form-item-gi span="6 s:3 m:2" label="操作分组" path="operationGroup">
            <n-select v-model:value="listParams.operationGroup" :options="smsSignStatusOptions"
              placeholder="请选择操作分组" clearable @update:value="getDataList" />
          </n-form-item-gi>
          <n-form-item-gi span="6 s:3 m:2" label="响应状态码" path="responseCode">
            <n-select v-model:value="listParams.responseCode" :options="smsSignStatusOptions"
              placeholder="请选择响应状态码" clearable @update:value="getDataList" />
          </n-form-item-gi> -->
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table
      :columns="visibleColumns"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="pagination"
      :remote="true"
      :row-key="rowKey"
      table-layout="fixed"
    />

    <strix-export-dialog
      v-model:show="showExportDialog"
      :columns="dataColumns"
      :data="dataRef || []"
      :fetch-all-data="fetchAllData"
      :title="_baseName"
    />

    <strix-column-panel v-model:show="showColumnPanel" />
  </div>
</template>

<script lang="ts" setup>
import type { NTagType } from "@/@types/naive-ui";
import NebulaTag from "@/components/common/NebulaTag.vue";
import StrixBlock from "@/components/common/StrixBlock.vue";
import { monitorApi } from "@/api/monitor";
import { useDict } from "@/composables/useDict.ts";
import { useCrud } from "@/composables/useCrud";
import { type DataTableColumns } from "naive-ui";
import StrixColumnPanel from "@/components/common/StrixColumnPanel.vue";
import StrixExportDialog from "@/components/common/StrixExportDialog.vue";
import { createPaginatedFetcher } from "@/composables/useTableExport";
import { useTableColumns } from "@/composables/useTableColumns";
import StrixIcon from "@/components/icon/StrixIcon.vue";

// 本页面操作提示关键词
const _baseName = "系统日志";
const showExportDialog = ref(false);
const fetchAllData = createPaginatedFetcher(
  monitorApi.urls.logList,
  "items",
  () => listParams.value,
);

// 加载字典
const systemLogOperTypeRef = useDict("SystemLogOperType");

const { listParams, clearSearch, pagination, rowKey } = useCrud({
  list: {
    keyword: null,
    operationType: null,
    operationGroup: null,
    responseCode: null,
    pageIndex: 1,
    pageSize: 10,
  },
  fetchList: () => getDataList(),
});
// 展示列信息
const dataColumns: DataTableColumns = [
  { key: "operationGroup", title: "操作模块", width: 140, ellipsis: { tooltip: true } },
  {
    key: "operationName",
    title: "操作名称",
    width: 180,
    ellipsis: { tooltip: true },
  },
  {
    key: "operationMethod",
    title: "请求方式",
    width: 90,
    align: "center",
    ellipsis: { tooltip: false },
    render(row: any) {
      return h(
        NebulaTag,
        { type: row.operationMethod === "POST" ? "info" : "default", bordered: false },
        {
          default: () => row.operationMethod,
        },
      );
    },
  },
  {
    key: "operationUrl",
    title: "请求地址",
    width: 200,
    ellipsis: {
      tooltip: {
        contentStyle: { maxWidth: "480px" },
      },
    },
  },
  {
    key: "operationParam",
    title: "操作参数",
    width: 200,
    ellipsis: {
      tooltip: {
        contentStyle: { maxWidth: "720px" },
      },
    },
  },
  {
    key: "clientUsername",
    title: "操作用户",
    width: 120,
    ellipsis: { tooltip: true },
  },
  {
    key: "clientIp",
    title: "操作IP",
    width: 100,
    ellipsis: { tooltip: true },
  },
  {
    key: "clientDevice",
    title: "操作设备",
    width: 120,
    ellipsis: { tooltip: true },
  },
  { key: "operationTime", title: "发生时间", width: 180 },
  {
    key: "operationSpend",
    title: "响应时间",
    width: 90,
    align: "center",
    ellipsis: { tooltip: false },
    valueResolver: (val: any) => (val ? val + "ms" : "失败"),
    render(row: any) {
      let type: NTagType;
      if (row.operationMethod === "GET") {
        type =
          row.operationSpend < 500
            ? "success"
            : row.operationSpend < 1500
              ? "info"
              : row.operationSpend < 5000
                ? "warning"
                : "error";
      } else {
        type =
          row.operationSpend < 2000
            ? "success"
            : row.operationSpend < 5000
              ? "info"
              : row.operationSpend < 10000
                ? "warning"
                : "error";
      }
      return h(
        NebulaTag,
        { type, bordered: false },
        {
          default: () => (row.operationSpend ? row.operationSpend + "ms" : "失败"),
        },
      );
    },
  },
  {
    key: "responseCode",
    title: "响应状态",
    width: 90,
    align: "center",
    ellipsis: { tooltip: false },
    render(row: any) {
      let type: NTagType = "warning";
      if (row.responseCode === 200) {
        type = "success";
      } else if (row.responseCode === 500) {
        type = "error";
      }
      return h(
        NebulaTag,
        { type, bordered: false },
        {
          default: () => row.responseCode,
        },
      );
    },
  },
  {
    key: "responseMsg",
    title: "响应消息",
    width: 200,
    ellipsis: {
      tooltip: {
        contentStyle: { maxWidth: "480px" },
      },
    },
  },
];

// 列可见性与排序
const { visibleColumns, showPanel: showColumnPanel } = useTableColumns(dataColumns);
// 加载列表
const dataRef = ref();
const dataLoading = ref(true);
// 加载数据
const getDataList = () => {
  dataLoading.value = true;
  monitorApi.logList(listParams.value).then(({ data: res }) => {
    dataLoading.value = false;
    dataRef.value = res.data.items;
    pagination.itemCount = res.data.total;
  });
};
onMounted(getDataList);
</script>

<style lang="scss" scoped></style>
