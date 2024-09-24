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
      '[{"id":"root","name":"root节点","desc":"root节点...","type":"root","props":null,"parentId":null,"parentType":null,"branches":null},{"id":"node-ezpjrwwzu3p","name":"新审批人","desc":"新审批人...","type":"approval","props":{"assign":{"type":"USER","id":[],"mode":"ANY"},"timeLimit":{"value":0,"unit":"HOUR","handler":"NOTIFY"},"reject":{"type":"END","nodeId":""}},"parentId":"root","parentType":"root","branches":null},{"id":"node-ghglmwjxjs6","name":"新办理人","desc":"新办理人...","type":"task","props":{"assign":{"type":"USER","id":[],"mode":"ANY"},"timeLimit":{"value":0,"unit":"HOUR","handler":"NOTIFY"}},"parentId":"node-ezpjrwwzu3p","parentType":"approval","branches":null},{"id":"node-ezy9y4mq9g4","name":"新conditions","desc":"新conditions...","type":"conditions","props":null,"parentId":"node-ghglmwjxjs6","parentType":"task","branches":[{"id":"condition-5nolh6sdd3m","name":"新条件0","desc":"新条件...","type":"condition","props":{"type":"AND","groups":[{"type":"AND","conditions":[]}]}},{"id":"condition-iybaidskuas","name":"新条件1","desc":"新条件...","type":"condition","props":{"type":"AND","groups":[{"type":"AND","conditions":[]}]}}]},{"id":"node-589hedeokvr","name":"新审批人","desc":"新审批人...","type":"approval","props":{"assign":{"type":"USER","id":[],"mode":"ALL"},"timeLimit":{"value":0,"unit":"HOUR","handler":"NOTIFY"},"reject":{"type":"END","nodeId":""}},"parentId":"condition-5nolh6sdd3m","parentType":"condition","branches":null},{"id":"node-3fjbt80q0hm","name":"新抄送人","desc":"新抄送人...","type":"cc","props":{"assign":{"type":"USER","id":[],"mode":"ALL"},"allowAdd":false},"parentId":"node-589hedeokvr","parentType":"approval","branches":null},{"id":"node-36sbzt32zp9","name":"新办理人","desc":"新办理人...","type":"task","props":{"assign":{"type":"USER","id":[],"mode":"ALL"},"timeLimit":{"value":0,"unit":"HOUR","handler":"NOTIFY"}},"parentId":"condition-iybaidskuas","parentType":"condition","branches":null},{"id":"node-2sr6fenl55x","name":"新抄送人","desc":"新抄送人...","type":"cc","props":{"assign":{"type":"USER","id":[],"mode":"ALL"},"allowAdd":false},"parentId":"node-ezy9y4mq9g4","parentType":"empty","branches":null}]'
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
