<template>
  <div class="thinking-block" :class="{ 'thinking-block--expanded': expanded }">
    <div class="thinking-block__header" @click="toggle">
      <span class="thinking-block__icon">
        <n-icon :size="14">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 5v5l3 3" />
          </svg>
        </n-icon>
      </span>
      <span class="thinking-block__label">
        {{ done ? '思考过程' : '正在思考...' }}
      </span>
      <n-icon class="thinking-block__chevron" :size="14">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </n-icon>
    </div>

    <transition name="thinking-fade">
      <div v-if="expanded" class="thinking-block__content">
        <div ref="textRef" class="thinking-block__text">{{ content }}</div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  content: string
  done: boolean
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const textRef = ref<HTMLDivElement | null>(null)

const expanded = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

function toggle() {
  expanded.value = !expanded.value
}

function scrollTextToBottom() {
  if (textRef.value) {
    textRef.value.scrollTop = textRef.value.scrollHeight
  }
}

// Scroll when content streams in (flush: 'post' guarantees DOM is updated first)
watch(() => props.content, scrollTextToBottom, { flush: 'post' })

// Scroll when user manually expands the block (e.g., historical thinking content)
watch(expanded, (v) => {
  if (v) nextTick().then(scrollTextToBottom)
})
</script>

<style lang="scss" scoped>
.thinking-block {
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
  background: rgba(99, 102, 241, 0.05);

  &__header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    cursor: pointer;
    user-select: none;
    font-size: 12px;
    color: rgba(99, 102, 241, 0.9);

    &:hover {
      background: rgba(99, 102, 241, 0.08);
    }
  }

  &__label {
    flex: 1;
    font-weight: 500;
  }

  &__chevron {
    transition: transform 0.2s ease;
  }

  &--expanded &__chevron {
    transform: rotate(180deg);
  }

  &__content {
    border-top: 1px solid rgba(99, 102, 241, 0.2);
  }

  &__text {
    padding: 12px 14px;
    font-size: 12px;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.55);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 300px;
    overflow-y: auto;
  }
}

.thinking-fade-enter-active,
.thinking-fade-leave-active {
  transition: all 0.2s ease;
  max-height: 320px;
  overflow: hidden;
}

.thinking-fade-enter-from,
.thinking-fade-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
