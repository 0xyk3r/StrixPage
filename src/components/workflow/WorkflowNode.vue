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
    <!-- 节点渲染 (不含条件分支 & 空节点) -->
    <n-card
      v-else
      v-show="$props.node.type !== 'empty'"
      class="wf-node-main"
      :header-class="'node-header node-' + $props.node.type"
      content-class="node-content"
      hoverable
      @click="openDrawer"
    >
      <template #header>
        <div class="node-header-content">
          <n-icon size="12"><Icon :icon="$props.icon" /></n-icon>
          <div>{{ getTypeName($props.node.type) }}</div>
        </div>
      </template>
      <template #header-extra>
        <n-button v-if="removable" size="tiny" quaternary circle @click.stop="removeNode">
          <template #icon>
            <n-icon size="14"><Icon icon="ion:close-outline" /></n-icon>
          </template>
        </n-button>
      </template>
      <!-- 节点body -->
      <div class="node-body-content">
        <div>{{ showContent }}</div>
        <div v-if="$props.configable"><Icon icon="ion:chevron-forward-outline" /></div>
      </div>
    </n-card>
    <!-- 渲染节点Footer -->
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
    <!-- 子节点插槽 -->
    <div class="wf-node-children">
      <slot />
    </div>

    <!-- 配置项抽屉 -->
    <n-drawer v-model:show="showDrawer" :width="512">
      <n-drawer-content :title="getTypeName($props.node.type)" :native-scrollbar="false" closable>
        <component :is="choosePropsComponent" v-model="cacheProps" />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
<script setup>
import { getTypeName, getOperationName } from '@/components/workflow/util/workflow.js'
import { Icon } from '@iconify/vue'
import { NCard } from 'naive-ui'
import { computed, ref } from 'vue'
import ApprovalProps from './props/ApprovalProps.vue'
import TaskProps from './props/TaskProps.vue'
import CcProps from './props/CcProps.vue'
import ConditionProps from './props/ConditionProps.vue'

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
  },
  configable: {
    type: Boolean,
    default: false
  }
})

const $emit = defineEmits(['addNode', 'removeNode'])

const addNodePopoverRef = ref()
const showDrawer = ref(false)
const cacheProps = ref($props.node.props)

// 添加节点
const addNode = (type) => {
  $emit('addNode', type)
  addNodePopoverRef.value.setShow(false)
}

// 删除节点
const removeNode = () => {
  $emit('removeNode')
}

// 打开抽屉
const openDrawer = () => {
  if (!$props.configable) {
    return
  }
  showDrawer.value = true
}

// 节点内容计算方法
const showContent = computed(() => {
  const nodeType = $props.node.type
  if (nodeType === 'root') {
    return '发起人发起该流程'
  } else if (nodeType === 'approval' || nodeType === 'task' || nodeType === 'cc') {
    const operationName = getOperationName(nodeType)
    const { assign: { type: assignType, id: assignIds } = {} } = $props.node.props || {}
    if (assignType === 'USER' || assignType === 'ROLE') {
      if (assignIds && assignIds.length > 0) {
        return '由 ' + assignIds.map((item) => item.name) + ' ' + operationName
      } else {
        return `未指定${operationName}人`
      }
    } else if (assignType === 'SELECT') {
      return `发起人自行选择${operationName}人`
    } else if (assignType === 'SELF') {
      return `发起人自己进行${operationName}`
    } else if (assignType === 'AUTOREJECT') {
      return '系统自动拒绝该审批'
    }
  } else if (nodeType === 'condition') {
    return '点击查看条件'
  }
  return ''
})

// 配置项组件选择
const choosePropsComponent = computed(() => {
  switch ($props.node.type) {
    case 'approval':
      return ApprovalProps
    case 'task':
      return TaskProps
    case 'cc':
      return CcProps
    case 'condition':
      return ConditionProps
  }
  return null
})
</script>
<style lang="scss" scoped></style>
