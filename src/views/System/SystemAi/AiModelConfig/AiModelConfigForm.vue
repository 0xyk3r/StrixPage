<template>
  <n-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-placement="left"
    label-width="120px"
    require-mark-placement="right-hanging"
  >
    <!-- 基础信息 -->
    <n-form-item label="配置 Key" path="key">
      <n-input v-model:value="form.key" clearable placeholder="唯一标识，如 qwen3-max" />
    </n-form-item>
    <n-form-item label="配置名称" path="name">
      <n-input v-model:value="form.name" clearable placeholder="显示名称" />
    </n-form-item>
    <n-form-item label="模型类型" path="type">
      <n-select v-model:value="form.type" :options="typeOptions" placeholder="请选择模型类型" />
    </n-form-item>
    <n-form-item label="Base URL" path="baseUrl">
      <n-input
        v-model:value="form.baseUrl"
        clearable
        placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
      />
    </n-form-item>
    <n-form-item label="API Key" path="apiKey">
      <n-input
        v-model:value="form.apiKey"
        type="password"
        show-password-on="click"
        clearable
        :placeholder="isEdit ? '不修改请留空' : '请输入 API Key'"
      />
    </n-form-item>
    <n-form-item label="模型名称" path="modelName">
      <n-input v-model:value="form.modelName" clearable placeholder="如 qwen3-max" />
    </n-form-item>
    <n-form-item label="状态" path="status">
      <n-switch v-model:value="statusSwitch" />
    </n-form-item>
    <n-form-item label="备注" path="remark">
      <n-input v-model:value="form.remark" type="textarea" clearable placeholder="备注信息" :rows="2" />
    </n-form-item>

    <!-- TEXT / VISION 参数 -->
    <template v-if="isTextOrVision">
      <n-form-item label="系统提示词" path="systemPrompt">
        <n-input
          v-model:value="form.systemPrompt"
          type="textarea"
          clearable
          placeholder="系统提示词（可选）"
          :rows="4"
        />
      </n-form-item>
      <n-form-item label="Temperature">
        <n-input-number v-model:value="form.temperature" :min="0" :max="2" :step="0.1" clearable style="width: 160px" />
      </n-form-item>
      <n-form-item label="Top P">
        <n-input-number v-model:value="form.topP" :min="0" :max="1" :step="0.1" clearable style="width: 160px" />
      </n-form-item>
      <n-form-item label="Max Tokens">
        <n-input-number v-model:value="form.maxTokens" :min="1" clearable style="width: 160px" />
      </n-form-item>
    </template>

    <!-- TEXT only -->
    <template v-if="isText">
      <n-form-item label="启用思考模式">
        <n-switch v-model:value="thinkingSwitch" />
      </n-form-item>
      <n-form-item v-if="thinkingSwitch" label="思考 Token 预算">
        <n-input-number v-model:value="form.thinkingBudget" :min="1024" :step="1024" clearable style="width: 160px" />
      </n-form-item>
    </template>

    <!-- TTS 参数 -->
    <template v-if="isTts">
      <n-form-item label="默认音色" path="voice">
        <n-input v-model:value="form.voice" clearable placeholder="如 longxiaochun" />
      </n-form-item>
      <n-form-item label="语速">
        <n-input-number v-model:value="form.speed" :min="0.25" :max="4.0" :step="0.25" clearable style="width: 160px" />
      </n-form-item>
      <n-form-item label="响应格式" path="responseFormat">
        <n-select
          v-model:value="form.responseFormat"
          :options="audioFormatOptions"
          clearable
          placeholder="音频格式"
          style="width: 200px"
        />
      </n-form-item>
    </template>

    <!-- STT 参数 -->
    <template v-if="isStt">
      <n-form-item label="语言" path="language">
        <n-input v-model:value="form.language" clearable placeholder="如 zh / en（可选）" />
      </n-form-item>
      <n-form-item label="响应格式" path="responseFormat">
        <n-select
          v-model:value="form.responseFormat"
          :options="sttFormatOptions"
          clearable
          placeholder="结果格式"
          style="width: 200px"
        />
      </n-form-item>
    </template>

    <n-space justify="end" style="margin-top: 16px">
      <n-button @click="emit('cancel')">取消</n-button>
      <n-button type="primary" :loading="saving" @click="submit">保存</n-button>
    </n-space>
  </n-form>
</template>

<script lang="ts" setup>
import type { FormInst, FormRules } from 'naive-ui'
import type { AiModelConfigResp, AiModelConfigUpdateReq } from '@/api/ai'
import { aiApi } from '@/api/ai'

interface Props {
  editId?: string
  initialData?: AiModelConfigResp | null
}

const props = withDefaults(defineProps<Props>(), { editId: '', initialData: null })
const emit = defineEmits<{ (e: 'saved'): void; (e: 'cancel'): void }>()

const message = useMessage()
const formRef = ref<FormInst | null>(null)
const saving = ref(false)
const isEdit = computed(() => !!props.editId)

const typeOptions = [
  { label: 'TEXT（文本对话）', value: 1 },
  { label: 'VISION（视觉理解）', value: 2 },
  { label: 'TTS（语音合成）', value: 3 },
  { label: 'STT（语音识别）', value: 4 },
  { label: 'IMAGE_GEN（图片生成）', value: 5 }
]

const audioFormatOptions = [
  { label: 'mp3', value: 'mp3' },
  { label: 'wav', value: 'wav' },
  { label: 'pcm', value: 'pcm' },
  { label: 'opus', value: 'opus' }
]

const sttFormatOptions = [
  { label: 'json（默认）', value: 'json' },
  { label: 'text', value: 'text' },
  { label: 'verbose_json', value: 'verbose_json' }
]

const getDefaultForm = (): AiModelConfigUpdateReq & { apiKey: string } => ({
  key: '',
  name: '',
  type: 1,
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: '',
  modelName: '',
  temperature: null,
  topP: null,
  maxTokens: null,
  systemPrompt: '',
  enableThinking: false,
  thinkingBudget: null,
  voice: '',
  speed: null,
  responseFormat: '',
  language: '',
  status: 1,
  remark: ''
})

const form = ref(getDefaultForm())
const statusSwitch = computed({
  get: () => form.value.status === 1,
  set: (v) => (form.value.status = v ? 1 : 0)
})
const thinkingSwitch = computed({
  get: () => !!form.value.enableThinking,
  set: (v) => {
    form.value.enableThinking = v
    if (!v) form.value.thinkingBudget = null
  }
})

const isText = computed(() => form.value.type === 1)
const isTextOrVision = computed(() => form.value.type === 1 || form.value.type === 2)
const isTts = computed(() => form.value.type === 3)
const isStt = computed(() => form.value.type === 4)

watch(
  () => props.initialData,
  (data) => {
    if (data) {
      Object.assign(form.value, {
        key: data.key,
        name: data.name,
        type: data.type,
        baseUrl: data.baseUrl,
        apiKey: '',
        modelName: data.modelName,
        temperature: data.temperature ?? null,
        topP: data.topP ?? null,
        maxTokens: data.maxTokens ?? null,
        systemPrompt: data.systemPrompt ?? '',
        enableThinking: data.enableThinking ?? false,
        thinkingBudget: data.thinkingBudget ?? null,
        voice: data.voice ?? '',
        speed: data.speed ?? null,
        responseFormat: data.responseFormat ?? '',
        language: data.language ?? '',
        status: data.status ?? 1,
        remark: data.remark ?? ''
      })
    } else {
      form.value = getDefaultForm()
    }
  },
  { immediate: true }
)

const rules: FormRules = {
  key: [{ required: true, message: '请输入配置 Key', trigger: 'blur' }],
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  type: [{ required: true, type: 'number', message: '请选择模型类型', trigger: 'change' }],
  baseUrl: [{ required: true, message: '请输入 Base URL', trigger: 'blur' }],
  modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }]
}

async function submit() {
  try {
    await formRef.value!.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    const payload: AiModelConfigUpdateReq = { ...form.value }
    if (!payload.apiKey) delete payload.apiKey

    const res = isEdit.value
      ? await aiApi.modelConfigUpdate(props.editId!, payload)
      : await aiApi.modelConfigCreate(payload)

    if (res.data?.code === 200) {
      message.success(isEdit.value ? '更新成功' : '添加成功')
      emit('saved')
    } else {
      message.error(res.data?.msg ?? '操作失败')
    }
  } finally {
    saving.value = false
  }
}
</script>
