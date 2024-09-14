<template>
  <div class="wf-node">
    <!-- 节点渲染 (不含条件分支 & 空节点) -->
    <n-card
      v-show="node.type !== 'empty'"
      class="wf-node-main"
      :header-class="'node-header node-' + node.type"
      content-class="node-content"
      hoverable
      @click="openDrawer"
    >
      <template #header>
        <div class="node-header-content">
          <n-icon size="12"><Icon :icon="icon" /></n-icon>
          <div>{{ getTypeName(node.type) }} - {{ node.name }}</div>
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
        <div v-if="configable"><Icon icon="ion:chevron-forward-outline" /></div>
      </div>
    </n-card>
    <!-- 渲染节点Footer -->
    <div v-show="node.type !== 'conditions'" class="wf-node-footer">
      <n-popover ref="addNodePopoverRef" trigger="click" content-style="padding: 15px;">
        <template #trigger>
          <n-button class="wf-node-btn" circle type="info" size="medium">
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
      <n-drawer-content :title="getTypeName(node.type)" :native-scrollbar="false" closable>
        <component :is="propsComponent" v-model="nodeProps" />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
<script setup lang="ts">
import { getOperationName, getTypeName } from '@/components/workflow/util/workflow.js'
import { Icon } from '@iconify/vue'
import ApprovalProps from './props/ApprovalProps.vue'
import CcProps from './props/CcProps.vue'
import ConditionProps from './props/ConditionProps.vue'
import TaskProps from './props/TaskProps.vue'

const {
  node,
  icon = 'ion:help-circle',
  removable = true,
  configable = false
} = defineProps<{
  node: any
  icon: string
  removable: boolean
  configable: boolean
}>()

const nodeProps = computed(() => node.props || {})

const $emit = defineEmits(['addNode', 'removeNode'])

const addNodePopoverRef = ref()
const showDrawer = ref(false)

// 添加节点
const addNode = (type: string) => {
  $emit('addNode', type)
  addNodePopoverRef.value.setShow(false)
}

// 删除节点
const removeNode = () => {
  $emit('removeNode')
}

// 打开抽屉
const openDrawer = () => {
  if (!configable) {
    return
  }
  showDrawer.value = true
}

// 节点内容计算函数
const showContent = computed(() => {
  const nodeType = node.type
  if (nodeType === 'root') {
    return '发起人发起该流程'
  } else if (nodeType === 'approval' || nodeType === 'task' || nodeType === 'cc') {
    const operationName = getOperationName(nodeType)
    const { assign: { type: assignType, id: assignIds } = { type: '', id: [] } } = node.props || {}
    if (assignType === 'USER' || assignType === 'ROLE') {
      if (assignIds && assignIds.length > 0) {
        return '由 ' + assignIds.map((item: any) => item.name) + ' ' + operationName
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

// 配置项组件计算函数
const propsComponent = computed(() => {
  switch (node.type) {
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
