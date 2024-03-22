<template>
  <div class="wf-node">
    <n-card v-if="$slots.branches" class="branches-card" content-class="branches-card-content" hoverable>
      <div style="display: flex; justify-content: center; margin-bottom: 20px">
        <n-button-group>
          <n-button strong secondary type="primary" @click="addNode('condition')"> 添加条件节点 </n-button>
          <!-- <n-button strong secondary type="primary" @click="addBranches"> 添加条件节点 </n-button> -->
          <n-button strong secondary type="error" @click="removeNode"> 删除条件分支 </n-button>
        </n-button-group>
      </div>
      <n-flex justify="center" size="large" :wrap="false">
        <slot name="branches" />
      </n-flex>
    </n-card>
    <!-- 不显示条件分支结尾的card -->
    <n-card
      v-else
      v-show="$props.node.type !== 'empty'"
      class="wf-node-main"
      :header-class="'node-header node-' + $props.node.type"
      content-class="node-content"
      hoverable
    >
      <template #header>
        <div class="node-header-content">
          <n-icon size="12"><Icon :icon="$props.icon" /></n-icon>
          <div>{{ getTypeName($props.node.type) }}</div>
        </div>
      </template>
      <template #header-extra>
        <n-button v-if="removable" size="tiny" quaternary circle @click="removeNode">
          <template #icon>
            <n-icon size="14"><Icon icon="ion:close-outline" /></n-icon>
          </template>
        </n-button>
      </template>
      {{ $props.node.name }}
    </n-card>
    <!-- 不显示条件分支起点的footer -->
    <div v-show="$props.node.type !== 'conditions'" class="wf-node-footer">
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
    <div class="wf-node-children">
      <slot />
    </div>
  </div>
</template>
<script setup>
import { getTypeName } from '@/components/workflow/util/workflow.js'
import { Icon } from '@iconify/vue'
import { NCard } from 'naive-ui'
import { ref } from 'vue'
const $props = defineProps({
  node: {
    type: Object,
    required: true
  },
  icon: {
    type: String,
    default: 'ion:help-circle'
  },
  removable: {
    type: Boolean,
    default: true
  }
})

const $emit = defineEmits(['addNode', 'removeNode'])

const addNodePopoverRef = ref()

const addBranches = () => {
  const br = $props.node.branches
  br.push({
    id: 'new' + br.length,
    name: '新条件' + br.length,
    desc: '新条件...',
    type: 'condition',
    props: null,
    parentid: $props.node.id,
    parenttype: $props.node.type,
    branches: null,
    children: null
  })
}

const addNode = (type) => {
  $emit('addNode', type)
  addNodePopoverRef.value.setShow(false)
}

const removeNode = () => {
  $emit('removeNode')
}
</script>
<style lang="scss" scoped></style>
