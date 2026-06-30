<template>
  <div class="workshop-lt">
    <n-card title="实时语音翻译" class="workshop-card">
      <div class="realtime-layout">
        <!-- 左：控制面板 -->
        <div class="realtime-layout__panel">
          <n-form label-placement="top">
            <n-form-item label="选择模型">
              <n-select
                v-model:value="ltConfigKey"
                :options="ltModelOptions"
                placeholder="选择实时语音翻译模型"
                filterable
              />
            </n-form-item>
            <n-form-item label="麦克风">
              <n-select
                v-model:value="settings.deviceId"
                :options="deviceOptions"
                :disabled="recording || connecting"
                placeholder="选择麦克风输入设备"
              />
            </n-form-item>
          </n-form>

          <!-- 音频可视化指示器 -->
          <asr-audio-meter
            :rms="currentRms"
            :phase="vadPhase"
            :rms-start="settings.vad.rmsStart"
            :rms-stop="settings.vad.rmsStop"
          />

          <!-- 翻译参数（默认折叠） -->
          <n-collapse>
            <n-collapse-item title="翻译参数" name="translate-params">
              <live-translate-params-settings
                :settings="settings"
                :disabled="recording || connecting"
                @reset="resetSettings"
              />
            </n-collapse-item>
          </n-collapse>

          <!-- 高级 VAD 设置（默认折叠） -->
          <n-collapse>
            <n-collapse-item title="高级 VAD 设置" name="vad">
              <asr-vad-settings
                :vad="settings.vad"
                :always-send="settings.alwaysSend"
                @update="onVadUpdate"
                @update-always-send="(val: boolean) => (settings.alwaysSend = val)"
                @reset="resetVad"
              />
            </n-collapse-item>
          </n-collapse>

          <!-- 操作区 -->
          <div class="realtime-layout__actions">
            <n-button v-if="!recording && !connecting" type="primary" block :disabled="!ltConfigKey" @click="onStart">
              开始翻译
            </n-button>
            <n-button v-else type="error" block :loading="connecting" @click="stop">停止</n-button>
            <n-text depth="3" style="font-size: 12px">
              {{ connecting ? '连接中…' : recording ? '聆听中，请讲话…' : '点击开始，授权麦克风后实时翻译' }}
            </n-text>
            <n-alert v-if="errorMsg" type="error" :show-icon="false" style="background: transparent">
              {{ errorMsg }}
            </n-alert>
          </div>
        </div>

        <!-- 右：翻译结果 -->
        <div class="realtime-layout__result">
          <live-translate-result-view
            :units="units"
            :recording="recording"
            :source-lang="sourceLangLabel"
            :target-lang="targetLangLabel"
            @clear="units = []"
            @play="onPlayUnit"
          />
        </div>
      </div>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import type { AiModelConfigResp } from '@/api/ai'
import type { TranslationUnit } from '@/composables/useLiveTranslateStream'
import { useLiveTranslateStream } from '@/composables/useLiveTranslateStream'
import { langLabel, useLiveTranslateSettings } from '@/composables/useLiveTranslateSettings'
import type { AsrVadParams } from '@/composables/useAsrSettings'
import { useMediaDevices } from '@/composables/useMediaDevices'
import AsrAudioMeter from './AsrAudioMeter.vue'
import AsrVadSettings from './AsrVadSettings.vue'
import LiveTranslateParamsSettings from './LiveTranslateParamsSettings.vue'
import LiveTranslateResultView from './LiveTranslateResultView.vue'

interface Props {
  models: AiModelConfigResp[]
}

const props = defineProps<Props>()

// 只显示 LIVE_TRANSLATE (type=7) 类型的模型
const ltModelOptions = computed(() =>
  props.models.filter((m) => m.status === 1 && m.type === 7).map((m) => ({ label: m.name, value: m.key }))
)

const ltConfigKey = ref<string | null>(null)
const { settings, reset: resetSettings } = useLiveTranslateSettings()
const { options: deviceOptions, refresh: refreshDevices } = useMediaDevices()
const { recording, connecting, units, errorMsg, currentRms, vadPhase, start, stop, playUnitAudio } =
  useLiveTranslateStream(settings)

const sourceLangLabel = computed(() => langLabel(settings.sourceLanguage || ''))
const targetLangLabel = computed(() => langLabel(settings.targetLanguage || 'en'))

async function onStart() {
  if (!ltConfigKey.value) return
  await start(ltConfigKey.value)
  refreshDevices()
}

function onVadUpdate(key: keyof AsrVadParams, value: number) {
  settings.vad[key] = value
}

function resetVad() {
  resetSettings()
}

// 设备被拔出时回退系统默认
watch(deviceOptions, (opts) => {
  if (settings.deviceId && !opts.some((o) => o.value === settings.deviceId)) {
    settings.deviceId = ''
  }
})

function onPlayUnit(unit: TranslationUnit) {
  playUnitAudio(unit)
}
</script>

<style lang="scss" scoped>
.workshop-lt {
  .workshop-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
}

// 同 AiWorkshopStt 的两列布局
.realtime-layout {
  display: flex;
  gap: 16px;
  height: clamp(420px, calc(100vh - 320px), 760px);

  &__panel {
    flex: none;
    width: 340px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-y: auto;
    padding-right: 4px;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: auto;
  }

  &__result {
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 900px) {
  .realtime-layout {
    flex-direction: column;
    height: auto;

    &__panel {
      width: 100%;
      overflow: visible;
    }

    &__result {
      height: 480px;
    }
  }
}
</style>
