<template>
  <Transition name="modal-fade">
    <div v-if="showBox" :class="['verify-container', { 'verify-container--fixed': mode === 'fixed' }]">
      <div v-if="mode === 'pop'" class="verify-overlay" @click="close"></div>
      <div :class="['verify-modal', { 'verify-modal--pop': mode === 'pop' }]">
        <div class="verify-modal__header">
          <div class="verify-modal__title">
            <StrixIcon :size="24" class="verify-modal__icon" icon="shield" />
            <h3>安全验证</h3>
          </div>
          <button v-if="mode === 'pop'" aria-label="关闭" class="verify-modal__close" @click="close">
            <StrixIcon :size="20" icon="x" />
          </button>
        </div>
        <div class="verify-modal__content">
          <VerifySlide
            ref="instance"
            :bar-size="barSize"
            :block-size="blockSize"
            :explain="explain"
            :img-size="imgSize"
            :v-space="vSpace"
            @success="handleSuccess"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import VerifySlide from '@/components/verifition/components/VerifySlide.vue'

interface Props {
  mode?: 'pop' | 'fixed'
  vSpace?: number
  explain?: string
  imgSize?: {
    width: string
    height: string
  }
  blockSize?: {
    width: string
    height: string
  }
  barSize?: {
    width: string
    height: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'pop',
  vSpace: 5,
  explain: '向右滑动完成验证',
  imgSize: () => ({
    width: '400px',
    height: '200px'
  }),
  blockSize: () => ({
    width: '60px',
    height: '60px'
  }),
  barSize: () => ({
    width: '400px',
    height: '50px'
  })
})

const emit = defineEmits<{
  success: [payload: any]
}>()

const instance = ref<InstanceType<typeof VerifySlide> | null>(null)
const clickShow = ref(false)

const showBox = computed(() => {
  if (props.mode === 'pop') return clickShow.value
  return true
})

const handleSuccess = (payload: any) => {
  emit('success', payload)
}

const refresh = () => {
  instance.value?.refresh()
}

const close = () => {
  clickShow.value = false
}

const show = () => {
  if (props.mode === 'pop') {
    clickShow.value = true
  }
}

defineExpose({
  show,
  close,
  refresh
})
</script>

<style lang="scss" scoped>
.verify-container {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  &--fixed {
    position: relative;
    padding: 0;
  }
}

.verify-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
}

.verify-modal {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 24px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  max-width: 500px;
  width: 100%;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  &--pop {
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 28px;
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 12px;

    h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      background: linear-gradient(135deg, #1e293b, #475569);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  &__icon {
    color: #0ea5e9;
    flex-shrink: 0;
  }

  &__close {
    width: 36px;
    height: 36px;
    border: none;
    background: #f1f5f9;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:hover {
      background: #e2e8f0;
      color: #334155;
      transform: rotate(90deg);
    }

    &:active {
      transform: rotate(90deg) scale(0.95);
    }
  }

  &__content {
    padding: 28px;
    overflow: auto;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .verify-modal,
.modal-fade-leave-active .verify-modal {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from .verify-modal,
.modal-fade-leave-to .verify-modal {
  transform: translateY(20px) scale(0.95);
  opacity: 0;
}

@media (max-width: 640px) {
  .verify-container {
    padding: 16px;
  }

  .verify-modal {
    border-radius: 20px;

    &__header {
      padding: 20px 24px;
    }

    &__title h3 {
      font-size: 18px;
    }

    &__content {
      padding: 24px;
    }
  }
}
</style>
