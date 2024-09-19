<template>
  <div>
    <div class="wf-tool-bar-container">
      <n-card class="wf-tool-bar" content-style="padding: 15px" hoverable>
        <n-button-group>
          <n-popconfirm :positive-button-props="{ type: 'warning' }" @positive-click="saveData">
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
import { http } from '@/plugins/axios'
import { Icon } from '@iconify/vue'

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
  http.post(
    `system/workflow/update/${$props.workflowId}/config`,
    { content: JSON.stringify(workflowData.value) },
    { meta: { operate: '保存流程数据' } }
  )
}
</script>
<style lang="scss" scoped>
@import '@/assets/style/components/workflow.scss';
</style>
