<template>
  <n-form label-placement="left" label-width="auto">
    <n-form-item label="节点名称">
      <n-input v-model:value="config.name" @update:value="emitUpdate" />
    </n-form-item>
    <n-form-item label="延迟类型">
      <n-radio-group v-model:value="config.delayType" @update:value="emitUpdate">
        <n-radio-button value="FIXED">固定时长</n-radio-button>
        <n-radio-button value="UNTIL">指定时间</n-radio-button>
      </n-radio-group>
    </n-form-item>
    <n-form-item v-if="config.delayType === 'FIXED'" label="延迟时长">
      <n-input-group>
        <n-input-number v-model:value="config.delayValue" :min="1" style="width: 60%"
                        @update:value="emitUpdate" />
        <n-select
          v-model:value="config.delayUnit"
          :options="unitOptions"
          style="width: 40%"
          @update:value="emitUpdate"
        />
      </n-input-group>
    </n-form-item>
  </n-form>
</template>

<script lang="ts" setup>
import { reactive, watch } from 'vue'
import type { DesignerTreeNode } from '@/api/workflow'

const props = defineProps<{ node: DesignerTreeNode }>()
const emit = defineEmits<{ update: [config: Record<string, any>, name: string] }>()

const unitOptions = [
  { label: '分钟', value: 'MINUTES' },
  { label: '小时', value: 'HOURS' },
  { label: '天', value: 'DAYS' }
]

const config = reactive({
  name: props.node.name,
  delayType: props.node.config.delayType || 'FIXED',
  delayValue: props.node.config.delayValue ?? 1,
  delayUnit: props.node.config.delayUnit || 'HOURS'
})

watch(
  () => props.node.id,
  () => {
    Object.assign(config, {
      name: props.node.name,
      delayType: props.node.config.delayType || 'FIXED',
      delayValue: props.node.config.delayValue ?? 1,
      delayUnit: props.node.config.delayUnit || 'HOURS'
    })
  }
)

function emitUpdate() {
  const { name, ...rest } = config
  emit('update', rest, name)
}
</script>
