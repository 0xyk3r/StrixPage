<template>
  <div class="wf-node">
    <!-- 渲染条件分支 -->
    <n-card v-if="$slots.branches" class="branches-card" content-class="branches-card-content" hoverable>
      <div style="display: flex; justify-content: center; margin-bottom: 20px">
        <n-button-group>
          <n-button strong secondary type="primary" @click="addNode('condition')"> 添加条件节点 </n-button>
          <n-button strong secondary type="error" @click="removeNode"> 删除条件分支 </n-button>
        </n-button-group>
      </div>
      <!-- 子分支插槽 -->
      <n-flex justify="center" size="large" :wrap="false">
        <slot name="branches" />
      </n-flex>
    </n-card>
    <!-- 渲染节点Footer -->
    <div class="wf-node-footer">
      <n-popover ref="addNodePopoverRef" trigger="click" content-style="padding: 15px;">
        <template #trigger>
          <n-button class="wf-node-btn" circle type="info" size="medium" @click="showPopover = !showPopover">
            <template #icon>
              <n-icon size="24"><Icon icon="ion:add-outline" /></n-icon>
            </template>
          </n-button>
        </template>
        <n-button-group>
          <n-button secondary round type="primary" @click="addNode('approval')"> 审批人 </n-button>
          <n-button secondary round type="warning" @click="addNode('task')"> 办理人 </n-button>
          <n-button secondary round @click="addNode('conditions')"> 条件分支 </n-button>
          <!-- <n-button secondary round type="error" @click="addNode('timer')"> 延迟等待 </n-button> -->
          <n-button secondary round type="info" @click="addNode('cc')"> 抄送人 </n-button>
        </n-button-group>
      </n-popover>
    </div>
    <!-- 子节点插槽 -->
    <div class="wf-node-children">
      <slot />
    </div>
  </div>
</template>
<script setup>
import { Icon } from '@iconify/vue'
import { NCard } from 'naive-ui'
import { ref } from 'vue'

const $emit = defineEmits(['addNode', 'removeNode'])

// 添加条件
const addNodePopoverRef = ref()
const addNode = (type) => {
  $emit('addNode', type)
  addNodePopoverRef.value.setShow(false)
}

// 删除条件
const removeNode = () => {
  $emit('removeNode')
}
</script>
<style lang="scss" scoped></style>
