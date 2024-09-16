<template>
  <div>
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input
                v-model:value="getDataListParams.keyword"
                placeholder="按文件名搜索"
                clearable
              />
              <n-button type="primary" ghost @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
        </n-grid>
      </template>
      <n-form
        :model="getDataListParams"
        label-placement="left"
        label-width="auto"
        :show-feedback="false"
      >
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi span="6 s:3 m:2" label="存储配置 Key" path="configKey">
            <n-select
              v-model:value="getDataListParams.configKey"
              :options="ossConfigSelectList"
              placeholder="请选择存储配置 Key"
              clearable
              @update:value="getOssFileGroupSelectList($event)"
            />
          </n-form-item-gi>
          <n-form-item-gi span="6 s:3 m:2" label="文件组 Key" path="groupKey">
            <n-select
              v-model:value="getDataListParams.groupKey"
              :options="ossFileGroupSelectList"
              placeholder="请选择文件组 Key"
              clearable
              @update:value="getDataList"
            />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table
      :remote="true"
      :loading="dataLoading"
      :columns="dataColumns"
      :data="dataRef"
      :pagination="dataPagination"
      :row-key="dataRowKey"
      table-layout="fixed"
    />
  </div>
</template>

<script setup lang="ts">
import StrixBlock from '@/components/StrixBlock.vue'
import { http } from '@/plugins/axios'
import { usePage } from '@/utils/common-page-util'
import { downloadBlob, formatFileSize } from '@/utils/strix-file-util'
import { handleOperate } from '@/utils/strix-table-tool'
import { type DataTableColumns } from 'naive-ui'

// 本页面操作提示关键词
const _baseName = '存储文件'

const { getDataListParams, clearSearch, dataPagination, dataRowKey } = usePage(
  {
    keyword: null,
    configKey: null,
    groupKey: null,
    pageIndex: 1,
    pageSize: 10
  },
  () => {
    getDataList()
  },
  null,
  null
)

// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'path', title: '文件路径', width: 360 },
  { key: 'configKey', title: '存储配置 Key', width: 140 },
  { key: 'groupKey', title: '文件组配置 Key', width: 160 },
  { key: 'size', title: '文件大小', width: 120, render: (row: any) => formatFileSize(row.size) },
  { key: 'ext', title: '文件拓展名', width: 100 },
  { key: 'createTime', title: '上传时间', width: 180 },
  {
    key: 'actions',
    title: '操作',
    width: 130,
    align: 'center',
    render(row: any) {
      return handleOperate([
        {
          type: 'primary',
          label: '下载文件',
          icon: 'ion:download-outline',
          onClick: () => downloadFile(row.id)
        },
        {
          type: 'error',
          label: '删除文件',
          icon: 'ion:trash-outline',
          onClick: () => deleteFile(row.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据且同时从远程存储服务中删除该文件? 该操作不可恢复!'
        }
      ])
    }
  }
]
// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  http
    .get('system/oss/file', {
      params: getDataListParams.value,
      meta: { operate: `加载${_baseName}列表` }
    })
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.files
      dataPagination.itemCount = res.data.total
    })
}
onMounted(getDataList)

// 加载存储配置选项
const ossConfigSelectList = ref([])
const getOssConfigSelectList = () => {
  http
    .get('system/oss/config/select', { meta: { operate: '加载存储配置下拉列表' } })
    .then(({ data: res }) => {
      ossConfigSelectList.value = res.data.options
    })
}
onMounted(getOssConfigSelectList)
// 加载文件组配置选项
const ossFileGroupSelectList = ref([])
const getOssFileGroupSelectList = (configKey?: string) => {
  if (configKey) {
    getDataListParams.value.groupKey = null
    getDataList()
  }
  const ck = configKey ? '/' + configKey : ''
  http
    .get(`system/oss/fileGroup/select${ck}`, { meta: { operate: '加载文件组配置下拉列表' } })
    .then(({ data: res }) => {
      ossFileGroupSelectList.value = res.data.options
    })
}
onMounted(getOssFileGroupSelectList)

const downloadFile = (id: string) => {
  http
    .get(`system/common/file/${id}`, { responseType: 'blob', meta: { operate: '下载文件' } })
    .then((res) => {
      downloadBlob(res, id)
    })
}
const deleteFile = (id: string) => {
  http.post(`system/oss/file/remove/${id}`, null, { meta: { operate: `删除文件` } }).then(() => {
    getDataList()
  })
}
</script>

<style lang="scss" scoped></style>
