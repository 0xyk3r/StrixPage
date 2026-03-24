<template>
  <Teleport to="body">
    <Transition name="nebula-captcha">
      <div v-if="visible" class="nebula-captcha-overlay" @click.self="close">
        <div class="nebula-captcha-modal">
          <div class="nebula-captcha__frame">
            <!-- 扫描线 -->
            <div class="nebula-captcha__scan" />

            <div class="nebula-captcha__head">
              <span class="nebula-captcha__panel-id">PANEL::CAPTCHA-02</span>
              <div style="display: flex; align-items: center; gap: 12px">
                <span class="nebula-captcha__panel-status">
                  <span class="nebula-captcha__status-dot" />
                  VERIFY
                </span>
                <button class="nebula-captcha__close" aria-label="关闭" @click="close">
                  <StrixIcon icon="x" :size="14" />
                </button>
              </div>
            </div>
            <div class="nebula-captcha__body">
              <CaptchaPuzzle ref="puzzleRef" @success="handleSuccess" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import StrixIcon from '@/components/icon/StrixIcon.vue'
import CaptchaPuzzle from '@/components/captcha/components/CaptchaPuzzle.vue'

const emit = defineEmits<{
  success: [payload: { captchaVerification: string }]
}>()

const puzzleRef = ref<InstanceType<typeof CaptchaPuzzle> | null>(null)
const visible = ref(false)

const show = () => {
  visible.value = true
  nextTick(() => puzzleRef.value?.refresh())
}

const close = () => {
  visible.value = false
}

const handleSuccess = (payload: { captchaVerification: string }) => {
  close()
  emit('success', payload)
}

defineExpose({ show, close })
</script>
