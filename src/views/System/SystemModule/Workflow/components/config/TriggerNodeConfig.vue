<template>
  <n-form label-placement="left" label-width="auto">
    <n-form-item label="节点名称">
      <n-input v-model:value="config.name" @update:value="emitUpdate" />
    </n-form-item>
    <n-form-item label="触发器">
      <n-select
        v-model:value="config.triggerKey"
        :options="triggerOptions"
        :loading="loading"
        placeholder="选择触发器"
        filterable
        @update:value="emitUpdate"
      />
    </n-form-item>
    <n-form-item label="参数 (JSON)">
      <n-input
        v-model:value="paramsJson"
        type="textarea"
        :rows="4"
        placeholder='{"key": "value"}'
        @update:value="handleParamsChange"
      />
    </n-form-item>
  </n-form>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, onMounted } from 'vue'
import type { DesignerTreeNode, TriggerItem } from '@/api/workflow'
import { workflowApi } from '@/api/workflow'

const props = defineProps<{ node: DesignerTreeNode }>()
const emit = defineEmits<{ update: [config: Record<string, any>, name: string] }>()

const loading = ref(false)
const triggerOptions = ref<Array<{ label: string; value: string }>>([])

const config = reactive({
  name: props.node.name,
  triggerKey: props.node.config.triggerKey || ''
})

const paramsJson = ref(JSON.stringify(props.node.config.triggerParams || {}, null, 2))

onMounted(async () => {
  loading.value = true
  try {
    const { data: res } = await workflowApi.triggerList()
    triggerOptions.value = res.data.items.map((t: TriggerItem) => ({
      label: `${t.name} (${t.key})`,
      value: t.key
    }))
  } finally {
    loading.value = false
  }
})

watch(() => props.node.id, () => {
  config.name = props.node.name
  config.triggerKey = props.node.config.triggerKey || ''
  paramsJson.value = JSON.stringify(props.node.config.triggerParams || {}, null, 2)
})

function handleParamsChange(value: string) {
  paramsJson.value = value
  emitUpdate()
}

function emitUpdate() {
  let triggerParams = {}
  try { triggerParams = JSON.parse(paramsJson.value) } catch {}
  emit('update', { triggerKey: config.triggerKey, triggerParams }, config.name)
}
</script>
