<template>
  <div class="profile-logs">
    <div class="profile-section__title">登录记录</div>
    <div class="profile-logs__desc">展示当前账号的登录历史</div>

    <n-data-table
      :columns="columns"
      :data="logList"
      :loading="loading"
      :pagination="pagination"
      :scroll-x="1200"
      remote
      style="margin-top: 12px"
    />
  </div>
</template>

<script lang="ts" setup>
import { type LoginLogItem, profileApi } from '@/api/profile'
import { type DataTableColumns, NTag } from 'naive-ui'

const loading = ref(false)
const logList = ref<LoginLogItem[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 15,
  itemCount: 0,
  showQuickJumper: true,
  onChange: (page: number) => {
    pagination.page = page
    loadLogs()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    loadLogs()
  }
})

const columns: DataTableColumns<LoginLogItem> = [
  {
    title: '登录时间',
    key: 'operationTime',
    width: 240,
    render: (row) => row.operationTime?.replace('T', ' ') ?? '-'
  },
  {
    title: 'IP 地址',
    key: 'clientIp',
    width: 200
  },
  {
    title: '设备/系统',
    key: 'clientDevice',
    width: 320
  },
  {
    title: '状态',
    key: 'responseCode',
    width: 120,
    align: 'center',
    render: (row) =>
      h(NTag, { type: row.responseCode === 200 ? 'success' : 'error', size: 'small' }, () =>
        row.responseCode === 200 ? '成功' : '失败'
      )
  },
  {
    title: '说明',
    key: 'responseMsg',
    ellipsis: { tooltip: true }
  }
]

function loadLogs() {
  loading.value = true
  profileApi
    .getLoginLogs({ pageIndex: pagination.page, pageSize: pagination.pageSize })
    .then(({ data: res }) => {
      logList.value = res.data.loginLogList
      pagination.itemCount = res.data.total
    })
    .finally(() => {
      loading.value = false
    })
}

onMounted(loadLogs)
</script>

<style lang="scss" scoped>
.profile-section__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color-2);
  margin-bottom: 4px;
  border-left: 3px solid var(--primary-color);
  padding-left: 8px;
}

.profile-logs__desc {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-bottom: 8px;
  padding-left: 2px;
}
</style>
