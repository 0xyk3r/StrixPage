import { dashboardApi } from '@/api/dashboard'
import type { DashboardOverviewResp, DashboardStats } from '@/api/dashboard'

export type TimeRange = 'today' | '7days' | '30days'

const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  today: 1,
  '7days': 7,
  '30days': 30
}

export function useDashboard(options?: { autoFetch?: boolean }) {
  const loading = ref(false)
  const timeRange = ref<TimeRange>('7days')
  const autoRefresh = ref(false)
  const refreshInterval = ref(30000)
  const lastUpdateTime = ref('')

  const data = ref<DashboardOverviewResp | null>(null)

  const stats = computed<DashboardStats>(
    () =>
      data.value?.stats ?? {
        todayCount: 0,
        todayErrorCount: 0,
        avgResponseTime: 0,
        activeUserCount: 0,
        errorRate: 0
      }
  )

  const fetchData = async () => {
    try {
      loading.value = true
      const days = TIME_RANGE_DAYS[timeRange.value]
      const { data: res } = await dashboardApi.overview(days)
      data.value = res.data
      const now = new Date()
      lastUpdateTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    } catch (error) {
      console.error('加载仪表板数据失败:', error)
    } finally {
      loading.value = false
    }
  }

  let refreshTimer: ReturnType<typeof setInterval> | null = null

  const startAutoRefresh = () => {
    stopAutoRefresh()
    refreshTimer = setInterval(() => fetchData(), refreshInterval.value)
  }

  const stopAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  const toggleAutoRefresh = () => {
    autoRefresh.value = !autoRefresh.value
    if (autoRefresh.value) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }

  watch(refreshInterval, () => {
    if (autoRefresh.value) startAutoRefresh()
  })

  watch(timeRange, () => fetchData())

  onMounted(() => {
    if (options?.autoFetch !== false) fetchData()
  })

  onUnmounted(() => stopAutoRefresh())

  return {
    loading,
    data,
    stats,
    timeRange,
    autoRefresh,
    refreshInterval,
    lastUpdateTime,
    fetchData,
    toggleAutoRefresh
  }
}
