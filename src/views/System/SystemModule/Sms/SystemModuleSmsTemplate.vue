<template>
  <div>
    <strix-block style="margin-bottom: 20px" cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input
                v-model:value="getDataListParams.keyword"
                placeholder="请输入搜索关键字（模板Code、名称）"
                clearable
              />
              <n-button type="primary" ghost @click="getDataList"> 搜索 </n-button>
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
          <n-form-item-gi span="6 s:3 m:2" label="配置 Key" path="configKey">
            <n-select
              v-model:value="getDataListParams.configKey"
              :options="smsConfigSelectList"
              placeholder="请选择短信配置 Key"
              clearable
              @update:value="getDataList"
            />
          </n-form-item-gi>
          <n-form-item-gi span="6 s:3 m:2" label="状态" path="status">
            <n-select
              v-model:value="getDataListParams.status"
              :options="strixSmsTemplateStatusRef"
              placeholder="请选择状态"
              clearable
              @update:value="getDataList"
            />
          </n-form-item-gi>
          <n-form-item-gi span="6 s:3 m:2" label="类型" path="type">
            <n-select
              v-model:value="getDataListParams.type"
              :options="strixSmsTemplateTypeRef"
              placeholder="请选择类型"
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

<script setup lang="ts">
import StrixBlock from '@/components/StrixBlock.vue'
import StrixTag from '@/components/StrixTag.vue'
import { http } from '@/plugins/axios'
import { usePage } from '@/utils/common-page-util'
import { useDict } from '@/utils/strix-dict-util'
import { type DataTableColumns } from 'naive-ui'
import { h, onMounted, ref } from 'vue'

// 本页面操作提示关键词
const _baseName = '短信模板'

// 加载字典
const strixSmsTemplateTypeRef = useDict('StrixSmsTemplateType')
const strixSmsTemplateStatusRef = useDict('StrixSmsTemplateStatus')

const { getDataListParams, clearSearch, dataPagination, dataRowKey } = usePage(
  {
    keyword: null,
    configKey: null,
    type: null,
    status: null,
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
  { key: 'code', title: '模板 Code', width: 160 },
  { key: 'name', title: '模板名称', width: 160 },
  { key: 'configKey', title: '短信配置 Key', width: 150 },
  {
    key: 'type',
    title: '类型',
    width: 100,
    render(row: any) {
      return h(StrixTag, { value: row.type, dictName: 'StrixSmsTemplateType' })
    }
  },
  {
    key: 'status',
    title: '状态',
    width: 100,
    render(row: any) {
      return h(StrixTag, { value: row.status, dictName: 'StrixSmsTemplateStatus' })
    }
  },
  { key: 'content', title: '模板内容', width: 600 },
  { title: '创建时间', key: 'createTime', width: 160 }
]
// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  http
    .get('system/sms/template', {
      params: getDataListParams.value,
      meta: { operate: `加载${_baseName}列表` }
    })
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.templates
      dataPagination.itemCount = res.data.total
    })
}
onMounted(getDataList)

// 加载短信配置选项
const smsConfigSelectList = ref([])
const getSmsConfigSelectList = () => {
  http
    .get('system/sms/config/select', { meta: { operate: '加载短信配置下拉列表' } })
    .then(({ data: res }) => {
      smsConfigSelectList.value = res.data.options
    })
}
onMounted(getSmsConfigSelectList)
</script>

<style lang="scss" scoped></style>
