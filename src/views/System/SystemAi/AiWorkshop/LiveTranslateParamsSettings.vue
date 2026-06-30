<!-- eslint-disable vue/no-mutating-props -- settings 是从父组件传入的 reactive 对象，设计上允许子组件直接修改其内部字段 -->
<template>
  <div class="lt-params">
    <n-form label-placement="top" :show-feedback="false">
      <!-- 源语种 -->
      <n-form-item label="源语种">
        <n-select
          :value="settings.sourceLanguage"
          :options="SOURCE_LANGUAGE_OPTIONS"
          :disabled="disabled"
          placeholder="自动检测"
          @update:value="(v) => (settings.sourceLanguage = v ?? '')"
        />
      </n-form-item>

      <!-- 目标语种 -->
      <n-form-item label="目标语种">
        <n-select v-model:value="settings.targetLanguage" :options="TARGET_LANGUAGE_OPTIONS" :disabled="disabled" />
      </n-form-item>

      <!-- 输出模态 -->
      <n-form-item label="输出模态">
        <n-radio-group v-model:value="modalityMode" :disabled="disabled" @update:value="onModalityChange">
          <n-space>
            <n-radio value="text">仅文本</n-radio>
            <n-radio value="text_audio">文本 + 音频</n-radio>
          </n-space>
        </n-radio-group>
      </n-form-item>

      <!-- 音色（仅文本+音频模式） -->
      <n-form-item v-if="hasAudio" label="输出音色">
        <n-select v-model:value="settings.voice" :options="TRANSLATE_VOICE_OPTIONS" :disabled="disabled" />
      </n-form-item>

      <!-- 同时输出源语言转写 -->
      <n-form-item label="同时转写源语言">
        <div class="lt-params__switch-row">
          <n-switch v-model:value="settings.enableSourceTranscription" :disabled="disabled" />
          <n-text depth="3" style="font-size: 12px">开启后同步返回源语言原文</n-text>
        </div>
      </n-form-item>

      <!-- 同声传译开关（仅文本+音频模式） -->
      <template v-if="hasAudio">
        <n-form-item label="同声传译">
          <div class="lt-params__switch-row">
            <n-switch v-model:value="settings.liveInterpretation" :disabled="disabled" />
            <n-text depth="3" style="font-size: 12px">开启后音频流式实时播放（不等待一段完成）</n-text>
          </div>
        </n-form-item>
      </template>

      <!-- 声音复刻（仅文本+音频模式） -->
      <template v-if="hasAudio">
        <n-form-item label="声音复刻">
          <div class="lt-params__switch-row">
            <n-switch v-model:value="settings.enableVoiceClone" :disabled="disabled" />
            <n-text depth="3" style="font-size: 12px">用发言人音色翻译播报</n-text>
          </div>
        </n-form-item>
        <n-form-item v-if="settings.enableVoiceClone" label="复刻频率">
          <n-select v-model:value="settings.voiceCloneFrequency" :options="CLONE_FREQ_OPTIONS" :disabled="disabled" />
        </n-form-item>
      </template>
    </n-form>

    <div class="lt-params__reset">
      <n-button text size="tiny" :disabled="disabled" @click="$emit('reset')">恢复默认</n-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { LiveTranslateSettings } from '@/composables/useLiveTranslateSettings'
import {
  SOURCE_LANGUAGE_OPTIONS,
  TARGET_LANGUAGE_OPTIONS,
  TRANSLATE_VOICE_OPTIONS
} from '@/composables/useLiveTranslateSettings'

interface Props {
  settings: LiveTranslateSettings
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), { disabled: false })
defineEmits<{ reset: [] }>()

const CLONE_FREQ_OPTIONS = [
  { label: 'once — 开始时复刻一次（单人演讲）', value: 'once' },
  { label: 'always — 每次实时复刻（多人对话）', value: 'always' },
  { label: 'never — 使用预先复刻的音色', value: 'never' }
]

const hasAudio = computed(() => props.settings.modalities.includes('audio'))
const modalityMode = computed(() => (hasAudio.value ? 'text_audio' : 'text'))

function onModalityChange(val: string) {
  // eslint-disable-next-line vue/no-mutating-props
  props.settings.modalities = val === 'text_audio' ? ['text', 'audio'] : ['text']
}
</script>

<style lang="scss" scoped>
.lt-params {
  display: flex;
  flex-direction: column;
  gap: 2px;

  :deep(.n-form-item) {
    margin-bottom: 10px;
  }

  &__switch-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__reset {
    display: flex;
    justify-content: flex-end;
    margin-top: 4px;
  }
}
</style>
