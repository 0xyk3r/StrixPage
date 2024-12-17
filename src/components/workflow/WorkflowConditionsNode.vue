<template>
  <div class="wf-node">
    <!-- 渲染条件分支 -->
    <n-card
      v-if="$slots.branches"
      class="branches-card"
      content-class="branches-card-content"
      hoverable
    >
      <div style="display: flex; justify-content: center; margin-bottom: 20px">
        <n-button-group>
          <n-button secondary strong type="primary" @click="addNode('condition')">
            添加条件节点
          </n-button>
          <n-button secondary strong type="error" @click="$emit('removeNode')">
            删除条件分支
          </n-button>
        </n-button-group>
      </div>
      <!-- 子分支插槽 -->
      <n-flex :wrap="false" justify="center" size="large">
        <slot name="branches" />
      </n-flex>
    </n-card>
    <!-- 渲染节点Footer -->
    <div class="wf-node-footer">
      <n-popover ref="addNodePopoverRef" content-style="padding: 15px;" trigger="click">
        <template #trigger>
          <n-button circle class="wf-node-btn" size="medium" type="info">
            <template #icon>
              <n-icon size="24">
                <Icon icon="ion:add-outline" />
              </n-icon>
            </template>
          </n-button>
        </template>
        <n-button-group>
          <n-button round secondary type="primary" @click="addNode('approval')"> 审批人</n-button>
          <n-button round secondary type="warning" @click="addNode('task')"> 办理人</n-button>
          <n-button round secondary @click="addNode('conditions')"> 条件分支</n-button>
          <!-- <n-button secondary round type="error" @click="addNode('timer')"> 延迟等待 </n-button> -->
          <n-button round secondary type="info" @click="addNode('cc')"> 抄送人</n-button>
        </n-button-group>
      </n-popover>
    </div>
    <!-- 子节点插槽 -->
    <div class="wf-node-children">
      <slot />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { Icon } from '@iconify/vue'

const emit = defineEmits(['addNode', 'removeNode'])

// 添加条件
const addNodePopoverRef = ref()
const addNode = (type: string) => {
  emit('addNode', type)
  addNodePopoverRef.value.setShow(false)
}
</script>
<style lang="scss" scoped>
@use '@/assets/style/components/workflow.scss';

.branches-card {
  &:hover {
    border-color: var(--n-primary-color);
  }

  .branches-card-content {
    padding: 20px 36px 0 36px;
  }
}
</style>
