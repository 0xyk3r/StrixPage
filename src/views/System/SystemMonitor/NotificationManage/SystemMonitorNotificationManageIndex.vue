<template>
  <div>
    <!-- 统计卡片 -->
    <n-grid :x-gap="12" :y-gap="12" cols="2 s:3 m:3" responsive="screen" style="margin-bottom: 12px">
      <n-gi>
        <n-card size="small">
          <n-spin :show="loading">
            <n-statistic label="总通知数">
              <n-number-animation :from="0" :to="listData?.totalCount ?? 0" />
            </n-statistic>
          </n-spin>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-spin :show="loading">
            <n-statistic label="有效通知">
              <n-number-animation :from="0" :to="listData?.activeCount ?? 0" />
            </n-statistic>
          </n-spin>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-spin :show="loading">
            <n-statistic label="已终止">
              <n-number-animation :from="0" :to="listData?.terminatedCount ?? 0" />
            </n-statistic>
          </n-spin>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- 搜索与操作栏 -->
    <strix-block>
      <template #search>
        <n-input-group>
          <n-select
            v-model:value="statusFilter"
            :options="statusOptions"
            clearable
            placeholder="状态"
            style="width: 140px; flex: 0 0 auto"
            @update:value="loadData(1)"
          />
          <n-input v-model:value="keyword" clearable placeholder="按标题搜索" @keydown.enter="loadData(1)" />
        </n-input-group>
      </template>
      <template #actions>
        <n-button
          v-auth="'system:monitor:notification:terminate'"
          :disabled="checkedRowKeys.length === 0"
          type="error"
          @click="handleBatchTerminate"
        >
          批量终止 ({{ checkedRowKeys.length }})
        </n-button>
        <n-button v-auth="'system:monitor:notification:send'" type="primary" @click="showSendModal = true">
          发送通知
        </n-button>
        <n-button :loading="loading" quaternary type="primary" @click="loadData(1)"> 刷新</n-button>
      </template>
    </strix-block>

    <!-- 通知列表表格 -->
    <n-data-table
      v-model:checked-row-keys="checkedRowKeys"
      :columns="columns"
      :data="listData?.items ?? []"
      :loading="loading"
      :bordered="false"
      :scroll-x="scrollX"
      :single-line="false"
      :row-key="(row: NotificationManageItem) => row.id"
      :pagination="pagination"
      size="small"
      remote
      @update:page="loadData"
      @update:page-size="handlePageSizeChange"
    />

    <!-- 发送通知模态框 -->
    <n-modal v-model:show="showSendModal" class="strix-form-modal" preset="card" title="发送通知" style="width: 640px">
      <n-form ref="sendFormRef" :model="sendForm" :rules="sendFormRules" label-placement="left" label-width="auto">
        <n-form-item label="通知标题" path="title">
          <n-input v-model:value="sendForm.title" maxlength="200" show-count placeholder="请输入通知标题" />
        </n-form-item>
        <n-form-item label="发送方式" path="sendMode">
          <n-radio-group v-model:value="sendForm.sendMode">
            <n-radio value="BROADCAST">系统广播</n-radio>
            <n-radio value="TARGETED">定向通知</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item v-if="sendForm.sendMode === 'TARGETED'" label="接收人" path="receiverIds">
          <n-space vertical style="width: 100%">
            <n-button @click="showManagerSelector = true">
              选择接收人 ({{ sendForm.receiverIds?.length ?? 0 }} 人)
            </n-button>
          </n-space>
        </n-form-item>
        <n-form-item label="通知内容" path="content">
          <n-input
            v-model:value="sendForm.content"
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 10 }"
            placeholder="请输入通知内容"
          />
        </n-form-item>
        <n-form-item label="跳转设置">
          <n-space>
            <n-select
              v-model:value="sendForm.jumpType"
              :options="jumpTypeOptions"
              style="width: 120px"
              placeholder="跳转类型"
            />
            <n-input
              v-if="sendForm.jumpType !== 'NONE'"
              v-model:value="sendForm.jumpTarget"
              :placeholder="sendForm.jumpType === 'PAGE' ? '路由名称' : 'URL 地址'"
              style="width: 280px"
            />
          </n-space>
        </n-form-item>
      </n-form>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="showSendModal = false">取消</n-button>
          <n-button type="primary" :loading="sendLoading" @click="handleSend">发送</n-button>
        </n-flex>
      </template>
    </n-modal>

    <!-- 通知详情模态框 -->
    <n-modal
      v-model:show="showDetailModal"
      class="strix-form-modal"
      preset="card"
      title="通知详情"
      style="width: 680px"
    >
      <template v-if="detailData">
        <n-descriptions :column="2" bordered size="small" style="margin-bottom: 16px">
          <n-descriptions-item label="标题" :span="2">{{ detailData.title }}</n-descriptions-item>
          <n-descriptions-item label="类型">
            <n-tag :type="detailData.bizType === 'SYSTEM_BROADCAST' ? 'info' : 'success'" size="small">
              {{ detailData.bizType === 'SYSTEM_BROADCAST' ? '广播' : '定向' }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="状态">
            <n-tag :type="detailData.status === 1 ? 'success' : 'error'" size="small">
              {{ detailData.status === 1 ? '有效' : '已终止' }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="发送人">{{ detailData.senderName }}</n-descriptions-item>
          <n-descriptions-item label="发送时间">{{ formatISODateTime(detailData.createdTime) }}</n-descriptions-item>
          <n-descriptions-item v-if="detailData.endReason" label="终止原因" :span="2">
            {{ detailData.endReason }}
          </n-descriptions-item>
          <n-descriptions-item label="内容" :span="2">
            <div style="white-space: pre-wrap">{{ detailData.content }}</div>
          </n-descriptions-item>
        </n-descriptions>
        <n-h6>接收人列表 ({{ detailData.receivers.length }} 人)</n-h6>
        <n-data-table
          :columns="receiverColumns"
          :data="detailData.receivers"
          :bordered="false"
          :single-line="false"
          :max-height="300"
          :pagination="false"
          virtual-scroll
          size="small"
          remote
        />
      </template>
    </n-modal>

    <!-- 管理员选择器 -->
    <StrixManagerSelector
      v-model:show="showManagerSelector"
      :value="sendForm.receiverIds"
      @complete="onManagerSelected"
    />

    <StrixCommentPanel v-bind="commentPanelProps" />
  </div>
</template>

<script lang="ts" setup>
import type {
  NotificationDetailResp,
  NotificationManageItem,
  NotificationManageListResp,
  SendNotificationReq
} from '@/api/notification-manage'
import { notificationManageApi } from '@/api/notification-manage'
import { handleOperate } from '@/utils/strix-table-tool'
import { useFormSchema } from '@/composables/useFormSchema'
import { formatISODateTime } from '@/utils/strix-date-util'
import StrixManagerSelector from '@/components/data/StrixManagerSelector.vue'
import StrixCommentPanel from '@/components/common/StrixCommentPanel.vue'
import { useComment } from '@/composables/useComment'
import type { DataTableColumn, DataTableRowKey, FormInst } from 'naive-ui'
import { type DataTableColumns, NTag } from 'naive-ui'
import { useTableColumns } from '@/composables/useTableColumns'

const dialog = useDialog()
const message = useMessage()

const { commentButton, panelProps: commentPanelProps } = useComment('SystemNotification')

// 列表状态
const loading = ref(false)
const listData = ref<NotificationManageListResp | null>(null)
const keyword = ref('')
const statusFilter = ref<number | null>(null)
const checkedRowKeys = ref<DataTableRowKey[]>([])
const currentPage = ref(1)
const pageSize = ref(10)

const statusOptions = [
  { label: '有效', value: 1 },
  { label: '已终止', value: 0 }
]

const pagination = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize.value,
  pageCount: Math.ceil((listData.value?.total ?? 0) / pageSize.value),
  showSizePicker: true,
  pageSizes: [10, 20, 50]
}))

// 发送模态框状态
const showSendModal = ref(false)
const sendLoading = ref(false)
const sendFormRef = ref<FormInst | null>(null)
const sendForm = ref<SendNotificationReq>({
  title: '',
  content: '',
  sendMode: 'BROADCAST',
  receiverIds: [],
  jumpType: 'NONE',
  jumpTarget: '',
  jumpParams: ''
})

const sendFormRules = useFormSchema('SendNotificationReq')

const jumpTypeOptions = [
  { label: '无跳转', value: 'NONE' },
  { label: '页面路由', value: 'PAGE' },
  { label: '外部链接', value: 'URL' }
]

// 管理员选择器
const showManagerSelector = ref(false)

const onManagerSelected = (data: Array<string | number>) => {
  sendForm.value.receiverIds = data.map(String)
}

// 详情模态框状态
const showDetailModal = ref(false)
const detailData = ref<NotificationDetailResp | null>(null)

// 加载数据
const loadData = async (page?: number) => {
  if (loading.value) return
  if (page) currentPage.value = page
  try {
    loading.value = true
    const { data: res } = await notificationManageApi.list({
      pageSize: pageSize.value,
      pageIndex: currentPage.value,
      keyword: keyword.value || undefined,
      status: statusFilter.value ?? undefined
    })
    listData.value = res.data
  } catch (e) {
    console.error('加载通知管理列表失败', e)
  } finally {
    loading.value = false
  }
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  loadData(1)
}

// 查看详情
const handleDetail = async (row: NotificationManageItem) => {
  try {
    const { data: res } = await notificationManageApi.detail(row.id)
    detailData.value = res.data
    showDetailModal.value = true
  } catch (e) {
    console.error('加载通知详情失败', e)
  }
}

// 终止通知
const handleTerminate = async (row: NotificationManageItem) => {
  await notificationManageApi.terminate(row.id)
  await loadData()
}

// 批量终止
const handleBatchTerminate = () => {
  const ids = checkedRowKeys.value.map(String)
  dialog.warning({
    title: '批量终止确认',
    content: `确定终止选中的 ${ids.length} 条通知吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      await notificationManageApi.batchTerminate(ids)
      checkedRowKeys.value = []
      await loadData()
    }
  })
}

// 发送通知
const handleSend = async () => {
  try {
    await sendFormRef.value?.validate()
  } catch {
    return
  }

  if (
    sendForm.value.sendMode === 'TARGETED' &&
    (!sendForm.value.receiverIds || sendForm.value.receiverIds.length === 0)
  ) {
    message.warning('请选择接收人')
    return
  }

  try {
    sendLoading.value = true
    await notificationManageApi.send(sendForm.value)
    showSendModal.value = false
    resetSendForm()
    await loadData(1)
  } catch (e) {
    console.error('发送通知失败', e)
  } finally {
    sendLoading.value = false
  }
}

const resetSendForm = () => {
  sendForm.value = {
    title: '',
    content: '',
    sendMode: 'BROADCAST',
    receiverIds: [],
    jumpType: 'NONE',
    jumpTarget: '',
    jumpParams: ''
  }
}

// 表格列定义
const columns: DataTableColumns<NotificationManageItem> = [
  { type: 'selection' },
  { title: '标题', key: 'title', width: 240, ellipsis: { tooltip: true } },
  {
    title: '类型',
    key: 'bizType',
    width: 80,
    align: 'center',
    render: (row) =>
      h(NTag, { type: row.bizType === 'SYSTEM_BROADCAST' ? 'info' : 'success', size: 'small', bordered: false }, () =>
        row.bizType === 'SYSTEM_BROADCAST' ? '广播' : '定向'
      )
  },
  {
    title: '接收人数',
    key: 'receiverCount',
    width: 100,
    render: (row) => (row.bizType === 'SYSTEM_BROADCAST' ? `全部 (${row.receiverCount}人)` : `${row.receiverCount}人`)
  },
  {
    title: '已读率',
    key: 'readRate',
    width: 80,
    titleAlign: 'center',
    align: 'right',
    render: (row) => `${(row.readRate * 100).toFixed(0)}%`
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    align: 'center',
    render: (row) =>
      h(NTag, { type: row.status === 1 ? 'success' : 'error', size: 'small', bordered: false }, () =>
        row.status === 1 ? '有效' : '终止'
      )
  },
  {
    title: '发送人',
    key: 'senderName',
    width: 120
  },
  {
    title: '发送时间',
    key: 'createdTime',
    width: 120,
    render: (row) => formatISODateTime(row.createdTime)
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: (row) =>
      handleOperate([
        commentButton(row),
        {
          label: '详情',
          icon: 'file-text',
          onClick: () => handleDetail(row)
        },
        ...(row.status === 1
          ? [
              {
                type: 'error' as const,
                label: '终止',
                icon: 'x-circle',
                popconfirm: true,
                popconfirmMessage: `确定终止「${row.title}」吗？`,
                onClick: () => handleTerminate(row)
              }
            ]
          : [])
      ])
  }
]

// 接收人列表列定义
const receiverColumns: DataTableColumn[] = [
  { title: '昵称', key: 'nickname', width: 120 },
  {
    title: '已读状态',
    key: 'readStatus',
    width: 80,
    render: (row: any) =>
      h(NTag, { type: row.readStatus === 1 ? 'success' : 'default', size: 'small', bordered: false }, () =>
        row.readStatus === 1 ? '已读' : '未读'
      )
  },
  {
    title: '已读时间',
    key: 'readAt',
    width: 160,
    render: (row: any) => formatISODateTime(row.readAt)
  },
  {
    title: '有效状态',
    key: 'validStatus',
    width: 80,
    render: (row: any) =>
      h(NTag, { type: row.validStatus === 1 ? 'success' : 'error', size: 'small', bordered: false }, () =>
        row.validStatus === 1 ? '有效' : '无效'
      )
  }
]

const { scrollX } = useTableColumns(columns as unknown as DataTableColumns)

onMounted(() => loadData(1))
</script>
