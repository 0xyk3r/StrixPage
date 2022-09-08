<template>
  <n-el tag="div" class="strix-block" :class="[{ 'hover': hovering }]" @mouseenter="hovering = true"
    @mouseleave="hovering = false">
    <div class="source">
      <slot name="show"></slot>
    </div>
    <div ref="meta" class="meta">
      <div v-if="$slots.default" class="description">
        <slot></slot>
      </div>
    </div>
    <div ref="control" class="strix-block-control" :class="{ 'is-fixed': fixedControl }" @click="changeExpand">
      <component v-if="$slots.default" :is="expandedIcon"></component>
      <transition name="text-slide">
        <span v-if="$slots.default" v-show="hovering">{{ isExpanded ? '收起' : '显示全部' }}</span>
      </transition>
      <!-- 左侧按钮 -->
      <div class="control-button-container control-button-container-left">
        <n-button v-if="showClearButton" :tertiary="isSmallWindow" :quaternary="!isSmallWindow" type="error"
          @click.stop="$emit('clear-search')">
          <span>{{ isSmallWindow ? '清除' : '清除搜索条件' }}</span>
        </n-button>
      </div>
      <!-- 右侧按钮 -->
      <div class="control-button-container">
      </div>
    </div>
  </n-el>
</template>
<script setup>
import { defineProps, h, useSlots, ref, computed, watch, onBeforeUnmount, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useGlobalSettingsStore } from '@/stores/global-settings'
import useCurrentInstance from '@/utils/strix-instance-tool'
import { NButton } from 'naive-ui'
import elementResizeDetectorMaker from 'element-resize-detector'

const { proxy } = useCurrentInstance()
const globalSettingsStore = useGlobalSettingsStore()
const isSmallWindow = computed(() => globalSettingsStore.isSmallWindow)

defineProps({
  showClearButton: {
    type: Boolean,
    default: false
  }
})
defineEmits(['clear-search'])

const hovering = ref(false)
const isExpanded = ref(false)
const fixedControl = ref(false)
let scrollParent = null

const expandedIcon = computed(() => isExpanded.value ?
  h(Icon, { icon: 'ion:caret-up', inline: true }) :
  h(Icon, { icon: 'ion:caret-down', inline: true })
)
const codeArea = computed(() => proxy.$el.getElementsByClassName('meta')[0])

// 监听description高度变化以应对响应式栅格
const descriptionHeight = ref(0)
let erd = null
onMounted(() => {
  erd = elementResizeDetectorMaker({ strategy: "scroll" })
  if (proxy.$el.getElementsByClassName('description')[0]) {
    erd.listenTo(proxy.$el.getElementsByClassName('description')[0], (element) => {
      descriptionHeight.value = element.offsetHeight
    })
  }
})
onBeforeUnmount(() => {
  if (proxy.$el.getElementsByClassName('description')[0]) {
    erd.uninstall(proxy.$el.getElementsByClassName('description')[0])
  }
})

watch([isExpanded, descriptionHeight], (val) => {
  setCodeAreaHeight()
  if (!val) {
    fixedControl.value = false
    proxy.$refs.control.style.left = '0'
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
onBeforeUnmount(() => { removeScrollHandler })

const $slots = useSlots()
const changeExpand = () => {
  if ($slots.default) {
    isExpanded.value = !isExpanded.value
  }
}
const getCodeAreaHeight = () => {
  if (proxy.$el.getElementsByClassName('description').length > 0) {
    return proxy.$el.getElementsByClassName('description')[0].clientHeight + 20
  }
  return 0
}
const setCodeAreaHeight = () => {
  codeArea.value.style.height = isExpanded.value ? `${getCodeAreaHeight() + 1}px` : '0'
}
const scrollHandler = () => {
  const { top, bottom, left } = proxy.$refs.meta.getBoundingClientRect()
  const controlBarHeight = 44
  fixedControl.value = bottom + controlBarHeight > document.documentElement.clientHeight &&
    top <= document.documentElement.clientHeight
  proxy.$refs.control.style.left = fixedControl.value ? `${left}px` : '0'
}
const removeScrollHandler = () => {
  if (scrollParent) {
    scrollParent.removeEventListener('scroll', this.scrollHandler)
  }
}
</script>
<style lang="scss" scoped>
.strix-block {
  background-color: var(--card-color);
  border: solid 1px var(--border-color);
  border-radius: 3px;
  transition: all .3s cubic-bezier(.4, 0, .2, 1);

  &.hover {
    box-shadow: 0 -1px 4px 0 var(--border-color), 0 2px 4px 0 var(--border-color);

    .strix-block-control .iconify {
      transform: translateX(-40px);
    }
  }

  .source {
    padding: 24px;
  }

  .meta {
    background-color: var(--card-color);
    border-top: solid 1px var(--border-color);
    overflow: hidden;
    height: 0;
    transition: all .3s cubic-bezier(.4, 0, .2, 1);
  }

  .description {
    padding: 10px;
    box-sizing: border-box;
    font-size: 14px;
    line-height: 22px;
    color: var(--text-color-3);
    word-break: break-word;
    margin: 10px;
    background-color: var(--card-color);
    transition: all .3s cubic-bezier(.4, 0, .2, 1);

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
    transition: all .3s cubic-bezier(.4, 0, .2, 1);

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
      transition: all .3s cubic-bezier(.4, 0, .2, 1);
    }

    >span {
      position: absolute;
      transform: translateX(-30px);
      font-size: 14px;
      line-height: 44px;
      transition: all .3s cubic-bezier(.4, 0, .2, 1);
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
