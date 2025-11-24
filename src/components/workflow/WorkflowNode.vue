<template>
  <div class="wf-node">
    <!-- 节点渲染 (不含条件分支 & 空节点) -->
    <n-card
      v-show="model.type !== 'empty'"
      :header-class="'node-header node-' + model.type"
      class="wf-node-main"
      content-class="node-content"
      hoverable
      @click="openDrawer"
    >
      <template #header>
        <div class="node-header-content">
          <n-icon size="12">
            <StrixIcon :icon="icon" />
          </n-icon>
          <div>{{ getTypeName(model.type) }} - {{ model.name }}</div>
        </div>
      </template>
      <template #header-extra>
        <n-button v-if="removable" circle quaternary size="tiny" @click.stop="$emit('removeNode')">
          <template #icon>
            <n-icon size="14">
              <StrixIcon icon="circle-x" />
            </n-icon>
          </template>
        </n-button>
      </template>
      <!-- 节点body -->
      <div class="node-body-content">
        <div>{{ showContent }}</div>
        <div v-if="configurable">
          <StrixIcon icon="circle-chevron-right" />
        </div>
      </div>
    </n-card>
    <!-- 渲染节点Footer -->
    <div v-show="model.type !== 'conditions'" class="wf-node-footer">
      <n-popover ref="addNodePopoverRef" content-style="padding: 15px;" trigger="click">
        <template #trigger>
          <n-button circle class="wf-node-btn" size="medium" type="info">
            <template #icon>
              <n-icon size="24">
                <StrixIcon icon="circle-plus" />
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

    <!-- 配置项抽屉 -->
    <n-drawer v-model:show="showDrawer" :width="512">
      <n-drawer-content :native-scrollbar="false" closable>
        <template #header>
          <div class="node-drawer-header">
            <span v-if="!editNodeName">{{ model.name }}</span>
            <n-input
              v-else
              v-model:value="model.name"
              :maxlength="16"
              class="edit-input"
              placeholder="节点名称"
            />
            <StrixIcon class="edit-btn" icon="square-pen" @click="editNodeName = !editNodeName" />
            <span class="node-id-text">{{ model.id }}</span>
          </div>
        </template>
        <component :is="propsComponent" v-model="model.props" />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
<script lang="ts" setup>
import { getOperationName, getTypeName, nodeTypeMap, type WorkflowNode } from '@/components/workflow/util/workflow.js'
import ApprovalProps from './props/ApprovalProps.vue'
import CcProps from './props/CcProps.vue'
import ConditionProps from './props/ConditionProps.vue'
import TaskProps from './props/TaskProps.vue'

const model = defineModel<WorkflowNode>({ required: true })
const emit = defineEmits(['addNode', 'removeNode'])

const icon = computed(() => nodeTypeMap[model.value.type]?.icon || 'badge-question-mark')
const removable = computed(() => nodeTypeMap[model.value.type]?.removable || false)
const configurable = computed(() => nodeTypeMap[model.value.type]?.configurable || false)

// 编辑节点名称
const editNodeName = ref(false)

// 添加节点
const addNodePopoverRef = ref()
const addNode = (type: string) => {
  emit('addNode', type)
  addNodePopoverRef.value.setShow(false)
}

// 打开抽屉
const showDrawer = ref(false)
const openDrawer = () => {
  if (!configurable.value) return
  showDrawer.value = true
}

// 节点内容计算函数
const showContent = computed(() => {
  const nodeType = model.value.type
  if (nodeType === 'root') {
    return '发起人发起该流程'
  } else if (nodeType === 'approval' || nodeType === 'task' || nodeType === 'cc') {
    const operationName = getOperationName(nodeType)
    const { assign: { type: assignType, id: assignIds } = { type: '', id: [] } } =
      model.value.props || {}
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
    } else if (assignType === 'AUTO_REJECT') {
      return '系统自动拒绝该审批'
    }
  } else if (nodeType === 'condition') {
    return '点击查看条件'
  }
  return ''
})

// 配置项组件计算函数
const propsComponent = computed(() => {
  switch (model.value.type) {
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
<style lang="scss" scoped>
@use '@/assets/style/components/workflow.scss';

.node-drawer-header {
  display: flex;
  align-items: center;

  .edit-input {
    margin-left: 5px;
    width: 50%;
  }

  .edit-btn {
    cursor: pointer;
  }

  .node-id-text {
    margin-left: auto;
    font-size: 12px;
    opacity: 0.3;
  }
}
</style>
