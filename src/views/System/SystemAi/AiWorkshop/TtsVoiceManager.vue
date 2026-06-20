<template>
  <div class="voice-manager">
    <n-tabs v-model:value="tab" type="segment" size="small">
      <!-- 音色列表 -->
      <n-tab-pane name="list" tab="音色列表">
        <div class="voice-manager__toolbar">
          <n-text depth="3" style="font-size: 12px">本地音色列表</n-text>
          <n-button size="tiny" ghost :loading="syncing" :disabled="!configKey" @click="onSync">
            同步云端音色
          </n-button>
        </div>
        <div class="voice-manager__list">
          <n-empty v-if="voices.length === 0" description="暂无音色，请先复刻或设计音色，或同步云端音色" />
          <div v-for="v in voices" :key="v.id" class="voice-item">
            <div class="voice-item__main">
              <div class="voice-item__title">
                <span class="voice-item__name">{{ v.name }}</span>
                <n-tag size="small" :type="v.voiceType === 1 ? 'info' : 'success'" :bordered="false">
                  {{ v.voiceType === 1 ? '复刻' : '设计' }}
                </n-tag>
                <n-tag
                  size="small"
                  :type="v.status === 'OK' ? 'success' : v.status === 'DEPLOYING' ? 'warning' : 'error'"
                  :bordered="false"
                >
                  {{ statusLabel(v.status) }}
                </n-tag>
              </div>
              <span class="voice-item__id">{{ v.voiceId }}</span>
              <span v-if="v.voicePrompt" class="voice-item__desc">{{ v.voicePrompt }}</span>
            </div>
            <n-button size="tiny" type="error" ghost :loading="removingId === v.id" @click="onRemove(v)">
              删除
            </n-button>
          </div>
        </div>
      </n-tab-pane>

      <!-- 声音复刻 -->
      <n-tab-pane name="clone" tab="声音复刻">
        <n-form label-placement="top" size="small">
          <n-form-item label="音色名称" required>
            <n-input v-model:value="cloneForm.name" placeholder="给音色起个名字" maxlength="128" />
          </n-form-item>
          <n-form-item label="参考音频">
            <n-radio-group v-model:value="cloneSource" size="small">
              <n-radio-button value="upload">上传文件</n-radio-button>
              <n-radio-button value="url">公网 URL</n-radio-button>
            </n-radio-group>
          </n-form-item>
          <n-form-item v-if="cloneSource === 'upload'" label="音频文件">
            <n-upload :max="1" accept="audio/*" :default-upload="false" @change="onUploadChange">
              <n-button :disabled="cloning">{{ cloneFile ? cloneFile.name : '选择音频（10~20秒）' }}</n-button>
            </n-upload>
          </n-form-item>
          <n-form-item v-else label="音频 URL">
            <n-input v-model:value="cloneForm.audioUrl" placeholder="公网可访问的音频 URL" />
          </n-form-item>
          <n-form-item label="备注">
            <n-input v-model:value="cloneForm.remark" placeholder="可选" maxlength="512" />
          </n-form-item>
          <n-button type="primary" block :loading="cloning" :disabled="!canClone" @click="onClone">
            开始复刻
          </n-button>
          <n-text v-if="cloneHint" depth="3" class="voice-manager__status">{{ cloneHint }}</n-text>
        </n-form>
      </n-tab-pane>

      <!-- 声音设计 -->
      <n-tab-pane name="design" tab="声音设计">
        <n-form label-placement="top" size="small">
          <n-form-item label="音色名称" required>
            <n-input v-model:value="designForm.name" placeholder="给音色起个名字" maxlength="128" />
          </n-form-item>
          <n-form-item label="声音描述">
            <n-input
              v-model:value="designForm.voicePrompt"
              type="textarea"
              :rows="3"
              placeholder="如：沉稳的中年男性，音色低沉浑厚，富有磁性，适合新闻播报"
              maxlength="500"
              show-count
            />
          </n-form-item>
          <n-form-item label="预览文本">
            <n-input
              v-model:value="designForm.previewText"
              type="textarea"
              :rows="2"
              placeholder="试听音频朗读的文本"
              maxlength="200"
            />
          </n-form-item>
          <n-form-item label="备注">
            <n-input v-model:value="designForm.remark" placeholder="可选" maxlength="512" />
          </n-form-item>
          <n-button type="primary" block :loading="designing" :disabled="!canDesign" @click="onDesign">
            开始设计
          </n-button>
          <n-text v-if="designHint" depth="3" class="voice-manager__status">{{ designHint }}</n-text>
        </n-form>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script lang="ts" setup>
import type { UploadFileInfo } from 'naive-ui'
import type { AiTtsVoiceResp } from '@/api/ai'
import { aiApi } from '@/api/ai'

const props = defineProps<{ configKey: string | null }>()
const emit = defineEmits<{
  /** 新建音色成功（复刻/设计），携带 voiceId */
  created: [voiceId: string]
  /** 音色列表发生变化（同步/删除），通知父组件刷新音色选择器 */
  refresh: []
  /** 删除某音色，携带被删除的 voiceId（父组件据此清除已选） */
  removed: [voiceId: string]
  /** 声音设计预览音频，交由父组件在合成结果区展示 */
  preview: [blob: Blob]
}>()

const message = useMessage()
const dialog = useDialog()
const tab = ref<'list' | 'clone' | 'design'>('list')

const voices = ref<AiTtsVoiceResp[]>([])
const removingId = ref('')
const syncing = ref(false)

function statusLabel(s: string) {
  return s === 'OK' ? '可用' : s === 'DEPLOYING' ? '审核中' : '不可用'
}

async function loadVoices() {
  if (!props.configKey) {
    voices.value = []
    return
  }
  const res = await aiApi.ttsVoiceList(props.configKey)
  voices.value = (res.data?.data ?? []) as AiTtsVoiceResp[]
}

/** 同步云端历史音色到本地 */
async function onSync() {
  if (!props.configKey) return
  syncing.value = true
  try {
    const res = await aiApi.ttsVoiceSync(props.configKey)
    if (res.data?.code === 200) {
      const added = res.data.data ?? 0
      message.success(added > 0 ? `已同步 ${added} 个云端音色` : '云端无新增音色')
      await loadVoices()
      if (added > 0) emit('refresh')
    } else {
      message.error(res.data?.msg ?? '同步失败')
    }
  } catch (e: any) {
    message.error('同步失败：' + (e?.message ?? '未知错误'))
  } finally {
    syncing.value = false
  }
}

watch(() => props.configKey, loadVoices, { immediate: true })

defineExpose({ loadVoices })

// ——— 删除 ———
function onRemove(v: AiTtsVoiceResp) {
  dialog.warning({
    title: '删除音色',
    content: `确定删除音色「${v.name}」？此操作会同步删除云端音色，不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      removingId.value = v.id
      try {
        const res = await aiApi.ttsVoiceRemove(v.id)
        if (res.data?.code === 200) {
          message.success('已删除')
          await loadVoices()
          emit('removed', v.voiceId)
        } else {
          message.error(res.data?.msg ?? '删除失败')
        }
      } finally {
        removingId.value = ''
      }
    }
  })
}

// ——— 轮询任务 ———
/** 进行中的轮询定时器集合（组件卸载时统一清理，避免在已销毁组件上回调） */
const pollTimers = new Set<ReturnType<typeof setTimeout>>()

/** 轮询异步任务，成功回调 result；约 6 分钟超时 */
function pollTask(taskId: string, onSuccess: (result: string) => void, onFinally: () => void) {
  let attempts = 0
  const maxAttempts = 180
  const schedule = () => {
    const timer = setTimeout(() => {
      pollTimers.delete(timer)
      tick()
    }, 2000)
    pollTimers.add(timer)
  }
  const tick = async () => {
    attempts++
    try {
      const res = await aiApi.taskStatus(taskId)
      const st = res.data?.data
      if (st?.status === 'SUCCEEDED') {
        onSuccess(st.result ?? '')
        onFinally()
        return
      }
      if (st?.status === 'FAILED') {
        message.error('任务失败：' + (st.error ?? '未知错误'))
        onFinally()
        return
      }
    } catch {
      /* 单次失败容忍，继续轮询 */
    }
    if (attempts >= maxAttempts) {
      message.error('任务超时，请稍后在列表中查看')
      onFinally()
      return
    }
    schedule()
  }
  schedule()
}

onUnmounted(() => {
  pollTimers.forEach((t) => clearTimeout(t))
  pollTimers.clear()
})

// ——— 声音复刻 ———
const cloneSource = ref<'upload' | 'url'>('upload')
const cloneFile = ref<File | null>(null)
const cloning = ref(false)
const cloneHint = ref('')
const cloneForm = reactive({ name: '', audioUrl: '', remark: '' })

const canClone = computed(
  () => !!cloneForm.name.trim() && (cloneSource.value === 'upload' ? !!cloneFile.value : !!cloneForm.audioUrl.trim())
)

function onUploadChange(options: { fileList: UploadFileInfo[] }) {
  cloneFile.value = options.fileList[0]?.file ?? null
}

async function onClone() {
  if (!props.configKey) {
    message.error('请先选择 TTS 模型')
    return
  }
  cloning.value = true
  cloneHint.value = '正在提交复刻任务…'
  try {
    const res =
      cloneSource.value === 'upload'
        ? await aiApi.ttsVoiceCloneUpload(props.configKey, cloneForm.name, cloneFile.value!, cloneForm.remark)
        : await aiApi.ttsVoiceClone({
          configKey: props.configKey,
          name: cloneForm.name,
          audioUrl: cloneForm.audioUrl,
          remark: cloneForm.remark
        })
    const taskId = res.data?.data
    if (res.data?.code !== 200 || !taskId) {
      message.error(res.data?.msg ?? '提交失败')
      cloning.value = false
      cloneHint.value = ''
      return
    }
    cloneHint.value = '复刻中，云端审核约需数分钟，请耐心等待…'
    pollTask(
      taskId,
      (voiceId) => {
        message.success('声音复刻成功')
        cloneForm.name = ''
        cloneForm.audioUrl = ''
        cloneForm.remark = ''
        cloneFile.value = null
        tab.value = 'list'
        loadVoices()
        emit('created', voiceId)
      },
      () => {
        cloning.value = false
        cloneHint.value = ''
      }
    )
  } catch (e: any) {
    message.error('复刻失败：' + (e?.message ?? '未知错误'))
    cloning.value = false
    cloneHint.value = ''
  }
}

// ——— 声音设计 ———
const designing = ref(false)
const designHint = ref('')
const designForm = reactive({ name: '', voicePrompt: '', previewText: '', remark: '' })

const canDesign = computed(
  () => !!designForm.name.trim() && !!designForm.voicePrompt.trim() && !!designForm.previewText.trim()
)

async function onDesign() {
  if (!props.configKey) {
    message.error('请先选择 TTS 模型')
    return
  }
  designing.value = true
  designHint.value = '正在提交设计任务…'
  try {
    const res = await aiApi.ttsVoiceDesign({
      configKey: props.configKey,
      name: designForm.name,
      voicePrompt: designForm.voicePrompt,
      previewText: designForm.previewText,
      remark: designForm.remark
    })
    const taskId = res.data?.data
    if (res.data?.code !== 200 || !taskId) {
      message.error(res.data?.msg ?? '提交失败')
      designing.value = false
      designHint.value = ''
      return
    }
    designHint.value = '设计中，请稍候…'
    pollTask(
      taskId,
      (result) => {
        // result 格式：voiceId|预览Base64(WAV)
        const sep = result.indexOf('|')
        const voiceId = sep >= 0 ? result.slice(0, sep) : result
        const previewB64 = sep >= 0 ? result.slice(sep + 1) : ''
        if (previewB64) {
          // 预览音频交由父组件在合成结果区统一展示
          emit('preview', base64ToWavBlob(previewB64))
        }
        message.success('声音设计成功')
        loadVoices()
        emit('created', voiceId)
      },
      () => {
        designing.value = false
        designHint.value = ''
      }
    )
  } catch (e: any) {
    message.error('设计失败：' + (e?.message ?? '未知错误'))
    designing.value = false
    designHint.value = ''
  }
}

/** 后端预览音频已是完整 WAV 的 Base64，转为 WAV Blob 交父组件展示 */
function base64ToWavBlob(b64: string): Blob {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: 'audio/wav' })
}

</script>

<style lang="scss" scoped>
.voice-manager {
  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 360px;
    overflow-y: auto;
  }

  &__status {
    display: block;
    margin-top: 8px;
    font-size: 12px;
  }
}

.voice-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-subtle);

  &__main {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__name {
    font-size: 14px;
    color: var(--strix-text-primary);
  }

  &__id {
    font-size: 11px;
    color: var(--strix-text-tertiary);
    font-family: monospace;
  }

  &__desc {
    font-size: 12px;
    color: var(--strix-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 280px;
  }
}
</style>
