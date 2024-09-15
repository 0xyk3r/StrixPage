<template>
  <n-el
    tag="div"
    class="strix-block"
    :class="[{ hover: hovering }]"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <div class="strix-block-body">
      <slot name="body" />
    </div>
    <div v-show="cleanable || $slots.default" class="strix-block-more">
      <div v-if="$slots.default" class="strix-block-more-body">
        <slot />
      </div>
    </div>
    <div
      v-show="cleanable || $slots.default"
      class="strix-block-control"
      :class="{ 'is-fixed': fixedControl }"
      @click="switchExpand"
    >
      <Icon v-if="$slots.default" :icon="isExpanded ? 'ion:caret-up' : 'ion:caret-down'" inline />
      <transition name="text-slide">
        <span v-if="$slots.default" v-show="hovering">{{ isExpanded ? '收起' : '显示全部' }}</span>
      </transition>
      <!-- 左侧按钮 -->
      <div class="control-button-container left">
        <n-button
          v-if="cleanable"
          :tertiary="isSmallWindow"
          :quaternary="!isSmallWindow"
          type="error"
          @click.stop="$emit('clear')"
        >
          {{ isSmallWindow ? '清除' : '清除搜索条件' }}
        </n-button>
      </div>
      <!-- 右侧按钮 -->
      <div class="control-button-container right" />
    </div>
  </n-el>
</template>
<script setup lang="ts">
import { useStrixSettingsStore } from '@/stores/strix-settings'
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'

defineProps({
  cleanable: { type: Boolean, default: false }
})
defineEmits(['clear'])
const slots = useSlots()

const { proxy } = getCurrentInstance() as any
const globalSettingsStore = useStrixSettingsStore()
const { isSmallWindow } = storeToRefs(globalSettingsStore)

const moreElement = () => proxy.$el.querySelector('.strix-block-more')
const moreBodyElement = () => proxy.$el.querySelector('.strix-block-more-body')

const hovering = ref(false)
const fixedControl = ref(true)
// 是否展开
const isExpanded = ref(false)
const switchExpand = () => {
  if (slots.default) {
    isExpanded.value = !isExpanded.value
  }
}
watch(isExpanded, (val) => {
  const newMoreBodyHeight = moreBodyElement()?.clientHeight + 20 || 0
  moreElement().style.height = val ? `${newMoreBodyHeight + 1}px` : '0'
  fixedControl.value = val
})
</script>
<style lang="scss" scoped>
.strix-block {
  background-color: var(--card-color);
  border: solid 1px var(--border-color);
  border-radius: var(--border-radius);
  transition: all 0.3s var(--n-bezier);

  &.hover {
    box-shadow: var(--box-shadow-1);

    .strix-block-control .iconify {
      transform: translateX(-40px);
    }
  }

  .strix-block-body {
    padding: 20px;
  }

  .strix-block-more {
    height: 0;
    overflow: hidden;
    background-color: var(--card-color);
    border-top: solid 1px var(--border-color);
    transition: all 0.3s var(--n-bezier);

    .strix-block-more-body {
      margin: 10px;
      padding: 10px;
      box-sizing: border-box;
      word-break: break-word;
      color: var(--text-color-3);
      font-size: var(--font-size);
      line-height: var(--line-height);
      background-color: var(--card-color);
      transition: all 0.3s var(--n-bezier);
    }
  }

  .strix-block-control {
    height: 44px;
    margin-top: -1px;
    text-align: center;
    color: var(--text-color-3);
    background-color: var(--card-color);
    border-bottom-left-radius: var(--border-radius);
    border-bottom-right-radius: var(--border-radius);
    border-top: solid 1px var(--border-color);
    cursor: pointer;
    position: relative;
    box-sizing: border-box;
    transition: all 0.3s var(--n-bezier);

    &:hover:not(:has(.control-button-container:hover)) {
      color: var(--primary-color);
      background-color: var(--tag-color);
    }

    &.is-fixed {
      position: sticky;
      bottom: 0;
    }

    .iconify {
      height: 100%;
      transition: all 0.3s var(--n-bezier);
    }

    > span {
      position: absolute;
      line-height: 44px;
      display: inline-block;
      transform: translateX(-30px);
      transition: all 0.3s var(--n-bezier);
    }

    & .text-slide-enter-from,
    & .text-slide-leave-to {
      opacity: 0;
      transform: translateX(-15px);
    }

    .control-button-container {
      position: absolute;
      top: 0;
      right: 0;
      line-height: 40px;
      padding-left: 5px;
      padding-right: 5px;

      &.left {
        left: 0;
        width: 80px;
        padding-left: 5px;
      }

      &.right {
        right: 0;
        width: 80px;
        padding-right: 5px;
      }
    }
  }
}
</style>
