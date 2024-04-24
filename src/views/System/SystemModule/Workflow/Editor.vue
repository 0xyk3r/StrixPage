<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">流程绘制工具 / {{ configId }}</n-text>
    </n-h3>
    <WorkflowContainer :workflow-id="workflowId" :config-id="configId" :data-json="dataJson" />
  </div>
</template>

<script setup>
import WorkflowContainer from '@/components/workflow/WorkflowContainer.vue'
import { useRoute } from 'vue-router'

const $route = useRoute()

// 路由参数
const workflowId = $route.params.workflowId
const configId = $route.params.configId

const dataJson =
  '{"id":"root","name":"root节点","desc":"root节点...","type":"root","props":null,"parentId":null,"parentType":null,"branches":null,"children":{"id":"node-ezpjrwwzu3p","name":"新审批人","desc":"新审批人...","type":"approval","props":{"assign":{"type":"USER","id":[],"mode":"ANY"},"timeLimit":{"value":0,"unit":"HOUR","handler":"NOTIFY"},"reject":{"type":"END","nodeId":""}},"parentId":"root","parentType":"root","branches":null,"children":{"id":"node-ghglmwjxjs6","name":"新办理人","desc":"新办理人...","type":"task","props":{"assign":{"type":"USER","id":[],"mode":"ANY"},"timeLimit":{"value":0,"unit":"HOUR","handler":"NOTIFY"}},"parentId":"node-ezpjrwwzu3p","parentType":"approval","branches":null,"children":{"id":"node-ezy9y4mq9g4-start","name":"新conditions","desc":"新conditions...","type":"conditions","props":null,"parentId":"node-ghglmwjxjs6","parentType":"task","branches":[{"id":"node-5nolh6sdd3m","name":"新条件0","desc":"新条件...","type":"condition","props":{"type":"AND","groups":[{"type":"AND","conditions":[]}]},"parentId":"node-ezy9y4mq9g4-start","parentType":"conditions","branches":null,"children":{"id":"node-589hedeokvr","name":"新审批人","desc":"新审批人...","type":"approval","props":{"assign":{"type":"USER","id":[],"mode":"ALL"},"timeLimit":{"value":0,"unit":"HOUR","handler":"NOTIFY"},"reject":{"type":"END","nodeId":""}},"parentId":"node-5nolh6sdd3m","parentType":"condition","branches":null,"children":{"id":"node-3fjbt80q0hm","name":"新抄送人","desc":"新抄送人...","type":"cc","props":{"assign":{"type":"USER","id":[],"mode":"ALL"},"allowAdd":false},"parentId":"node-589hedeokvr","parentType":"approval","branches":null,"children":null}}},{"id":"node-iybaidskuas","name":"新条件1","desc":"新条件...","type":"condition","props":{"type":"AND","groups":[{"type":"AND","conditions":[]}]},"parentId":"node-ezy9y4mq9g4-start","parentType":"conditions","branches":null,"children":{"id":"node-36sbzt32zp9","name":"新办理人","desc":"新办理人...","type":"task","props":{"assign":{"type":"USER","id":[],"mode":"ALL"},"timeLimit":{"value":0,"unit":"HOUR","handler":"NOTIFY"}},"parentId":"node-iybaidskuas","parentType":"condition","branches":null,"children":null}}],"children":{"id":"node-ezy9y4mq9g4-end","name":"新conditions","desc":"新conditions...","type":"empty","props":null,"parentId":"node-ghglmwjxjs6","parentType":"task","branches":null,"children":{"id":"node-2sr6fenl55x","name":"新抄送人","desc":"新抄送人...","type":"cc","props":{"assign":{"type":"USER","id":[],"mode":"ALL"},"allowAdd":false},"parentId":"node-ezy9y4mq9g4-end","parentType":"empty","branches":null,"children":null}}}}}}'
</script>
<script>
export default {
  name: 'SystemModuleWorkflowEditor'
}
</script>

<style lang="less" scoped></style>
