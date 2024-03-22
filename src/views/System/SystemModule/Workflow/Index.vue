<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">{{ _baseName }}管理</n-text>
    </n-h3>
    <WorkflowContainer />
  </div>
</template>

<script setup>
import WorkflowContainer from '@/components/workflow/WorkflowContainer.vue'

const _baseName = '流程引擎'
</script>
<script>
export default {
  name: 'SystemModuleWorkflowConfig'
}
</script>

<style lang="less" scoped></style>
