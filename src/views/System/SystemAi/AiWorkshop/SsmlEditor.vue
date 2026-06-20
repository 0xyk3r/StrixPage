<template>
  <div class="ssml-editor">
    <!-- 工具栏：可视化标记按钮（浮层填参）+ 源码切换 -->
    <div class="ssml-editor__toolbar">
      <div class="ssml-editor__tools" :class="{ 'ssml-editor__tools--disabled': sourceMode }">
        <!-- 停顿 -->
        <n-popover v-model:show="showBreak" trigger="click" placement="bottom-start" :disabled="sourceMode">
          <template #trigger>
            <button type="button" class="ssml-chip" :disabled="sourceMode" @mousedown="captureSelection">
              <Clock :size="13" />
              <span>停顿</span>
            </button>
          </template>
          <div class="ssml-form">
            <span class="ssml-form__title">插入停顿</span>
            <n-input-group>
              <n-input-number v-model:value="breakValue" :min="10" :max="10000" :step="50" style="width: 130px" />
              <n-select v-model:value="breakUnit" :options="breakUnitOptions" style="width: 76px" />
            </n-input-group>
            <n-button size="small" type="primary" block @click="applyBreak">插入</n-button>
          </div>
        </n-popover>

        <!-- 读音 -->
        <n-popover v-model:show="showPhoneme" trigger="click" placement="bottom-start" :disabled="sourceMode">
          <template #trigger>
            <button type="button" class="ssml-chip" :disabled="sourceMode" @mousedown="captureSelection">
              <Volume2 :size="13" />
              <span>读音</span>
            </button>
          </template>
          <div class="ssml-form">
            <span class="ssml-form__title">指定读音（多音字 / 外文）</span>
            <n-radio-group v-model:value="phonemeAlphabet" size="small">
              <n-radio-button value="py">拼音</n-radio-button>
              <n-radio-button value="cmu">音标</n-radio-button>
            </n-radio-group>
            <n-input v-model:value="phonemeText" placeholder="要标注的文字" />
            <n-input
              v-model:value="phonemePh"
              :placeholder="phonemeAlphabet === 'py' ? '拼音含声调，如 dang4 diao4（空格分隔）' : '音标，如 S AY N'"
            />
            <n-button size="small" type="primary" block :disabled="!phonemePh.trim()" @click="applyPhoneme">插入
            </n-button>
          </div>
        </n-popover>

        <!-- 替换 -->
        <n-popover v-model:show="showSub" trigger="click" placement="bottom-start" :disabled="sourceMode">
          <template #trigger>
            <button type="button" class="ssml-chip" :disabled="sourceMode" @mousedown="captureSelection">
              <Replace :size="13" />
              <span>替换</span>
            </button>
          </template>
          <div class="ssml-form">
            <span class="ssml-form__title">替换朗读内容</span>
            <n-input v-model:value="subText" placeholder="原文本（显示）" />
            <n-input v-model:value="subAlias" placeholder="实际朗读为" />
            <n-button size="small" type="primary" block :disabled="!subAlias.trim()" @click="applySub">插入</n-button>
          </div>
        </n-popover>

        <!-- 数字读法 -->
        <n-popover v-model:show="showSayAs" trigger="click" placement="bottom-start" :disabled="sourceMode">
          <template #trigger>
            <button type="button" class="ssml-chip" :disabled="sourceMode" @mousedown="captureSelection">
              <Hash :size="13" />
              <span>数字读法</span>
            </button>
          </template>
          <div class="ssml-form">
            <span class="ssml-form__title">指定数字 / 符号读法</span>
            <n-select v-model:value="sayAsType" :options="sayAsOptions" />
            <n-input v-model:value="sayAsText" placeholder="要朗读的内容，如 13800138000" />
            <n-button size="small" type="primary" block :disabled="!sayAsText.trim()" @click="applySayAs">插入
            </n-button>
          </div>
        </n-popover>
      </div>

      <div class="ssml-editor__modes">
        <button
          type="button"
          class="ssml-mode"
          :class="{ 'ssml-mode--on': sourceMode }"
          :title="sourceMode ? '切换到可视化编辑' : '查看 / 编辑 SSML 源码'"
          @click="toggleSource"
        >
          <Code :size="13" /><span>{{ sourceMode ? '可视化' : '源码' }}</span>
        </button>
      </div>
    </div>

    <!-- 可视化模式：编辑 speak 内部内容；源码模式：编辑完整 SSML -->
    <textarea
      v-if="!sourceMode"
      ref="taRef"
      class="ssml-editor__area"
      :rows="rows"
      :placeholder="placeholder"
      :value="inner"
      @input="onInnerInput"
    />
    <textarea
      v-else
      class="ssml-editor__area ssml-editor__area--source"
      :rows="rows"
      spellcheck="false"
      :value="modelValue"
      @input="onSourceInput"
    />

    <n-text depth="3" class="ssml-editor__note">
      {{ sourceMode ? '源码模式：直接编辑完整 SSML，外层
      <speak> 必不可少' : '在文本中选中片段后点击工具按钮，可对选中内容应用标记' }}
    </n-text>
  </div>
</template>

<script lang="ts" setup>
import { Clock, Code, Hash, Replace, Volume2 } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ modelValue: string; rows?: number; placeholder?: string }>(), {
  rows: 6,
  placeholder: '请输入要合成的文本，可对选中片段插入停顿、读音等标记'
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const taRef = ref<HTMLTextAreaElement | null>(null)
const sourceMode = ref(false)

// 各浮层显隐（插入后置 false 自动关闭）
const showBreak = ref(false)
const showPhoneme = ref(false)
const showSub = ref(false)
const showSayAs = ref(false)

// —— speak 包裹解析：v-model 始终是完整 SSML，可视化区只编辑 speak 内部 ——
const SPEAK_RE = /^\s*<speak(\s[^>]*)?>([\s\S]*)<\/speak>\s*$/i

/** 从完整 SSML 取出 speak 内部内容 */
const inner = computed(() => {
  const m = props.modelValue.match(SPEAK_RE)
  return m ? m[2]! : props.modelValue
})

/** 用新的内部内容重新包裹为完整 SSML */
function wrap(innerText: string): string {
  return `<speak>${innerText}</speak>`
}

function onInnerInput(e: Event) {
  emit('update:modelValue', wrap((e.target as HTMLTextAreaElement).value))
}

function onSourceInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}

function toggleSource() {
  sourceMode.value = !sourceMode.value
}

// —— 选区捕获：浮层弹出会夺焦，需在 mousedown（点击前）记录 textarea 选区 ——
const sel = reactive({ start: 0, end: 0 })
const selectionText = ref('')

function captureSelection() {
  const ta = taRef.value
  if (!ta) return
  sel.start = ta.selectionStart
  sel.end = ta.selectionEnd
  selectionText.value = inner.value.slice(sel.start, sel.end)
  // 选中文本预填到各表单输入，便于直接确认插入
  phonemeText.value = selectionText.value
  subText.value = selectionText.value
  sayAsText.value = selectionText.value
  // 读音的拼音/音标无法从选区推断，清空待填
  phonemePh.value = ''
  subAlias.value = ''
}

/**
 * 用 fragment 替换捕获的选区（无选区则在光标处插入），插入后聚焦并把光标置于片段之后。
 */
function replaceSelection(fragment: string) {
  const src = inner.value
  const next = src.slice(0, sel.start) + fragment + src.slice(sel.end)
  emit('update:modelValue', wrap(next))
  nextTick(() => {
    const ta = taRef.value
    if (ta) {
      const pos = sel.start + fragment.length
      ta.focus()
      ta.setSelectionRange(pos, pos)
    }
  })
}

// —— 停顿（自闭合，始终插入在光标处） ——
const breakValue = ref(500)
const breakUnit = ref('ms')
const breakUnitOptions = [
  { label: 'ms', value: 'ms' },
  { label: 's', value: 's' }
]

function applyBreak() {
  replaceSelection(`<break time="${breakValue.value}${breakUnit.value}"/>`)
  showBreak.value = false
}

// —— 读音 ——
const phonemeAlphabet = ref<'py' | 'cmu'>('py')
const phonemeText = ref('')
const phonemePh = ref('')

function applyPhoneme() {
  const content = phonemeText.value.trim() || phonemePh.value.trim()
  replaceSelection(`<phoneme alphabet="${phonemeAlphabet.value}" ph="${phonemePh.value.trim()}">${content}</phoneme>`)
  showPhoneme.value = false
}

// —— 替换 ——
const subText = ref('')
const subAlias = ref('')

function applySub() {
  const content = subText.value.trim() || subAlias.value.trim()
  replaceSelection(`<sub alias="${subAlias.value.trim()}">${content}</sub>`)
  showSub.value = false
}

// —— 数字读法 ——
const sayAsType = ref('digits')
const sayAsText = ref('')
const sayAsOptions = [
  { label: '逐位数字（digits）', value: 'digits' },
  { label: '电话号码（telephone）', value: 'telephone' },
  { label: '整数 / 小数（cardinal）', value: 'cardinal' },
  { label: '日期（date）', value: 'date' },
  { label: '时间（time）', value: 'time' },
  { label: '货币（currency）', value: 'currency' },
  { label: '计量单位（measure）', value: 'measure' }
]

function applySayAs() {
  replaceSelection(`<say-as interpret-as="${sayAsType.value}">${sayAsText.value.trim()}</say-as>`)
  showSayAs.value = false
}
</script>

<style lang="scss" scoped>
.ssml-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__tools {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    &--disabled {
      opacity: 0.45;
    }
  }

  &__area {
    width: 100%;
    resize: vertical;
    min-height: 132px;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--strix-text-primary);
    background: var(--strix-bg-surface);
    border: 1px solid var(--strix-border-default);
    outline: none;
    transition: border-color 0.2s ease;
    font-family: inherit;

    &:focus {
      border-color: var(--strix-border-accent-hover);
    }

    &--source {
      font-family: 'SF Mono', 'Consolas', monospace;
      font-size: 13px;
    }
  }

  &__note {
    font-size: 12px;
    line-height: 1.5;
  }
}

.ssml-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 7px;
  font-size: 12px;
  cursor: pointer;
  color: var(--strix-text-secondary);
  background: transparent;
  border: 1px solid var(--strix-border-default);
  transition: color 0.18s ease,
  border-color 0.18s ease;

  &:hover:not(:disabled) {
    color: var(--strix-text-accent);
    border-color: var(--strix-border-accent-hover);
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.ssml-mode {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 7px;
  font-size: 12px;
  cursor: pointer;
  color: var(--strix-text-tertiary);
  background: transparent;
  border: 1px dashed var(--strix-border-default);
  transition: color 0.18s ease,
  border-color 0.18s ease;

  &:hover {
    color: var(--strix-text-accent);
    border-color: var(--strix-border-accent-hover);
  }

  &--on {
    color: var(--strix-text-accent);
    border-style: solid;
    border-color: var(--strix-border-accent-hover);
  }
}

.ssml-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 248px;
  padding: 4px;

  &__title {
    font-size: 13px;
    color: var(--strix-text-primary);
  }
}
</style>
