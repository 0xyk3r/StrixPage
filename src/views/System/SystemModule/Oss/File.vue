<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success"> {{ _baseName }}管理 </n-text>
    </n-h3>
    <strix-block style="margin-bottom: 20px" show-clear-button @clear-search="clearSearch">
      <template #show>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen" style="margin-bottom: 15px">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" placeholder="按文件名搜索" clearable />
              <n-button type="primary" ghost @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="getDataListParams" label-placement="left" label-width="auto" :show-feedback="false">
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
    />
  </div>
</template>

<script setup>
import StrixBlock from '@/components/StrixBlock.vue'
import { createPagination } from '@/plugins/pagination.js'
import { downloadBlob, formatFileSize } from '@/utils/strix-file-util.js'
import { handleOperate } from '@/utils/strix-table-tool'
import { cloneDeep } from 'lodash'
import { NButton, NDataTable } from 'naive-ui'
import { getCurrentInstance, onMounted, ref } from 'vue'

const { proxy } = getCurrentInstance()

// 本页面操作提示关键词
const _baseName = '存储文件'

// 获取列表请求参数
const initGetDataListParams = {
  keyword: null,
  configKey: null,
  groupKey: null,
  pageIndex: 1,
  pageSize: 10
}
const getDataListParams = ref(cloneDeep(initGetDataListParams))
const clearSearch = () => {
  getDataListParams.value = cloneDeep(initGetDataListParams)
  getDataList()
}
// 展示列信息
const dataColumns = [
  { key: 'path', title: '文件路径', width: 300 },
  { key: 'configKey', title: '存储配置 Key', width: 140 },
  { key: 'groupKey', title: '文件组配置 Key', width: 140 },
  { key: 'size', title: '文件大小', width: 120, render: (row) => formatFileSize(row.size) },
  { key: 'ext', title: '文件拓展名', width: 100 },
  { key: 'createTime', title: '上传时间', width: 160 },
  {
    title: '操作',
    width: 100,
    render(row) {
      return handleOperate([
        { type: 'primary', label: '下载文件', icon: 'ion:download-outline', onClick: () => downloadFile(row.id) },
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
// 分页配置
const dataPagination = createPagination(getDataListParams, () => {
  getDataList()
})
// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  proxy.$http
    .get('system/oss/file', { params: getDataListParams.value, operate: `加载${_baseName}列表` })
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.files
      dataPagination.itemCount = res.data.total
    })
}
onMounted(getDataList)
const dataRowKey = (rowData) => rowData.id

// 加载存储配置选项
const ossConfigSelectList = ref([])
const getOssConfigSelectList = () => {
  proxy.$http.get('system/oss/config/select', { operate: '加载存储配置下拉列表' }).then(({ data: res }) => {
    ossConfigSelectList.value = res.data.options
  })
}
onMounted(getOssConfigSelectList)
// 加载文件组配置选项
const ossFileGroupSelectList = ref([])
const getOssFileGroupSelectList = (configKey) => {
  if (configKey) {
    getDataListParams.value.groupKey = null
    getDataList()
  }
  const ck = configKey ? '/' + configKey : ''
  proxy.$http.get(`system/oss/fileGroup/select${ck}`, { operate: '加载文件组配置下拉列表' }).then(({ data: res }) => {
    ossFileGroupSelectList.value = res.data.options
  })
}
onMounted(getOssFileGroupSelectList)

const downloadFile = (id) => {
  proxy.$http.get(`system/common/file/${id}`, { operate: '下载文件', responseType: 'blob' }).then((res) => {
    downloadBlob(res, id)
  })
}
const deleteFile = (id) => {
  proxy.$http.post(`system/oss/file/remove/${id}`, null, { operate: `删除文件` }).then(() => {
    getDataList()
  })
}
</script>
<script>
export default {
  name: 'SystemModuleOssFile'
}
</script>

<style lang="scss" scoped></style>
