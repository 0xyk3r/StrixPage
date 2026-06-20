<template>
  <div class="workshop-image">
    <n-card title="图片生成 (Image Gen)" class="workshop-card">
      <n-form label-placement="left" label-width="80px">
        <n-form-item label="选择模型">
          <n-select
            v-model:value="configKey"
            :options="modelOptions"
            placeholder="选择图片生成模型"
            filterable
            style="max-width: 360px"
          />
        </n-form-item>
        <n-form-item label="提示词">
          <n-input
            v-model:value="prompt"
            type="textarea"
            :rows="4"
            clearable
            placeholder="描述要生成的图片内容（支持中文）"
            style="max-width: 640px"
          />
        </n-form-item>
        <n-form-item label="尺寸">
          <n-space vertical style="width: 100%">
            <n-select
              v-model:value="size"
              :options="sizeOptions"
              :disabled="useCustomSize"
              placeholder="选择预设尺寸"
              style="width: 240px"
            />
            <n-checkbox v-model:checked="useCustomSize" size="small">
              自定义尺寸（256-4096，建议 64 倍数）
            </n-checkbox>
            <n-space v-if="useCustomSize" align="center" style="margin-top: 4px">
              <n-input-number
                v-model:value="customWidth"
                :min="256"
                :max="4096"
                :step="64"
                placeholder="宽度"
                style="width: 140px"
              />
              <span style="color: rgba(255,255,255,0.3)">×</span>
              <n-input-number
                v-model:value="customHeight"
                :min="256"
                :max="4096"
                :step="64"
                placeholder="高度"
                style="width: 140px"
              />
            </n-space>
          </n-space>
        </n-form-item>
        <n-form-item label="参考图片">
          <n-input
            v-model:value="refImageUrl"
            clearable
            placeholder="参考图片 URL（可选）"
            style="max-width: 480px"
          />
        </n-form-item>
      </n-form>

      <n-space style="margin-top: 12px">
        <n-button type="primary" :loading="generating" :disabled="!configKey || !prompt.trim()" @click="generate">
          生成图片
        </n-button>
      </n-space>

      <!-- 结果 -->
      <div v-if="resultUrl" class="image-result">
        <p class="image-result__label">生成结果：</p>
        <img :src="resultUrl" class="image-result__img" alt="生成的图片" />
        <n-space>
          <n-button size="small" type="primary" ghost tag="a" :href="resultUrl" target="_blank" download>
            下载图片
          </n-button>
          <n-button size="small" ghost @click="copyUrl">复制链接</n-button>
        </n-space>
      </div>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import type { AiModelConfigResp } from '@/api/ai'
import { aiApi } from '@/api/ai'

interface Props {
  models: AiModelConfigResp[]
}

const props = defineProps<Props>()

const message = useMessage()
const configKey = ref<string | null>(null)
const prompt = ref('')
const size = ref('1024*1024')
const useCustomSize = ref(false)
const customWidth = ref(1024)
const customHeight = ref(1024)
const refImageUrl = ref('')
const generating = ref(false)
const resultUrl = ref('')

const sizeOptions = [
  { label: '1024×1024（推荐）', value: '1024*1024' },
  { label: '1280×720 (16:9)', value: '1280*720' },
  { label: '720×1280 (9:16)', value: '720*1280' },
  { label: '1024×768 (4:3)', value: '1024*768' },
  { label: '768×1024 (3:4)', value: '768*1024' },
  { label: '1920×1080 (FHD)', value: '1920*1080' },
  { label: '2048×2048', value: '2048*2048' },
  { label: '512×512（快速测试）', value: '512*512' }
]

const modelOptions = computed(() =>
  props.models
    .filter((m) => m.status === 1 && m.type === 5)
    .map((m) => ({ label: m.name, value: m.key }))
)

async function generate() {
  if (!configKey.value || !prompt.value.trim()) return

  // 使用自定义尺寸
  let finalSize = size.value
  if (useCustomSize.value) {
    if (!customWidth.value || !customHeight.value) {
      message.warning('请输入有效的自定义尺寸')
      return
    }
    if (customWidth.value < 256 || customWidth.value > 4096 || customHeight.value < 256 || customHeight.value > 4096) {
      message.warning('尺寸必须在 256-4096 之间')
      return
    }
    finalSize = `${customWidth.value}*${customHeight.value}`
  }

  generating.value = true
  resultUrl.value = ''
  try {
    const res = await aiApi.imageGenerate({
      configKey: configKey.value!,
      prompt: prompt.value,
      size: finalSize,
      imageUrls: refImageUrl.value ? [refImageUrl.value] : undefined
    })
    if (res.data?.code === 200) {
      resultUrl.value = res.data.data ?? ''
      message.success('生成成功')
    } else {
      message.error(res.data?.msg ?? '生成失败')
    }
  } catch (e: any) {
    message.error('生成失败：' + (e?.message ?? '未知错误'))
  } finally {
    generating.value = false
  }
}

async function copyUrl() {
  await navigator.clipboard.writeText(resultUrl.value)
  message.success('已复制')
}
</script>

<style lang="scss" scoped>
.image-result {
  margin-top: 20px;
  padding: 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__label {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
  }

  &__img {
    max-width: 512px;
    max-height: 512px;
    border-radius: 8px;
    object-fit: contain;
  }
}
</style>
