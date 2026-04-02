<template>
  <div>
    <WorkflowContainer :data-json="dataJson" @save="saveData" />
  </div>
</template>

<script lang="ts" setup>
import WorkflowContainer from '@/components/workflow/WorkflowContainer.vue'
import { workflowApi } from '@/api/workflow'

const route = useRoute()

// 路由参数
const workflowId = route.params.workflowId as string
const configId = route.params.configId as string
const dataJson = ref('')

const loadConfigData = () => {
  workflowApi.configGetConfig(configId).then(({ data: res }) => {
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
  workflowApi.configUpdateContent(workflowId, { content: JSON.stringify(data) })
}
</script>

<style lang="scss" scoped></style>
