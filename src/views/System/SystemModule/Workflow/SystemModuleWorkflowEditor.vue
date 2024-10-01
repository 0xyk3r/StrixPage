<template>
  <div>
    <WorkflowContainer :data-json="dataJson" @save="saveData" />
  </div>
</template>

<script lang="ts" setup>
import WorkflowContainer from '@/components/workflow/WorkflowContainer.vue'
import { http } from '@/plugins/axios'

const route = useRoute()

const _baseName = '流程绘制工具'
const _baseApiPrefix = 'system/workflow/config'

// 路由参数
const workflowId = route.params.workflowId as string
const configId = route.params.configId as string
const dataJson = ref('')

const loadConfigData = () => {
  http
    .get(`${_baseApiPrefix}/${configId}`, { meta: { operate: `加载${_baseName}信息` } })
    .then(({ data: res }) => {
      dataJson.value = res.data.content
    })
}
onMounted(() => {
  if (configId && configId !== 'new') {
    loadConfigData()
  } else {
    dataJson.value =
      '[{"id":"root","name":"起始节点","desc":"起始节点","type":"root","props":null,"parentId":null,"parentType":null,"branches":null}]'
  }
})

const saveData = (data: any) => {
  http.post(
    `system/workflow/update/${workflowId}/config`,
    { content: JSON.stringify(data) },
    { meta: { operate: '保存流程数据' } }
  )
}
</script>

<style lang="scss" scoped></style>
