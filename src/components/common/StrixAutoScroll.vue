<script lang="ts" setup>
/**
 * StrixAutoScroll —— 通用「粘底自动滚动」容器
 *
 * 自身即滚动容器（消费方通过 class 设置 max-height / overflow 等样式）。
 * 当内容追加（流式输出、日志增长等）时，若用户当前贴近底部则自动滚到底；
 * 一旦用户主动上滚超过阈值，则停止跟随，直至再次手动滚回底部。
 *
 * 替代项目中重复出现的手写粘底逻辑，全项目可复用。
 *
 * 用法：
 *   <StrixAutoScroll class="my-scroll-box" :threshold="80">
 *     <div v-html="rendered" />
 *   </StrixAutoScroll>
 *
 * 通过 ref 可调用 scrollToBottom(force?) / scrollToTop()，读取 stickToBottom。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 距底小于该像素值视为「贴底」，内容变化时自动跟随 */
    threshold?: number
    /** 渲染的根标签 */
    tag?: string
  }>(),
  {
    threshold: 80,
    tag: 'div'
  }
)

const rootRef = ref<HTMLElement | null>(null)
/** 当前是否贴底（只读对外暴露） */
const stickToBottom = ref(true)

let observer: MutationObserver | null = null

function distanceToBottom(el: HTMLElement): number {
  return el.scrollHeight - el.scrollTop - el.clientHeight
}

function onScroll() {
  const el = rootRef.value
  if (!el) return
  stickToBottom.value = distanceToBottom(el) < props.threshold
}

/** 滚动到底部；force=true 时无视当前是否贴底强制滚动 */
function scrollToBottom(force = false) {
  const el = rootRef.value
  if (!el) return
  if (!force && !stickToBottom.value) return
  el.scrollTop = el.scrollHeight
}

/** 滚动到顶部，并暂停粘底跟随 */
function scrollToTop() {
  const el = rootRef.value
  if (!el) return
  stickToBottom.value = false
  el.scrollTop = 0
}

onMounted(() => {
  const el = rootRef.value
  if (!el) return
  // 内容子树或文本变化时，若处于贴底状态则自动跟随
  observer = new MutationObserver(() => {
    if (stickToBottom.value) el.scrollTop = el.scrollHeight
  })
  observer.observe(el, { childList: true, subtree: true, characterData: true })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

defineExpose({ scrollToBottom, scrollToTop, stickToBottom })
</script>

<template>
  <component :is="tag" ref="rootRef" @scroll.passive="onScroll">
    <slot />
  </component>
</template>
