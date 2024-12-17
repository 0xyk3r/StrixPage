<template>
  <div>
    <div>
      <n-card class="wf-tool-bar" content-style="padding: 15px" hoverable>
        <n-button-group>
          <n-popconfirm :positive-button-props="{ type: 'warning' }" @positive-click="emitSave">
            <template #trigger>
              <n-button>
                <template #icon>
                  <n-icon>
                    <Icon icon="ion:save-outline" />
                  </n-icon>
                </template>
                保存
              </n-button>
            </template>
            保存后该流程配置将立即生效, 是否确认? 该操作无法恢复!
          </n-popconfirm>
          <n-button @click="containerZoomIn">
            <template #icon>
              <n-icon>
                <Icon icon="ion:add-outline" />
              </n-icon>
            </template>
          </n-button>
          <n-button @click="containerZoomOut">
            <template #icon>
              <n-icon>
                <Icon icon="ion:remove-outline" />
              </n-icon>
            </template>
          </n-button>
        </n-button-group>
      </n-card>
    </div>

    <div
      class="wf-canvas-container"
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="endDrag"
      @wheel="onWheel"
    >
      <div :style="canvasStyle" class="wf-canvas">
        <n-el :style="'transform: scale(' + scale + ')'" class="wf-container" tag="div">
          <WorkflowBody />
        </n-el>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { renderWorkflow, type WorkflowNode } from '@/components/workflow/util/workflow.js'
import { Icon } from '@iconify/vue'

const { dataJson } = defineProps<{ dataJson: string }>()
const emit = defineEmits(['save'])

// 画布拖拽功能
const canvasPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const startMousePosition = ref({ x: 0, y: 0 })
const canvasStyle = computed(() => ({
  transform: `translate(${canvasPosition.value.x}px, ${canvasPosition.value.y}px)`
}))
const startDrag = (event: MouseEvent) => {
  isDragging.value = true
  startMousePosition.value = { x: event.clientX, y: event.clientY }
}
const endDrag = () => {
  isDragging.value = false
}
const onDrag = (event: MouseEvent) => {
  if (isDragging.value) {
    const deltaX = event.clientX - startMousePosition.value.x
    const deltaY = event.clientY - startMousePosition.value.y
    canvasPosition.value.x += deltaX
    canvasPosition.value.y += deltaY
    startMousePosition.value = { x: event.clientX, y: event.clientY }
  }
}
// 根据滚轮的方向来调整缩放比例
const onWheel = (event: WheelEvent) => {
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

const workflowData = ref<WorkflowNode[]>([])
watch(
  () => dataJson,
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

const emitSave = () => {
  emit('save', workflowData.value)
}
</script>
<style lang="scss" scoped>
@use '@/assets/style/components/workflow.scss';

.wf-tool-bar {
  z-index: 100;
  position: absolute;
  right: 30px;
  top: 30px;
  width: auto;
}

.wf-canvas-container {
  width: 100%;
  height: calc(100vh - 120px);
  overflow: hidden;
  position: relative;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  .wf-canvas {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
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
}
</style>
