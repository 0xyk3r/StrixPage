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
    <div v-show="cleanable || $slots.default" ref="moreRef" class="strix-block-more">
      <div v-if="$slots.default" class="strix-block-more-body">
        <slot />
      </div>
    </div>
    <div
      v-show="cleanable || $slots.default"
      ref="controlRef"
      class="strix-block-control"
      :class="{ 'is-fixed': fixedControl }"
      @click="changeExpand"
    >
      <component :is="expandedIcon" v-if="$slots.default" />
      <transition name="text-slide">
        <span v-if="$slots.default" v-show="hovering">{{ isExpanded ? '收起' : '显示全部' }}</span>
      </transition>
      <!-- 左侧按钮 -->
      <div class="control-button-container control-button-container-left">
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
      <div class="control-button-container" />
    </div>
  </n-el>
</template>
<script setup lang="ts">
import { useStrixSettingsStore } from '@/stores/strix-settings'
import { Icon } from '@iconify/vue'
import elementResizeDetectorMaker from 'element-resize-detector'
import { NEl } from 'naive-ui'
import { storeToRefs } from 'pinia'
import {
  computed,
  getCurrentInstance,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  useSlots,
  watch
} from 'vue'

defineProps({
  cleanable: { type: Boolean, default: false }
})
defineEmits(['clear'])

const { proxy } = getCurrentInstance() as any
const globalSettingsStore = useStrixSettingsStore()
const { isSmallWindow } = storeToRefs(globalSettingsStore)

const moreRef = ref<any>(null)
const controlRef = ref<any>(null)

const hovering = ref(false)
const isExpanded = ref(false)
const fixedControl = ref(false)
let scrollParent: HTMLElement | null = null

const expandedIcon = computed(() =>
  isExpanded.value
    ? h(Icon, { icon: 'ion:caret-up', inline: true })
    : h(Icon, { icon: 'ion:caret-down', inline: true })
)
const codeArea = computed(() => proxy.$el.querySelector('.strix-block-more'))

// 监听description高度变化以应对响应式栅格
const descriptionHeight = ref(0)
const getMoreBodyElement = () => proxy.$el.querySelector('.strix-block-more-body')
let erd: elementResizeDetectorMaker.Erd | null = null
onMounted(() => {
  erd = elementResizeDetectorMaker({ strategy: 'scroll' })
  const moreBodyElement = getMoreBodyElement()
  if (moreBodyElement) {
    erd.listenTo(moreBodyElement, (element) => {
      descriptionHeight.value = element.offsetHeight
    })
  }
})
onBeforeUnmount(() => {
  const moreBodyElement = getMoreBodyElement()
  if (moreBodyElement) {
    erd?.uninstall(moreBodyElement)
  }
  removeScrollHandler()
})

watch([isExpanded, descriptionHeight], (val) => {
  setMoreBodyHeight()
  if (!val) {
    fixedControl.value = false
    if (controlRef.value) {
      controlRef.value.style.left = '0'
    }
    removeScrollHandler()
    return
  }
  setTimeout(() => {
    scrollParent = document.querySelector('.page-component__scroll > .el-scrollbar__wrap')
    if (scrollParent) {
      scrollParent.addEventListener('scroll', scrollHandler)
    }
    scrollHandler()
  }, 200)
})

const $slots = useSlots()
const changeExpand = () => {
  if ($slots.default) {
    isExpanded.value = !isExpanded.value
  }
}
const getMoreBodyHeight = () => {
  const moreBodyElement = getMoreBodyElement()
  return moreBodyElement ? moreBodyElement.clientHeight + 20 : 0
}
const setMoreBodyHeight = () => {
  if (codeArea.value) {
    codeArea.value.style.height = isExpanded.value ? `${getMoreBodyHeight() + 1}px` : '0'
  }
}
const scrollHandler = () => {
  const { top, bottom, left } = moreRef.value?.getBoundingClientRect() || {}
  const controlBarHeight = 44
  fixedControl.value =
    bottom + controlBarHeight > document.documentElement.clientHeight &&
    top <= document.documentElement.clientHeight
  if (controlRef.value) {
    controlRef.value.style.left = fixedControl.value ? `${left}px` : '0'
  }
}
const removeScrollHandler = () => {
  if (scrollParent) {
    scrollParent.removeEventListener('scroll', scrollHandler)
  }
}
</script>
<style lang="scss" scoped>
.strix-block {
  background-color: var(--card-color);
  border: solid 1px var(--border-color);
  border-radius: 3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.hover {
    box-shadow:
      0 -1px 4px 0 var(--border-color),
      0 2px 4px 0 var(--border-color);

    .strix-block-control .iconify {
      transform: translateX(-40px);
    }
  }

  .strix-block-body {
    padding: 24px;
  }

  .strix-block-more {
    background-color: var(--card-color);
    border-top: solid 1px var(--border-color);
    overflow: hidden;
    height: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .strix-block-more-body {
    padding: 10px;
    box-sizing: border-box;
    font-size: 14px;
    line-height: 22px;
    color: var(--text-color-3);
    word-break: break-word;
    margin: 10px;
    background-color: var(--card-color);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    p {
      margin: 0;
      line-height: 24px;
    }
  }

  .strix-block-control {
    border-top: solid 1px var(--border-color);
    height: 44px;
    box-sizing: border-box;
    background-color: var(--card-color);
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    text-align: center;
    margin-top: -1px;
    color: var(--text-color-3);
    cursor: pointer;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      color: var(--primary-color);
      background-color: var(--tag-color);
    }

    &.is-fixed {
      position: sticky;
      bottom: 0;
    }

    .iconify {
      font-size: 16px;
      height: 100%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    > span {
      position: absolute;
      transform: translateX(-30px);
      font-size: 14px;
      line-height: 44px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: inline-block;
    }

    & .text-slide-enter-from,
    & .text-slide-leave-to {
      opacity: 0;
      transform: translateX(-15px);
    }

    .control-button-container {
      line-height: 40px;
      position: absolute;
      top: 0;
      right: 0;
      padding-left: 5px;
      padding-right: 5px;
    }

    .control-button-container-left {
      left: 0;
      width: 80px;
      padding-left: 5px;
    }

    .control-button {
      font-size: 14px;
      margin: 0 10px;
    }
  }
}
</style>
