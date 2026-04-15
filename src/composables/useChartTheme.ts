export function useChartTheme() {
  const isDark = ref(document.documentElement.dataset.theme === 'dark')

  const updateTheme = () => {
    isDark.value = document.documentElement.dataset.theme === 'dark'
  }

  let observer: MutationObserver | null = null

  onMounted(() => {
    observer = new MutationObserver(() => updateTheme())
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
    updateTheme()
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  const colors = computed(() =>
    isDark.value
      ? {
          accent: '#63e2b7',
          accentSub: '#4ecdc4',
          error: '#e88080',
          warning: '#f2c97d',
          info: '#70c0e8',
          bg: '#06060e',
          cardBg: '#0f1019',
          text: '#e0e0e0',
          textSecondary: 'rgba(255, 255, 255, 0.55)',
          textTertiary: 'rgba(255, 255, 255, 0.3)',
          border: 'rgba(255, 255, 255, 0.06)',
          gridLine: 'rgba(255, 255, 255, 0.04)',
          tooltipBg: '#12131e',
          seriesPalette: ['#63e2b7', '#70c0e8', '#f2c97d', '#e88080', '#4ecdc4', '#a78bfa', '#f472b6', '#fbbf24']
        }
      : {
          accent: '#2db48c',
          accentSub: '#36997d',
          error: '#d03050',
          warning: '#f0a020',
          info: '#2080f0',
          bg: '#f5f6fa',
          cardBg: '#ffffff',
          text: '#1a1a2e',
          textSecondary: 'rgba(0, 0, 0, 0.6)',
          textTertiary: 'rgba(0, 0, 0, 0.35)',
          border: 'rgba(0, 0, 0, 0.09)',
          gridLine: 'rgba(0, 0, 0, 0.06)',
          tooltipBg: '#ffffff',
          seriesPalette: ['#2db48c', '#2080f0', '#f0a020', '#d03050', '#36997d', '#7c3aed', '#ec4899', '#d97706']
        }
  )

  return { isDark, colors }
}
