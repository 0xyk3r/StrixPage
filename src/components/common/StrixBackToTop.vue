<template>
  <Transition name="nebula-fab">
    <div v-if="visible" class="nebula-fab" @click="scrollToTop" title="回到顶部">
      <svg class="nebula-fab__ring" viewBox="0 0 48 48">
        <circle class="nebula-fab__track" cx="24" cy="24" r="21" />
        <circle
          class="nebula-fab__progress"
          cx="24"
          cy="24"
          r="21"
          :stroke-dashoffset="circumference * (1 - progress)"
        />
      </svg>
      <div class="nebula-fab__btn">
        <StrixIcon icon="chevron-up" :size="18" />
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { useScrollProgress } from '@/composables/useScrollProgress'
import StrixIcon from '@/components/icon/StrixIcon.vue'

const circumference = 2 * Math.PI * 21

const { progress, visible, scrollToTop } = useScrollProgress('.nebula-main')
</script>
