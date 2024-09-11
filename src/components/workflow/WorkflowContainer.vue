<template>
  <div>
    <div class="wf-tool-bar-container">
      <n-card class="wf-tool-bar" content-style="padding: 15px" hoverable>
        <n-button-group>
          <n-popconfirm :positive-button-props="{ type: 'warning' }" @positive-click="saveData">
            <template #trigger>
              <n-button>
                <template #icon>
                  <n-icon> <Icon icon="ion:save-outline" /></n-icon>
                </template>
                保存
              </n-button>
            </template>
            保存后该流程配置将立即生效, 是否确认? 该操作无法恢复!
          </n-popconfirm>
          <n-button @click="containerZoomIn">
            <template #icon>
              <n-icon> <Icon icon="ion:add-outline" /></n-icon>
            </template>
          </n-button>
          <n-button @click="containerZoomOut">
            <template #icon>
              <n-icon> <Icon icon="ion:remove-outline" /></n-icon>
            </template>
          </n-button>
        </n-button-group>
      </n-card>
    </div>

    <div class="canvas-container" @wheel="onWheel" @mousedown="startDrag" @mouseup="endDrag" @mousemove="onDrag">
      <div class="canvas" :style="canvasStyle">
        <n-el tag="div" class="wf-container" :style="'transform: scale(' + scale + ')'">
          <WorkflowBody />
        </n-el>
      </div>
    </div>
  </div>
</template>
<script setup>
import { renderWorkflow } from '@/components/workflow/util/workflow.js'
import { Icon } from '@iconify/vue'
import { NEl } from 'naive-ui'
import { computed, defineComponent, getCurrentInstance, ref, watch } from 'vue'

const { proxy } = getCurrentInstance()
const $props = defineProps({
  workflowId: {
    type: String,
    required: true
  },
  configId: {
    type: String,
    required: true
  },
  dataJson: {
    type: String,
    required: true
  }
})

// 画布拖拽功能
const canvasPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const startMousePosition = ref({ x: 0, y: 0 })
const canvasStyle = computed(() => ({
  transform: `translate(${canvasPosition.value.x}px, ${canvasPosition.value.y}px)`
}))
const startDrag = (event) => {
  isDragging.value = true
  startMousePosition.value = { x: event.clientX, y: event.clientY }
}
const endDrag = () => {
  isDragging.value = false
}
const onDrag = (event) => {
  if (isDragging.value) {
    const deltaX = event.clientX - startMousePosition.value.x
    const deltaY = event.clientY - startMousePosition.value.y
    canvasPosition.value.x += deltaX
    canvasPosition.value.y += deltaY
    startMousePosition.value = { x: event.clientX, y: event.clientY }
  }
}
// 根据滚轮的方向来调整缩放比例
const onWheel = (event) => {
  event.preventDefault()
  if (event.deltaY < 0) {
    containerZoomIn()
  } else {
    containerZoomOut()
  }
}
const scale = ref(1)
const containerZoomIn = () => {
  if (scale.value >= 2) {
    return
  }
  scale.value += 0.1
}
const containerZoomOut = () => {
  if (scale.value <= 0.5) {
    return
  }
  scale.value -= 0.1
}

const workflowData = ref({})
watch(
  () => $props.dataJson,
  (val) => {
    if (val) {
      workflowData.value = JSON.parse(val)
    }
  }
)

// 渲染节点
const WorkflowBody = defineComponent(() => {
  return () => {
    return renderWorkflow(workflowData.value)
  }
})

// 保存数据
const saveData = () => {
  console.log($props.dataId, workflowData.value)

  proxy.$http.post(
    `system/workflow/update/${$props.workflowId}/config`,
    {
      content: JSON.stringify(workflowData.value)
    },
    {
      operate: '保存流程数据'
    }
  )
}
</script>
<style lang="scss">
.wf-tool-bar-container {
  .wf-tool-bar {
    z-index: 100;
    position: absolute;
    right: 30px;
    top: 30px;
    width: auto;
  }
}

.canvas-container {
  width: 100%;
  height: calc(100vh - 160px);
  overflow: hidden;
  position: relative;
  cursor: grab;
}

.canvas-container:active {
  cursor: grabbing;
}

.canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.wf-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-wrap: wrap;
  width: auto;
  padding: 20px;
  user-select: none;
  -webkit-user-drag: none;

  .wf-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-wrap: wrap;

    .wf-node-main {
      // flex: 1;
      width: 300px;
      cursor: pointer;

      &:hover {
        border-color: var(--n-primary-color);
      }

      &.node-end {
        width: 140px;
        height: 30px;
        line-height: 30px;
        margin: 10px 0;
        font-size: 14px;
        text-align: center;
        border-radius: 10px;
        background-color: var(--clear-color);
      }

      .node-header {
        padding: 3px 10px;
        height: 28px;
        border-radius: 2px 2px 0 0;
        background-color: var(--clear-color);
        color: var(--text-color-1);

        &.node-approval {
          background-color: var(--primary-color-suppl);
        }

        &.node-task {
          background-color: var(--warning-color-suppl);
        }

        &.node-cc {
          background-color: var(--info-color-suppl);
        }

        .node-header-content {
          font-size: 14px;
          line-height: 14px;
          display: flex;
          align-items: stretch;

          .n-icon {
            margin-right: 5px;
          }
        }
      }

      .node-content {
        padding: 20px;
        font-size: 16px;
        color: var(--n-text-color);
        min-height: 60px;

        .node-body-content {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .n-icon {
            margin-right: 5px;
          }
        }
      }
    }
    .wf-node-footer {
      width: 34px;
      margin: 0 auto;
      position: relative;
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 0;
        margin: auto;
        width: 2px;
        height: 100%;
        background-color: var(--n-text-color);
        opacity: 0.1;
      }

      .wf-node-btn {
        z-index: 1;
        margin: 20px auto;
      }
    }
  }

  .wf-node-branch {
    position: relative;

    .wf-node-footer {
      // 覆盖wf-node下的footer样式
      &::before {
        opacity: 0;
      }
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 0;
      margin: auto;
      width: 2px;
      height: 100%;
      background-color: var(--n-text-color);
      opacity: 0.1;
    }
  }

  .wf-node-condition {
    overflow-x: auto;

    .wf-node-condition-main {
      width: 300px;
      margin: 10px 0;
    }
  }

  .branches-card {
    &:hover {
      border-color: var(--n-primary-color);
    }

    .branches-card-content {
      padding: 20px 36px 0 36px;
    }
  }
}
</style>
