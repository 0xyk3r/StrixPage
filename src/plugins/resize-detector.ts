import elementResizeDetector from 'element-resize-detector'

const erd = elementResizeDetector({ strategy: 'scroll' })

export const useResizeDetector = (el: HTMLElement | null, callback: (e: HTMLElement) => void) => {
  if (!el) return console.warn('`useResizeDetector()` Element is not defined')
  onMounted(() => {
    erd.listenTo(el, callback)
  })
  onBeforeUnmount(() => {
    erd.removeListener(el, callback)
  })
}
