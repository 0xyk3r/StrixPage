import { computed, onMounted, onUnmounted, ref } from 'vue'

export function useScrollProgress(containerSelector: string, showThreshold = 100) {
  const progress = ref(0)
  const scrollVisible = ref(false)
  const hiding = ref(false)
  let container: HTMLElement | null = null

  const onScroll = () => {
    if (!container) return
    const { scrollTop, scrollHeight, clientHeight } = container
    const maxScroll = scrollHeight - clientHeight
    progress.value = maxScroll > 0 ? scrollTop / maxScroll : 0
    scrollVisible.value = scrollTop > showThreshold
    if (scrollTop <= showThreshold) hiding.value = false
  }

  const visible = computed(() => scrollVisible.value && !hiding.value)

  const scrollToTop = () => {
    hiding.value = true
    container?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  onMounted(() => {
    container = document.querySelector(containerSelector)
    container?.addEventListener('scroll', onScroll, { passive: true })
  })

  onUnmounted(() => {
    container?.removeEventListener('scroll', onScroll)
  })

  return { progress, visible, scrollToTop }
}
