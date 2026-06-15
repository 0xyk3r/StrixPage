<template>
  <div class="ai-workshop-page">
    <n-tabs v-model:value="activeTab" type="line" animated>
      <n-tab-pane name="tts" tab="语音合成 (TTS)">
        <ai-workshop-tts :models="models" />
      </n-tab-pane>
      <n-tab-pane name="stt" tab="语音识别 (STT)">
        <ai-workshop-stt :models="models" />
      </n-tab-pane>
      <n-tab-pane name="image" tab="图片生成">
        <ai-workshop-image :models="models" />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script lang="ts" setup>
import type { AiModelConfigResp } from '@/api/ai'
import { aiApi } from '@/api/ai'
import AiWorkshopTts from './AiWorkshopTts.vue'
import AiWorkshopStt from './AiWorkshopStt.vue'
import AiWorkshopImage from './AiWorkshopImage.vue'

const activeTab = ref('tts')
const models = ref<AiModelConfigResp[]>([])

async function loadModels() {
  const res = await aiApi.modelConfigList()
  models.value = (res.data?.data ?? []) as AiModelConfigResp[]
}

onMounted(() => loadModels())
</script>

<style lang="scss" scoped>
.ai-workshop-page {
  padding: 16px;

  :deep(.workshop-card) {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
}
</style>
