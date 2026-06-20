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
      <n-space vertical style="width: 100%">
        <n-space>
          <n-button :disabled="!canFetchModels" :loading="fetchingModels" @click="fetchModels">
            获取模型列表
          </n-button>
          <n-text depth="3" style="font-size: 12px">填写 Base URL 和 API Key 后可获取</n-text>
        </n-space>
        <n-checkbox-group v-if="fetchedModels.length > 0" v-model:value="filterTypes">
          <n-space>
            <n-checkbox :value="1" label="TEXT" />
            <n-checkbox :value="2" label="VISION" />
            <n-checkbox :value="3" label="TTS" />
            <n-checkbox :value="4" label="STT" />
            <n-checkbox :value="5" label="IMAGE_GEN" />
            <n-checkbox :value="6" label="ASR" />
          </n-space>
        </n-checkbox-group>
        <n-select
          v-if="fetchedModels.length > 0"
          v-model:value="form.modelName"
          :options="modelOptions"
          filterable
          tag
          clearable
          placeholder="选择或输入模型名称"
        />
        <n-input v-else v-model:value="form.modelName" clearable placeholder="如 qwen3-max" />
      </n-space>
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
      <n-form-item label="代码解释器">
        <n-space align="center">
          <n-switch v-model:value="codeInterpreterSwitch" :disabled="!thinkingSwitch" />
          <n-text depth="3" style="font-size: 12px">需开启思考模式，仅流式对话生效</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="联网搜索">
        <n-switch v-model:value="searchSwitch" />
      </n-form-item>
      <n-form-item v-if="searchSwitch" label="搜索策略">
        <n-select
          v-model:value="form.searchStrategy"
          :options="searchStrategyOptions"
          clearable
          placeholder="选择搜索策略"
          style="width: 220px"
        />
      </n-form-item>
      <n-form-item v-if="searchSwitch" label="来源引用">
        <n-space align="center">
          <n-switch v-model:value="sourceSwitch" />
          <n-text depth="3" style="font-size: 12px">在回答中附带搜索来源</n-text>
        </n-space>
      </n-form-item>
    </template>

    <!-- TTS 参数 -->
    <template v-if="isTts">
      <n-form-item label="默认音色" path="voice">
        <n-input v-model:value="form.voice" clearable placeholder="可选，cosyvoice-v3.5 无系统音色，请在工坊复刻/设计" />
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
      <n-form-item label="存储配置" path="ossConfigKey">
        <n-select
          v-model:value="form.ossConfigKey"
          :options="ossConfigOptions"
          clearable
          filterable
          placeholder="声音复刻上传音频经此 OSS 转公网 URL（可选）"
          style="width: 100%"
          @update:value="onOssConfigChange"
        />
      </n-form-item>
      <n-form-item label="存储空间" path="ossBucketName">
        <n-select
          v-model:value="form.ossBucketName"
          :options="ossBucketOptions"
          :loading="loadingBuckets"
          :disabled="!form.ossConfigKey"
          clearable
          filterable
          :placeholder="form.ossConfigKey ? '选择存储空间 Bucket' : '请先选择存储配置'"
          style="width: 100%"
        />
      </n-form-item>
    </template>

    <!-- STT 参数（离线语音识别） -->
    <template v-if="isStt">
      <n-form-item label="存储配置" path="ossConfigKey">
        <n-select
          v-model:value="form.ossConfigKey"
          :options="ossConfigOptions"
          clearable
          filterable
          placeholder="选择 OSS 存储配置（音频经此上传转写）"
          style="width: 100%"
          @update:value="onOssConfigChange"
        />
      </n-form-item>
      <n-form-item label="存储空间" path="ossBucketName">
        <n-select
          v-model:value="form.ossBucketName"
          :options="ossBucketOptions"
          :loading="loadingBuckets"
          :disabled="!form.ossConfigKey"
          clearable
          filterable
          :placeholder="form.ossConfigKey ? '选择存储空间 Bucket' : '请先选择存储配置'"
          style="width: 100%"
        />
      </n-form-item>
      <n-form-item label="语言" path="language">
        <n-input v-model:value="form.language" clearable placeholder="如 zh / en（可选，默认语种）" />
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
      <n-form-item label="说话人分离">
        <n-space align="center">
          <n-switch v-model:value="sttParamsForm.diarizationEnabled" />
          <n-text depth="3" style="font-size: 12px">仅 Fun-ASR / Paraformer</n-text>
        </n-space>
      </n-form-item>
      <n-form-item v-if="sttParamsForm.diarizationEnabled" label="说话人数">
        <n-input-number
          v-model:value="sttParamsForm.speakerCount"
          :min="2"
          :max="100"
          clearable
          placeholder="自动判断"
          style="width: 180px"
        />
      </n-form-item>
      <n-form-item label="过滤语气词">
        <n-space align="center">
          <n-switch v-model:value="sttParamsForm.disfluencyRemovalEnabled" />
          <n-text depth="3" style="font-size: 12px">仅 Paraformer</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="时间戳校准">
        <n-space align="center">
          <n-switch v-model:value="sttParamsForm.timestampAlignmentEnabled" />
          <n-text depth="3" style="font-size: 12px">仅 Paraformer</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="数字正则化">
        <n-space align="center">
          <n-switch v-model:value="sttParamsForm.enableItn" />
          <n-text depth="3" style="font-size: 12px">ITN，仅 Qwen</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="字级时间戳">
        <n-space align="center">
          <n-switch v-model:value="sttParamsForm.enableWords" />
          <n-text depth="3" style="font-size: 12px">仅 Qwen-Filetrans</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="热词 ID">
        <n-input
          v-model:value="sttParamsForm.vocabularyId"
          clearable
          placeholder="可选，热词列表 ID（Fun-ASR/Paraformer）"
        />
      </n-form-item>
    </template>

    <!-- ASR 参数（实时语音识别） -->
    <template v-if="isAsr">
      <n-form-item label="语言" path="language">
        <n-input v-model:value="form.language" clearable placeholder="如 zh / en（可选）" />
      </n-form-item>
      <n-form-item label="语义断句">
        <n-space align="center">
          <n-switch v-model:value="asrParamsForm.semanticPunctuationEnabled" />
          <n-text depth="3" style="font-size: 12px">开启后关闭 VAD 断句；Paraformer-8k-v2 情感识别需关闭</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="断句静音(ms)">
        <n-input-number
          v-model:value="asrParamsForm.maxSentenceSilence"
          :min="200"
          :max="6000"
          :step="100"
          clearable
          placeholder="默认 1300"
          style="width: 180px"
        />
      </n-form-item>
      <n-form-item label="多阈值模式">
        <n-switch v-model:value="asrParamsForm.multiThresholdModeEnabled" />
      </n-form-item>
      <n-form-item label="过滤语气词">
        <n-space align="center">
          <n-switch v-model:value="asrParamsForm.disfluencyRemovalEnabled" />
          <n-text depth="3" style="font-size: 12px">仅 Paraformer</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="标点预测">
        <n-space align="center">
          <n-switch v-model:value="asrParamsForm.punctuationPredictionEnabled" />
          <n-text depth="3" style="font-size: 12px">仅 Paraformer</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="数字正则化">
        <n-space align="center">
          <n-switch v-model:value="asrParamsForm.inverseTextNormalizationEnabled" />
          <n-text depth="3" style="font-size: 12px">ITN，仅 Paraformer</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="噪音阈值">
        <n-space align="center">
          <n-input-number
            v-model:value="asrParamsForm.speechNoiseThreshold"
            :min="-1"
            :max="1"
            :step="0.1"
            clearable
            placeholder="默认 0"
            style="width: 180px"
          />
          <n-text depth="3" style="font-size: 12px">仅 Fun-ASR</n-text>
        </n-space>
      </n-form-item>
      <n-form-item label="热词 ID">
        <n-input v-model:value="asrParamsForm.vocabularyId" clearable placeholder="可选，热词列表 ID" />
      </n-form-item>
    </template>

    <n-space justify="end" style="margin-top: 16px">
      <n-button @click="emit('cancel')">取消</n-button>
      <n-button type="primary" :loading="saving" @click="submit">保存</n-button>
    </n-space>
  </n-form>
</template>

<script lang="ts" setup>
import type { FormInst, FormRules, SelectOption } from 'naive-ui'
import type { AiModelConfigResp, AiModelConfigUpdateReq, AiModelInfo } from '@/api/ai'
import { aiApi } from '@/api/ai'
import { ossApi } from '@/api/oss'

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

const fetchedModels = ref<AiModelInfo[]>([])
const fetchingModels = ref(false)
const filterTypes = ref<number[]>([1, 2, 3, 4, 5, 6])

const typeOptions = [
  { label: 'TEXT（文本对话）', value: 1 },
  { label: 'VISION（视觉理解）', value: 2 },
  { label: 'TTS（语音合成）', value: 3 },
  { label: 'STT（离线语音识别）', value: 4 },
  { label: 'IMAGE_GEN（图片生成）', value: 5 },
  { label: 'ASR（实时语音识别）', value: 6 }
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
  enableThinking: 0,
  thinkingBudget: null,
  enableCodeInterpreter: 0,
  enableSearch: 0,
  searchStrategy: null,
  enableSource: 0,
  voice: '',
  speed: null,
  responseFormat: null,
  language: '',
  status: 1,
  remark: '',
  asrParams: null,
  sttParams: null,
  ossConfigKey: null,
  ossBucketName: null
})

const form = ref(getDefaultForm())

/** ASR 默认参数编辑态（提交时序列化为 form.asrParams JSON 字符串） */
interface AsrParamsForm {
  semanticPunctuationEnabled: boolean
  maxSentenceSilence: number | null
  multiThresholdModeEnabled: boolean
  disfluencyRemovalEnabled: boolean
  punctuationPredictionEnabled: boolean
  inverseTextNormalizationEnabled: boolean
  speechNoiseThreshold: number | null
  vocabularyId: string
}

const getDefaultAsrParams = (): AsrParamsForm => ({
  semanticPunctuationEnabled: false,
  maxSentenceSilence: null,
  multiThresholdModeEnabled: false,
  disfluencyRemovalEnabled: false,
  punctuationPredictionEnabled: true,
  inverseTextNormalizationEnabled: true,
  speechNoiseThreshold: null,
  vocabularyId: ''
})

const asrParamsForm = ref<AsrParamsForm>(getDefaultAsrParams())

/** STT 默认参数编辑态（提交时序列化为 form.sttParams JSON 字符串；语种沿用上方"语言"字段） */
interface SttParamsForm {
  enableItn: boolean
  enableWords: boolean
  diarizationEnabled: boolean
  speakerCount: number | null
  disfluencyRemovalEnabled: boolean
  timestampAlignmentEnabled: boolean
  vocabularyId: string
}

const getDefaultSttParams = (): SttParamsForm => ({
  enableItn: false,
  enableWords: false,
  diarizationEnabled: false,
  speakerCount: null,
  disfluencyRemovalEnabled: false,
  timestampAlignmentEnabled: false,
  vocabularyId: ''
})

const sttParamsForm = ref<SttParamsForm>(getDefaultSttParams())

// ——— STT 专用：OSS 存储联动（音频文件需先上传至 OSS） ———
const ossConfigOptions = ref<SelectOption[]>([])
const ossBucketOptions = ref<SelectOption[]>([])
const loadingBuckets = ref(false)

/** 加载存储配置下拉 */
async function loadOssConfigs() {
  try {
    const res = await ossApi.configSelect()
    ossConfigOptions.value = (res.data?.data?.options ?? []).map((o) => ({ label: o.label, value: o.value }))
  } catch {
    ossConfigOptions.value = []
  }
}

/** 按所选存储配置加载其存储空间（Bucket）下拉 */
async function loadOssBuckets(configKey: string) {
  if (!configKey) {
    ossBucketOptions.value = []
    return
  }
  loadingBuckets.value = true
  try {
    const res = await ossApi.bucketList({ configKey, pageSize: 200, pageNum: 1 })
    ossBucketOptions.value = (res.data?.data?.buckets ?? []).map((b) => ({ label: b.name, value: b.name }))
  } catch {
    ossBucketOptions.value = []
  } finally {
    loadingBuckets.value = false
  }
}

/** 切换存储配置：重载 Bucket 列表，并清空已选 Bucket（除非回填阶段） */
function onOssConfigChange(key: string) {
  form.value.ossConfigKey = key
  form.value.ossBucketName = null
  ossBucketOptions.value = []
  loadOssBuckets(key)
}

// 初始化存储配置下拉（STT 类型用）
loadOssConfigs()

const statusSwitch = computed({
  get: () => form.value.status === 1,
  set: (v) => (form.value.status = v ? 1 : 0)
})
const thinkingSwitch = computed({
  get: () => form.value.enableThinking === 1,
  set: (v) => {
    form.value.enableThinking = v ? 1 : 0
    if (!v) {
      form.value.thinkingBudget = null
      // 代码解释器依赖思考模式，关闭思考时一并关闭
      form.value.enableCodeInterpreter = 0
    }
  }
})
const codeInterpreterSwitch = computed({
  get: () => form.value.enableCodeInterpreter === 1,
  set: (v) => (form.value.enableCodeInterpreter = v ? 1 : 0)
})
const searchSwitch = computed({
  get: () => form.value.enableSearch === 1,
  set: (v) => {
    form.value.enableSearch = v ? 1 : 0
    if (!v) {
      form.value.searchStrategy = null
      form.value.enableSource = 0
    }
  }
})
const sourceSwitch = computed({
  get: () => form.value.enableSource === 1,
  set: (v) => (form.value.enableSource = v ? 1 : 0)
})

const searchStrategyOptions = [
  { label: 'auto（模型自主判断）', value: 'auto' },
  { label: 'standard（标准搜索）', value: 'standard' },
  { label: 'max（高性能搜索）', value: 'max' },
  { label: 'agent（深度研究）', value: 'agent' }
]

const isText = computed(() => form.value.type === 1)
const isTextOrVision = computed(() => form.value.type === 1 || form.value.type === 2)
const isTts = computed(() => form.value.type === 3)
const isStt = computed(() => form.value.type === 4)
const isAsr = computed(() => form.value.type === 6)

const canFetchModels = computed(() => {
  // 编辑模式：只需要 baseUrl（假设后端已有 API Key）
  if (props.editId) {
    return !!form.value.baseUrl?.trim()
  }
  // 新增模式：需要 baseUrl 和 apiKey
  return !!(form.value.baseUrl?.trim() && form.value.apiKey?.trim())
})

const modelOptions = computed<SelectOption[]>(() => {
  const filtered = fetchedModels.value.filter((m: AiModelInfo) => filterTypes.value.includes(m.type))
  return filtered.map((m: AiModelInfo) => ({
    label: `${m.name} (${typeOptions.find((t) => t.value === m.type)?.label})`,
    value: m.name
  }))
})

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
        enableThinking: data.enableThinking ?? 0,
        thinkingBudget: data.thinkingBudget ?? null,
        enableCodeInterpreter: data.enableCodeInterpreter ?? 0,
        enableSearch: data.enableSearch ?? 0,
        searchStrategy: data.searchStrategy ?? null,
        enableSource: data.enableSource ?? 0,
        voice: data.voice ?? '',
        speed: data.speed ?? null,
        responseFormat: data.responseFormat ?? null,
        language: data.language ?? '',
        status: data.status ?? 1,
        remark: data.remark ?? '',
        ossConfigKey: data.ossConfigKey ?? null,
        ossBucketName: data.ossBucketName ?? null
      })
      // STT 存储联动：编辑态若已选配置，加载其 Bucket 列表以供下拉展示
      if (data.ossConfigKey) {
        loadOssBuckets(data.ossConfigKey)
      }
      // ASR 默认参数：从 asrParams JSON 反序列化（非法/空 → 默认）
      asrParamsForm.value = getDefaultAsrParams()
      if (data.asrParams) {
        try {
          Object.assign(asrParamsForm.value, JSON.parse(data.asrParams))
        } catch {
          /* 非法 JSON 用默认 */
        }
      }
      // STT 默认参数：从 sttParams JSON 反序列化（非法/空 → 默认）
      sttParamsForm.value = getDefaultSttParams()
      if (data.sttParams) {
        try {
          Object.assign(sttParamsForm.value, JSON.parse(data.sttParams))
        } catch {
          /* 非法 JSON 用默认 */
        }
      }
    } else {
      form.value = getDefaultForm()
      asrParamsForm.value = getDefaultAsrParams()
      sttParamsForm.value = getDefaultSttParams()
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

async function fetchModels() {
  if (!canFetchModels.value) {
    if (props.editId) {
      message.warning('请先填写 Base URL')
    } else {
      message.warning('请先填写 Base URL 和 API Key')
    }
    return
  }

  // 编辑模式且 API Key 为空时，使用占位符（后端会使用已存储的 API Key）
  const apiKey = form.value.apiKey || (props.editId ? '__USE_EXISTING__' : '')

  if (!apiKey) {
    message.warning('请填写 API Key')
    return
  }

  fetchingModels.value = true
  try {
    const res = await aiApi.fetchModels({
      baseUrl: form.value.baseUrl,
      apiKey: apiKey,
      configId: props.editId || undefined
    })

    if (res.data?.code === 200 && res.data.data) {
      fetchedModels.value = res.data.data
      message.success(`成功获取 ${fetchedModels.value.length} 个模型`)
    } else {
      message.error(res.data?.msg ?? '获取模型列表失败')
    }
  } catch {
    message.error('获取模型列表失败')
  } finally {
    fetchingModels.value = false
  }
}

async function submit() {
  try {
    await formRef.value!.validate()
  } catch {
    return
  }

  // 按类型序列化默认参数；其他类型清空
  if (form.value.type === 6) {
    const a = asrParamsForm.value
    const asrPayload: Record<string, unknown> = {
      semanticPunctuationEnabled: a.semanticPunctuationEnabled,
      multiThresholdModeEnabled: a.multiThresholdModeEnabled,
      disfluencyRemovalEnabled: a.disfluencyRemovalEnabled,
      punctuationPredictionEnabled: a.punctuationPredictionEnabled,
      inverseTextNormalizationEnabled: a.inverseTextNormalizationEnabled
    }
    if (a.maxSentenceSilence !== null) asrPayload.maxSentenceSilence = a.maxSentenceSilence
    if (a.speechNoiseThreshold !== null) asrPayload.speechNoiseThreshold = a.speechNoiseThreshold
    if (a.vocabularyId.trim()) asrPayload.vocabularyId = a.vocabularyId.trim()
    form.value.asrParams = JSON.stringify(asrPayload)
    form.value.sttParams = null
  } else if (form.value.type === 4) {
    const s = sttParamsForm.value
    const sttPayload: Record<string, unknown> = {
      enableItn: s.enableItn,
      enableWords: s.enableWords,
      diarizationEnabled: s.diarizationEnabled,
      disfluencyRemovalEnabled: s.disfluencyRemovalEnabled,
      timestampAlignmentEnabled: s.timestampAlignmentEnabled
    }
    if (s.speakerCount !== null) sttPayload.speakerCount = s.speakerCount
    if (s.vocabularyId.trim()) sttPayload.vocabularyId = s.vocabularyId.trim()
    form.value.sttParams = JSON.stringify(sttPayload)
    form.value.asrParams = null
  } else {
    form.value.asrParams = null
    form.value.sttParams = null
  }

  saving.value = true
  try {
    const payload: AiModelConfigUpdateReq = { ...form.value }

    // 过滤空的 API Key（编辑时可选）
    if (!payload.apiKey) delete payload.apiKey

    // 过滤占位符（防止占位符被保存到数据库）
    if (payload.apiKey === '__USE_EXISTING__') delete payload.apiKey

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
