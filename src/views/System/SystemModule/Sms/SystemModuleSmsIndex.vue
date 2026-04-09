<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input
                v-model:value="listParams.keyword"
                clearable
                placeholder="请输入搜索条件（配置Key、名称）"
              />
              <n-button ghost type="primary" @click="getDataList"> 搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAdd()"> 添加{{ _baseName }}</n-button>
          </n-gi>
          <n-gi span="6 s:2 m:3" class="nebula-export__trigger-gi">
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
    </strix-block>

    <n-data-table
      :columns="visibleColumns"
      :data="dataRef"
      :expanded-row-keys="dataExpandedRowKeys"
      :loading="dataLoading"
      :pagination="pagination"
      :row-key="rowKey"
      table-layout="fixed"
      @update-expanded-row-keys="dataExpandedRowKeysChange"
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
      :show="addModal"
      :title="'添加' + _baseName"
      class="strix-form-modal"
      preset="card"
      size="huge"
      @update:show="tryCloseAdd"
      @after-leave="resetForms"
    >
      <n-form
        ref="addFormRef"
        :model="addForm"
        :rules="addFormRules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="配置 Key" path="key">
          <n-input v-model:value="addForm.key" clearable placeholder="请输入配置 Key" />
        </n-form-item>
        <n-form-item label="配置名称" path="name">
          <n-input v-model:value="addForm.name" clearable placeholder="请输入配置名称" />
        </n-form-item>
        <n-form-item label="短信平台" path="platform">
          <n-select
            v-model:value="addForm.platform"
            :options="smsPlatformRef"
            clearable
            placeholder="请选择短信平台"
          />
        </n-form-item>
        <n-form-item label="所属地域" path="regionId">
          <n-input v-model:value="addForm.regionId" clearable placeholder="请输入所属地域" />
        </n-form-item>
        <n-form-item label="AccessKey" path="accessKey">
          <n-input v-model:value="addForm.accessKey" clearable placeholder="请输入AccessKey" />
        </n-form-item>
        <n-form-item label="AccessSecret" path="accessSecret">
          <n-input
            v-model:value="addForm.accessSecret"
            clearable
            placeholder="请输入AccessSecret"
          />
        </n-form-item>
        <n-form-item label="备注信息" path="remark">
          <n-input
            v-model:value="addForm.remark"
            :autosize="{
              minRows: 3,
              maxRows: 5,
            }"
            placeholder="在此输入备注信息"
            type="textarea"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="tryCloseAdd">取消</n-button>
          <n-button type="primary" @click="submitAdd"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>

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
          :rules="editFormRules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="配置 Key" path="key">
            <n-input v-model:value="editForm.key" clearable placeholder="请输入配置 Key" />
          </n-form-item>
          <n-form-item label="配置名称" path="name">
            <n-input v-model:value="editForm.name" clearable placeholder="请输入配置名称" />
          </n-form-item>
          <n-form-item label="短信平台" path="platform">
            <n-select
              v-model:value="editForm.platform"
              :options="smsPlatformRef"
              clearable
              placeholder="请选择短信平台"
            />
          </n-form-item>
          <n-form-item label="所属地域" path="regionId">
            <n-input v-model:value="editForm.regionId" clearable placeholder="请输入所属地域" />
          </n-form-item>
          <n-form-item label="AccessKey" path="accessKey">
            <n-input v-model:value="editForm.accessKey" clearable placeholder="请输入AccessKey" />
          </n-form-item>
          <n-form-item label="AccessSecret" path="accessSecret">
            <n-input
              v-model:value="editForm.accessSecret"
              clearable
              placeholder="请输入新的AccessSecret (不输入则不改变)"
            />
          </n-form-item>
          <n-form-item label="备注信息" path="remark">
            <n-input
              v-model:value="editForm.remark"
              :autosize="{
                minRows: 3,
                maxRows: 5,
              }"
              placeholder="在此输入备注信息"
              type="textarea"
            />
          </n-form-item>
        </n-form>
      </n-spin>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="tryCloseEdit">取消</n-button>
          <n-button type="primary" @click="submitEdit"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import type { NTagType } from "@/@types/naive-ui";
import NebulaTag from "@/components/common/NebulaTag.vue";
import StrixBlock from "@/components/common/StrixBlock.vue";
import StrixTag from "@/components/common/StrixTag.vue";
import { smsApi } from "@/api/sms";
import { useCrud } from "@/composables/useCrud";
import { useDict } from "@/composables/useDict.ts";
import { handleOperate } from "@/utils/strix-table-tool";
import { differenceWith, find, isEqual } from "lodash-es";
import {
  type DataTableColumns,
  type FormRules,
  NDataTable,
  NScrollbar,
  NSpin,
  NTabPane,
  NTabs,
} from "naive-ui";
import StrixColumnPanel from "@/components/common/StrixColumnPanel.vue";
import StrixExportDialog from "@/components/common/StrixExportDialog.vue";
import { createPaginatedFetcher } from "@/composables/useTableExport";
import { useTableColumns } from "@/composables/useTableColumns";
import StrixIcon from "@/components/icon/StrixIcon.vue";
import { remarkField, selectField, textField } from "@/utils/form-rules";

// 本页面操作提示关键词
const _baseName = "短信服务";
const showExportDialog = ref(false);
const fetchAllData = createPaginatedFetcher(smsApi.urls.list, "configs", () => listParams.value);

// 加载字典
const smsPlatformRef = useDict("SmsPlatform");

const {
  listParams,
  clearSearch,
  pagination,
  rowKey,
  addModal,
  addForm,
  addFormRef,
  editModal,
  editLoading,
  editForm,
  editFormRef,
  showAdd,
  showEdit,
  submitAdd,
  submitEdit,
  deleteRow,
  resetForms,
  tryCloseAdd,
  tryCloseEdit,
} = useCrud({
  list: {
    keyword: null,
    pageIndex: 1,
    pageSize: 10,
  },
  fetchList: () => getDataList(),
  addForm: {
    key: null,
    name: null,
    platform: null,
    regionId: null,
    accessKey: null,
    accessSecret: null,
    remark: null,
  },
  editForm: {
    key: null,
    name: null,
    platform: null,
    regionId: null,
    accessKey: null,
    accessSecret: null,
    remark: null,
  },
  api: smsApi,
  draftKey: "ModuleSms",
});

// 展示列信息
const dataColumns: DataTableColumns = [
  {
    type: "expand",
    renderExpand: (row: any) => {
      if (!row.expandTab) row.expandTab = "sign";
      if (!row.loaded) {
        return h(NSpin, { size: "large", description: "加载中..." });
      }

      const expandSmsSignChildrenVNode = [
        h(NDataTable, {
          columns: [
            { title: "签名", key: "name", width: 200 },
            {
              title: "签名状态",
              key: "status",
              width: 80,
              render: (row: any) => {
                let tagType: NTagType;
                let tagLabel = "";
                switch (row.status) {
                  case 1:
                    tagType = "warning";
                    tagLabel = "待审核";
                    break;
                  case 2:
                    tagType = "success";
                    tagLabel = "审核通过";
                    break;
                  case 3:
                    tagType = "error";
                    tagLabel = "审核未通过";
                    break;
                  case 4:
                    tagType = "default";
                    tagLabel = "审核取消";
                    break;
                  default:
                    tagType = "default";
                    tagLabel = "未知";
                    break;
                }
                return h(NebulaTag, { type: tagType }, () => tagLabel);
              },
            },
            { title: "创建时间", key: "createdTime", width: 160 },
          ],
          data: row.signs,
          rowKey: (row: any) => row.id,
        }),
      ];

      const expandSmsTemplateChildrenVNode = [
        h(NDataTable, {
          columns: [
            { title: "模板 Code", key: "code", width: 160 },
            { title: "模板名称", key: "name", width: 160 },
            {
              title: "模板类型",
              key: "type",
              width: 100,
              render: (row: any) => {
                const tagType: NTagType = "primary";
                let tagLabel = "";
                switch (row.status) {
                  case 1:
                    tagLabel = "验证码";
                    break;
                  case 2:
                    tagLabel = "通知短信";
                    break;
                  case 3:
                    tagLabel = "推广短信";
                    break;
                  case 4:
                    tagLabel = "国际短信";
                    break;
                  case 5:
                    tagLabel = "数字短信";
                    break;
                  default:
                    tagLabel = "未知";
                    break;
                }
                return h(NebulaTag, { type: tagType }, () => tagLabel);
              },
            },
            {
              title: "模板状态",
              key: "status",
              width: 100,
              render: (row: any) => {
                let tagType: NTagType;
                let tagLabel = "";
                switch (row.status) {
                  case 1:
                    tagType = "warning";
                    tagLabel = "待审核";
                    break;
                  case 2:
                    tagType = "success";
                    tagLabel = "审核通过";
                    break;
                  case 3:
                    tagType = "error";
                    tagLabel = "审核未通过";
                    break;
                  case 4:
                    tagType = "default";
                    tagLabel = "审核取消";
                    break;
                  default:
                    tagType = "default";
                    tagLabel = "未知";
                    break;
                }
                return h(NebulaTag, { type: tagType }, () => tagLabel);
              },
            },
            { title: "模板内容", key: "content", width: 600 },
            { title: "创建时间", key: "createdTime", width: 160 },
          ],
          data: row.templates,
          rowKey: (row: any) => row.id,
        }),
      ];

      return h(
        NTabs,
        {
          type: "segment",
          animated: true,
          value: row.expandTab,
          "onUpdate:value": (value) => {
            row.expandTab = value;
          },
        },
        () => [
          h(NTabPane, { name: "sign", tab: "短信签名", class: "expand-sign-pane" }, () =>
            h(NScrollbar, { xScrollable: true }, () =>
              h("div", { style: "min-width: 600px; padding-bottom: 10px;" }, [
                expandSmsSignChildrenVNode,
              ]),
            ),
          ),
          h(NTabPane, { name: "template", tab: "短信模板", class: "expand-template-pane" }, () =>
            h(NScrollbar, { xScrollable: true }, () =>
              h("div", { style: "min-width: 1200px; padding-bottom: 10px;" }, [
                expandSmsTemplateChildrenVNode,
              ]),
            ),
          ),
        ],
      );
    },
  },
  { key: "key", width: 180, title: "配置 Key" },
  { key: "name", width: 240, title: "配置名称" },
  {
    key: "platform",
    title: "平台",
    width: 120,
    align: "center",
    dictName: "SmsPlatform",
    render(row: any) {
      return h(StrixTag, { value: row.platform, dictName: "SmsPlatform" });
    },
  },
  { key: "regionId", width: 120, title: "地域", align: "center" },
  { key: "accessKey", width: 180, title: "AccessKey" },
  { key: "remark", width: 240, title: "备注" },
  { key: "createdTime", width: 180, title: "创建时间" },
  {
    key: "actions",
    title: "操作",
    width: 180,
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
  smsApi.list(listParams.value).then(({ data: res }) => {
    dataLoading.value = false;
    // 清除展开行
    dataExpandedRowKeys.value = [];
    dataRef.value = res.data.configs;
  });
};
onMounted(getDataList);

const dataExpandedRowKeys = ref<Array<string | number>>([]);
const dataExpandedRowKeysChange = (value: Array<string | number>) => {
  // 只获取新展开的
  const diffs = differenceWith(value, dataExpandedRowKeys.value, isEqual);
  dataExpandedRowKeys.value = value;
  diffs.forEach((diff) => {
    const row = find(dataRef.value, { id: diff });
    if (row) {
      smsApi.detail(row.id).then(({ data: res }) => {
        row.signs = res.data.signs;
        row.templates = res.data.templates;
        row.loaded = true;
      });
    }
  });
};

const addFormRules: FormRules = {
  key: textField("配置 Key", { min: 2, max: 32 }),
  name: textField("配置名称", { min: 2, max: 32 }),
  platform: selectField("平台"),
  regionId: textField("区域", { min: 1, max: 32 }),
  accessKey: textField("AccessKey", { max: 64 }),
  accessSecret: textField("AccessSecret", { max: 64 }),
  remark: remarkField(),
};

const editFormRules: FormRules = {
  key: textField("配置 Key", { min: 2, max: 32 }),
  name: textField("配置名称", { min: 2, max: 32 }),
  platform: selectField("平台"),
  regionId: textField("区域", { min: 1, max: 32 }),
  accessKey: textField("AccessKey", { max: 64 }),
  accessSecret: textField("AccessSecret", { required: false, max: 64 }),
  remark: remarkField(),
};
</script>

<style lang="scss" scoped>
::v-deep(.expand-menu-pane) {
  .n-grid:not(:last-child) {
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border);
  }

  .n-grid {
    align-items: center;
  }
}

::v-deep(.expand-permission-pane) {
  .n-tag:not(:last-child) {
    margin: 0 8px 8px 0;
  }
}
</style>
