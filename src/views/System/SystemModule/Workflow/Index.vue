<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">{{ _baseName }}管理</n-text>
    </n-h3>
    <div class="wf-container">
      <n-card class="wf-step">
        <n-el
          tag="span"
          style="color: var(--primary-color); transition: .3s var(--cubic-bezier-ease-in-out);"
        >
          我是个 span 标签
        </n-el>
      </n-card>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const _baseName = '流程引擎'
</script>
<script>
export default {
  name: 'SystemModuleWorkflowConfig'
}
</script>

<style lang="less" scoped>
.wf-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  padding: 20px;
  .wf-step {
    flex: 1;
    width: 300px;
  }
  .n-el {
    display: inline-block;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
      background-color: var(--primary-color);
      color: var(--bg-color);
    }
  }
}
</style>
