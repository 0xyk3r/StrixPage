<template>
  <div>
    <!-- 统计卡片 -->
    <n-grid :x-gap="12" :y-gap="12" cols="3" style="margin-bottom: 12px">
      <n-gi>
        <n-card size="small">
          <n-spin :show="loading">
            <n-statistic label="总公告数">
              <n-number-animation :from="0" :to="listData?.totalCount ?? 0" />
            </n-statistic>
          </n-spin>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-spin :show="loading">
            <n-statistic label="活跃公告">
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
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input v-model:value="keyword" clearable placeholder="按标题搜索" @keydown.enter="loadData(1)" />
          </n-gi>
          <n-gi span="3 s:2 m:1">
            <n-select
              v-model:value="statusFilter"
              :options="statusOptions"
              clearable
              placeholder="状态"
              @update:value="loadData(1)"
            />
          </n-gi>
          <n-gi span="3 s:2 m:1">
            <n-select
              v-model:value="levelFilter"
              :options="levelOptions"
              clearable
              placeholder="级别"
              @update:value="loadData(1)"
            />
          </n-gi>
          <n-gi span="6 s:5 m:2" class="nebula-export__trigger-gi">
            <n-space align="center" :size="4">
              <n-button
                v-auth="'system:monitor:announcement:terminate'"
                :disabled="checkedRowKeys.length === 0"
                type="error"
                @click="handleBatchTerminate"
              >
                批量终止 ({{ checkedRowKeys.length }})
              </n-button>
              <n-button v-auth="'system:monitor:announcement:publish'" type="primary" @click="showPublishModal = true">
                发布公告
              </n-button>
              <n-button :loading="loading" quaternary type="primary" @click="loadData(1)">
                <template #icon>
                  <strix-icon icon="refresh-cw" :size="16" />
                </template>
                刷新
              </n-button>
            </n-space>
          </n-gi>
        </n-grid>
      </template>
    </strix-block>

    <!-- 公告列表表格 -->
    <n-data-table
      v-model:checked-row-keys="checkedRowKeys"
      :columns="columns"
      :data="listData?.items ?? []"
      :loading="loading"
      :bordered="false"
      :scroll-x="scrollX"
      :single-line="false"
      :row-key="(row: AnnouncementItem) => row.id"
      :pagination="pagination"
      size="small"
      remote
      @update:page="loadData"
      @update:page-size="handlePageSizeChange"
    />

    <!-- 发布公告模态框 -->
    <n-modal
      v-model:show="showPublishModal"
      class="strix-form-modal"
      preset="card"
      title="发布公告"
      style="width: 600px"
    >
      <n-form
        ref="publishFormRef"
        :model="publishForm"
        :rules="publishFormRules"
        label-placement="left"
        label-width="80"
      >
        <n-form-item label="公告标题" path="title">
          <n-input v-model:value="publishForm.title" maxlength="200" show-count placeholder="请输入公告标题" />
        </n-form-item>
        <n-form-item label="公告级别" path="level">
          <n-radio-group v-model:value="publishForm.level">
            <n-radio value="INFO">普通 (INFO)</n-radio>
            <n-radio value="WARNING">警告 (WARNING)</n-radio>
            <n-radio value="URGENT">紧急 (URGENT)</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="展示方式" path="displayType">
          <n-radio-group v-model:value="publishForm.displayType">
            <n-radio value="BANNER">底部横幅</n-radio>
            <n-radio value="MODAL">弹窗提醒</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="公告内容" path="content">
          <n-input
            v-model:value="publishForm.content"
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 10 }"
            placeholder="请输入公告内容"
          />
        </n-form-item>
        <n-form-item label="生效时间">
          <n-date-picker
            v-model:value="publishForm.startTimeTs"
            type="datetime"
            clearable
            placeholder="留空则立即生效"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="失效时间">
          <n-date-picker
            v-model:value="publishForm.endTimeTs"
            type="datetime"
            clearable
            placeholder="留空则不自动失效"
            style="width: 100%"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="showPublishModal = false">取消</n-button>
          <n-button type="primary" :loading="publishLoading" @click="handlePublish">发布</n-button>
        </n-flex>
      </template>
    </n-modal>

    <!-- 公告详情模态框 -->
    <n-modal
      v-model:show="showDetailModal"
      class="strix-form-modal"
      preset="card"
      title="公告详情"
      style="width: 600px"
    >
      <template v-if="detailData">
        <n-descriptions :column="2" bordered size="small">
          <n-descriptions-item label="标题" :span="2">{{ detailData.title }}</n-descriptions-item>
          <n-descriptions-item label="级别">
            <n-tag :type="levelTagType(detailData.level)" size="small" :bordered="false">
              {{ detailData.level }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="展示方式">
            {{ detailData.displayType === 'BANNER' ? '底部横幅' : '弹窗提醒' }}
          </n-descriptions-item>
          <n-descriptions-item label="状态">
            <n-tag :type="detailData.status === 1 ? 'success' : 'error'" size="small" :bordered="false">
              {{ detailData.status === 1 ? '有效' : '已终止' }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="创建时间">{{ formatTime(detailData.createdTime) }}</n-descriptions-item>
          <n-descriptions-item v-if="detailData.startTime" label="生效时间">
            {{ formatTime(detailData.startTime) }}
          </n-descriptions-item>
          <n-descriptions-item v-if="detailData.endTime" label="失效时间">
            {{ formatTime(detailData.endTime) }}
          </n-descriptions-item>
          <n-descriptions-item v-if="detailData.endReason" label="终止原因" :span="2">
            {{ detailData.endReason }}
          </n-descriptions-item>
          <n-descriptions-item label="内容" :span="2">
            <div style="white-space: pre-wrap">{{ detailData.content }}</div>
          </n-descriptions-item>
        </n-descriptions>
      </template>
    </n-modal>

    <StrixCommentPanel v-bind="commentPanelProps" />
  </div>
</template>

<script lang="ts" setup>
import type {
  AnnouncementDetail,
  AnnouncementItem,
  AnnouncementListResp,
  PublishAnnouncementReq
} from '@/api/announcement'
import { announcementApi } from '@/api/announcement'
import { handleOperate } from '@/utils/strix-table-tool'
import { useFormSchema } from '@/composables/useFormSchema'
import StrixCommentPanel from '@/components/common/StrixCommentPanel.vue'
import { useComment } from '@/composables/useComment'
import type { DataTableColumns, DataTableRowKey, FormInst } from 'naive-ui'
import { NTag } from 'naive-ui'
import { useTableColumns } from '@/composables/useTableColumns.ts'

const dialog = useDialog()

const { commentButton, panelProps: commentPanelProps } = useComment('SystemAnnouncement')

// 列表状态
const loading = ref(false)
const listData = ref<AnnouncementListResp | null>(null)
const keyword = ref('')
const statusFilter = ref<number | null>(null)
const levelFilter = ref<string | null>(null)
const checkedRowKeys = ref<DataTableRowKey[]>([])
const currentPage = ref(1)
const pageSize = ref(10)

const statusOptions = [
  { label: '有效', value: 1 },
  { label: '已终止', value: 0 }
]

const levelOptions = [
  { label: 'INFO', value: 'INFO' },
  { label: 'WARNING', value: 'WARNING' },
  { label: 'URGENT', value: 'URGENT' }
]

const pagination = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize.value,
  pageCount: Math.ceil((listData.value?.total ?? 0) / pageSize.value),
  showSizePicker: true,
  pageSizes: [10, 20, 50]
}))

// 发布模态框
const showPublishModal = ref(false)
const publishLoading = ref(false)
const publishFormRef = ref<FormInst | null>(null)
const publishForm = ref({
  title: '',
  content: '',
  level: 'INFO',
  displayType: 'BANNER',
  startTimeTs: null as number | null,
  endTimeTs: null as number | null
})

const publishFormRules = useFormSchema('PublishAnnouncementReq')

// 详情模态框
const showDetailModal = ref(false)
const detailData = ref<AnnouncementDetail | null>(null)

// 加载数据
const loadData = async (page?: number) => {
  if (page) currentPage.value = page
  try {
    loading.value = true
    const { data: res } = await announcementApi.list({
      pageSize: pageSize.value,
      pageIndex: currentPage.value,
      keyword: keyword.value || undefined,
      status: statusFilter.value,
      level: levelFilter.value
    })
    listData.value = res.data
  } catch (e) {
    console.error('加载公告列表失败', e)
  } finally {
    loading.value = false
  }
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  loadData(1)
}

// 查看详情
const handleDetail = async (row: AnnouncementItem) => {
  try {
    const { data: res } = await announcementApi.detail(row.id)
    detailData.value = res.data
    showDetailModal.value = true
  } catch (e) {
    console.error('加载公告详情失败', e)
  }
}

// 终止公告
const handleTerminate = async (row: AnnouncementItem) => {
  await announcementApi.terminate(row.id)
  await loadData()
}

// 批量终止
const handleBatchTerminate = () => {
  const ids = checkedRowKeys.value.map(String)
  dialog.warning({
    title: '批量终止确认',
    content: `确定终止选中的 ${ids.length} 条公告吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      await announcementApi.batchTerminate(ids)
      checkedRowKeys.value = []
      await loadData()
    }
  })
}

// 发布公告
const handlePublish = async () => {
  try {
    await publishFormRef.value?.validate()
  } catch {
    return
  }

  try {
    publishLoading.value = true
    const reqData: PublishAnnouncementReq = {
      title: publishForm.value.title,
      content: publishForm.value.content,
      level: publishForm.value.level,
      displayType: publishForm.value.displayType,
      startTime: publishForm.value.startTimeTs ? new Date(publishForm.value.startTimeTs).toISOString() : null,
      endTime: publishForm.value.endTimeTs ? new Date(publishForm.value.endTimeTs).toISOString() : null
    }
    await announcementApi.publish(reqData)
    showPublishModal.value = false
    resetPublishForm()
    await loadData(1)
  } catch (e) {
    console.error('发布公告失败', e)
  } finally {
    publishLoading.value = false
  }
}

const resetPublishForm = () => {
  publishForm.value = {
    title: '',
    content: '',
    level: 'INFO',
    displayType: 'BANNER',
    startTimeTs: null,
    endTimeTs: null
  }
}

const formatTime = (time: string | null) => {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 19)
}

const levelTagType = (level: string) => {
  switch (level) {
    case 'WARNING':
      return 'warning'
    case 'URGENT':
      return 'error'
    default:
      return 'info'
  }
}

// 表格列定义
const columns: DataTableColumns<AnnouncementItem> = [
  { type: 'selection' },
  { title: '标题', key: 'title', width: 240, ellipsis: { tooltip: true } },
  {
    title: '级别',
    key: 'level',
    width: 100,
    align: 'center',
    render: (row) => h(NTag, { type: levelTagType(row.level), size: 'small', bordered: false }, () => row.level)
  },
  {
    title: '展示方式',
    key: 'displayType',
    width: 100,
    align: 'center',
    render: (row) =>
      h(NTag, { type: row.displayType === 'BANNER' ? 'info' : 'warning', size: 'small', bordered: false }, () =>
        row.displayType === 'BANNER' ? '底部横幅' : '弹窗提醒'
      )
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
    title: '生效时间',
    key: 'startTime',
    width: 120,
    render: (row) => (row.startTime ? formatTime(row.startTime) : '立即生效')
  },
  {
    title: '失效时间',
    key: 'endTime',
    width: 120,
    render: (row) => (row.endTime ? formatTime(row.endTime) : '不自动失效')
  },
  {
    title: '创建时间',
    key: 'createdTime',
    width: 120,
    render: (row) => formatTime(row.createdTime)
  },
  {
    title: '操作',
    key: 'actions',
    width: 90,
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

const { scrollX } = useTableColumns(columns as unknown as DataTableColumns)

onMounted(() => loadData(1))
</script>
