<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input
                v-model:value="listParams.keyword"
                clearable
                placeholder="请输入搜索条件（昵称、手机号码）"
              />
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
          <n-form-item-gi label="用户状态" path="status" span="6 s:3 m:2">
            <n-select
              v-model:value="listParams.status"
              :options="systemUserStatusRef"
              clearable
              placeholder="请选择用户状态"
            />
          </n-form-item-gi>
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

    <n-modal
      :show="editModal"
      :title="'修改' + _baseName"
      class="strix-form-modal"
      preset="card"
      size="huge"
      @update:show="tryCloseEdit"
      @after-leave="resetForms"
    >
      <n-spin :show="editLoading">
        <n-form
          ref="editFormRef"
          :model="editForm"
          :rules="formRules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="用户昵称" path="nickname">
            <n-input v-model:value="editForm.nickname" clearable placeholder="请输入用户昵称" />
          </n-form-item>
          <n-form-item label="手机号码" path="phoneNumber">
            <n-input v-model:value="editForm.phoneNumber" clearable placeholder="请输入手机号码" />
          </n-form-item>
          <n-form-item label="用户状态" path="status">
            <n-select
              v-model:value="editForm.status"
              :options="systemUserStatusRef"
              clearable
              placeholder="请选择用户状态"
            />
          </n-form-item>
        </n-form>
      </n-spin>

      <template #footer>
        <n-flex justify="end">
          <n-button @click="tryCloseEdit">取消</n-button>
          <n-button type="primary" @click="submitEdit">确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import StrixBlock from "@/components/common/StrixBlock.vue";
import StrixTag from "@/components/common/StrixTag.vue";
import StrixColumnPanel from "@/components/common/StrixColumnPanel.vue";
import StrixExportDialog from "@/components/common/StrixExportDialog.vue";
import StrixIcon from "@/components/icon/StrixIcon.vue";
import { useTableColumns } from "@/composables/useTableColumns";
import { createPaginatedFetcher } from "@/composables/useTableExport";
import { userApi } from "@/api/user";
import { useCrud } from "@/composables/useCrud";
import { useDict } from "@/composables/useDict.ts";
import { handleOperate } from "@/utils/strix-table-tool";
import { textField } from "@/utils/form-rules";
import { type DataTableColumns, type FormRules } from "naive-ui";

// 本页面操作提示关键词
const _baseName = "系统用户";
const showExportDialog = ref(false);
const fetchAllData = createPaginatedFetcher(
  userApi.urls.list,
  "systemUserList",
  () => listParams.value,
);

// 加载字典
const systemUserStatusRef = useDict("SystemUserStatus");

const {
  listParams,
  clearSearch,
  pagination,
  rowKey,
  editModal,
  editLoading,
  editForm,
  editFormRef,
  showEdit,
  submitEdit,
  deleteRow,
  resetForms,
  tryCloseEdit,
} = useCrud({
  list: {
    keyword: null,
    status: null,
    pageIndex: 1,
    pageSize: 10,
  },
  fetchList: () => getDataList(),
  editForm: {
    nickname: null,
    status: null,
    phoneNumber: null,
  },
  api: userApi,
  draftKey: "SystemUser",
});

// 展示列信息
const dataColumns: DataTableColumns = [
  { key: "nickname", title: "用户昵称", width: 200 },
  { key: "phoneNumber", title: "手机号码", width: 200 },
  {
    key: "status",
    title: "用户状态",
    width: 140,
    align: "center",
    dictName: "SystemUserStatus",
    render(row: any) {
      return h(StrixTag, { value: row.status, dictName: "SystemUserStatus" });
    },
  },
  {
    key: "actions",
    title: "操作",
    width: 130,
    align: "center",
    render(row: any) {
      return handleOperate([
        {
          type: "warning",
          label: "编辑",
          icon: "square-pen",
          onClick: () => showEdit(row.id),
        },
        {
          type: "error",
          label: "删除",
          icon: "trash",
          onClick: () => deleteRow(row.id),
          popconfirm: true,
          popconfirmMessage: "是否确认删除这条数据? 该操作不可恢复!",
        },
      ]);
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
  userApi.list(listParams.value).then(({ data: res }) => {
    dataLoading.value = false;
    dataRef.value = res.data.systemUserList;
    pagination.itemCount = res.data.total;
  });
};
onMounted(getDataList);

const formRules: FormRules = {
  nickname: textField("用户昵称"),
};
</script>

<style lang="scss" scoped></style>
