<template>
  <div class="cache-nexus">
    <div class="nbp-header">
      <div class="nbp-header__left">
        <div class="nbp-header__brand">
          <span class="nbp-pulse-dot"></span>
          <span class="nbp-mono-label">CACHE_NEXUS</span>
        </div>
        <h2 class="nbp-page-title">缓存监控</h2>
      </div>
      <div class="cnx-controls">
        <span v-if="lastUpdateTime" class="nbp-mono-xs nbp-dim">UPDATED {{ lastUpdateTime }}</span>
        <select v-model="refreshInterval" :disabled="!autoRefresh" class="nbp-select">
          <option v-for="opt in intervalOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <button :class="['nbp-ctrl-btn', { 'is-active': autoRefresh }]" @click="toggleAutoRefresh">
          {{ autoRefresh ? '⏸ 暂停' : '▶ 自动刷新' }}
        </button>
        <button class="nbp-ctrl-btn" :disabled="loading" @click="handleRefresh">
          <span :class="{ 'nbp-spin': loading }">↻</span> 刷新
        </button>
      </div>
    </div>

    <!-- Status panels -->
    <div class="cnx-status-grid">
      <div class="nbp-panel">
        <div class="nbp-panel__head">
          <span class="nbp-mono-label">SERVER_INFO</span>
          <div class="cnx-online-badge"><span class="cnx-dot-green"></span><span>在线</span></div>
        </div>
        <div class="cnx-info-list">
          <div class="cnx-info-row">
            <span class="cnx-info-key">Redis 版本</span>
            <span class="nbp-code-chip">{{ cacheInfo.info?.redis_version || '—' }}</span>
          </div>
          <div class="cnx-info-row">
            <span class="cnx-info-key">运行模式</span>
            <span
              :class="[
                'nbp-badge',
                cacheInfo.info?.redis_mode === 'standalone' ? 'nbp-badge--info' : 'nbp-badge--success'
              ]"
            >
              {{ cacheInfo.info?.redis_mode === 'standalone' ? '单机' : '集群' }}
            </span>
          </div>
          <div class="cnx-info-row">
            <span class="cnx-info-key">服务端口</span>
            <span class="nbp-code-chip">{{ cacheInfo.info?.tcp_port || '—' }}</span>
          </div>
          <div class="cnx-info-row">
            <span class="cnx-info-key">运行天数</span>
            <span class="cnx-info-val">{{ cacheInfo.info?.uptime_in_days || 0 }} 天</span>
          </div>
        </div>
      </div>

      <div class="nbp-panel">
        <div class="nbp-panel__head">
          <span class="nbp-mono-label">CONNECTIONS</span>
        </div>
        <div class="cnx-metrics-list">
          <div class="cnx-metric">
            <div class="cnx-metric__label">活跃连接</div>
            <div class="cnx-metric__val cnx-info-color">{{ cacheInfo.info?.connected_clients || 0 }}</div>
          </div>
          <div class="cnx-metric">
            <div class="cnx-metric__label">缓存键数</div>
            <div class="cnx-metric__val cnx-accent-color">{{ cacheInfo.dbSize || 0 }}</div>
          </div>
          <div class="cnx-metric">
            <div class="cnx-metric__label">实时速率</div>
            <div class="cnx-metric__val">
              {{ cacheInfo.info?.instantaneous_input_kbps || '0' }}<span class="cnx-metric__unit">KB/s</span>
            </div>
          </div>
        </div>
      </div>

      <div class="nbp-panel">
        <div class="nbp-panel__head">
          <span class="nbp-mono-label">MEMORY_USAGE</span>
        </div>
        <div class="cnx-metrics-list">
          <div class="cnx-metric">
            <div class="cnx-metric__label">当前用量</div>
            <div class="cnx-metric__val cnx-warn-color">{{ cacheInfo.info?.used_memory_human || '—' }}</div>
          </div>
          <div class="cnx-metric">
            <div class="cnx-metric__label">内存上限</div>
            <div class="cnx-metric__val">
              {{
                cacheInfo.info?.maxmemory_human === '0B' || !cacheInfo.info?.maxmemory_human
                  ? '无限制'
                  : cacheInfo.info?.maxmemory_human
              }}
            </div>
          </div>
          <div class="cnx-metric">
            <div class="cnx-metric__label">CPU 占用</div>
            <div class="cnx-metric__val">{{ getCpuUsage() }}<span class="cnx-metric__unit">%</span></div>
          </div>
        </div>
      </div>

      <div class="nbp-panel">
        <div class="nbp-panel__head">
          <span class="nbp-mono-label">PERSISTENCE</span>
        </div>
        <div class="cnx-info-list">
          <div class="cnx-info-row">
            <span class="cnx-info-key">AOF 持久化</span>
            <span
              :class="['nbp-badge', cacheInfo.info?.aof_enabled === '0' ? 'nbp-badge--neutral' : 'nbp-badge--success']"
            >
              {{ cacheInfo.info?.aof_enabled === '0' ? '关闭' : '开启' }}
            </span>
          </div>
          <div class="cnx-info-row">
            <span class="cnx-info-key">RDB 状态</span>
            <span
              :class="[
                'nbp-badge',
                cacheInfo.info?.rdb_last_bgsave_status === 'ok' ? 'nbp-badge--success' : 'nbp-badge--error'
              ]"
            >
              {{ cacheInfo.info?.rdb_last_bgsave_status || '—' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="cnx-charts-row">
      <div class="nbp-panel">
        <div class="nbp-panel__head">
          <span class="nbp-panel__title">命令统计</span>
          <span class="nbp-mono-label nbp-dim">COMMAND_STATS</span>
        </div>
        <n-spin :show="loading">
          <div class="cnx-chart-body">
            <v-chart v-if="commandStatsOptions.series" :option="commandStatsOptions" autoresize class="cnx-vchart" />
            <div v-else-if="!loading" class="cnx-chart-empty">暂无命令统计数据</div>
          </div>
        </n-spin>
      </div>
      <div class="nbp-panel">
        <div class="nbp-panel__head">
          <span class="nbp-panel__title">内存信息</span>
          <span class="nbp-mono-label nbp-dim">MEMORY_GAUGE</span>
        </div>
        <n-spin :show="loading">
          <div class="cnx-chart-body">
            <v-chart v-if="usedMemoryOptions.series" :option="usedMemoryOptions" autoresize class="cnx-vchart" />
            <div v-else-if="!loading" class="cnx-chart-empty">暂无内存信息数据</div>
          </div>
        </n-spin>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { monitorApi } from '@/api/monitor'
import { useChartTheme } from '@/composables/useChartTheme'
import type { GaugeSeriesOption, PieSeriesOption } from 'echarts/charts'
import { GaugeChart, PieChart } from 'echarts/charts'
import type { TooltipComponentOption } from 'echarts/components'
import { TooltipComponent } from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

use([CanvasRenderer, PieChart, GaugeChart, TooltipComponent])

const { colors: chartColors } = useChartTheme()

const loading = ref(true)
const cacheInfo = ref<any>({})
const lastUpdateTime = ref('')
const autoRefresh = ref(false)
const refreshInterval = ref(30000)
const refreshTimer = ref<number | null>(null)

const intervalOptions = [
  { label: '10 秒', value: 10000 },
  { label: '30 秒', value: 30000 },
  { label: '60 秒', value: 60000 }
]

const commandStatsOptions = ref<ComposeOption<TooltipComponentOption | PieSeriesOption>>({})
const usedMemoryOptions = ref<ComposeOption<TooltipComponentOption | GaugeSeriesOption>>({})

const getCpuUsage = () => {
  if (!cacheInfo.value.info?.used_cpu_user_children) return '0.00'
  return (cacheInfo.value.info.used_cpu_user_children * 100).toFixed(2)
}

const formatTime = () => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
}

const getData = async () => {
  try {
    loading.value = true
    const { data: res } = await monitorApi.cacheInfo()
    cacheInfo.value = res.data
    lastUpdateTime.value = formatTime()
    updateCharts(res.data)
  } catch (error) {
    console.error('获取缓存数据失败:', error)
  } finally {
    loading.value = false
  }
}

const updateCharts = (data: any) => {
  if (!data) return
  if (data.commandStats && data.commandStats.length > 0) {
    commandStatsOptions.value = {
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c} ({d}%)' },
      series: [
        {
          name: '命令',
          type: 'pie',
          roseType: 'radius',
          radius: [50, 150],
          itemStyle: { borderRadius: 8 },
          center: ['50%', '50%'],
          data: data.commandStats,
          animationEasing: 'cubicInOut',
          animationDuration: 1000
        }
      ]
    }
  }
  if (data.info?.used_memory) {
    const usedMemoryKB = parseInt((data.info.used_memory / 1024).toFixed(2))
    usedMemoryOptions.value = {
      tooltip: { formatter: '{b} <br/>{a} : ' + data.info.used_memory_human },
      series: [
        {
          name: '峰值',
          type: 'gauge',
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.3, chartColors.value.accent],
                [0.7, chartColors.value.info],
                [1, chartColors.value.error]
              ]
            }
          },
          axisTick: { distance: -20, length: 8, lineStyle: { color: chartColors.value.text, width: 2 } },
          splitLine: { distance: -20, length: 20, lineStyle: { color: chartColors.value.text, width: 4 } },
          axisLabel: { color: 'inherit', distance: 30, fontSize: 12 },
          min: 0,
          max: 10000,
          detail: { color: 'inherit', formatter: usedMemoryKB + ' KB' },
          data: [{ value: usedMemoryKB, name: '内存消耗' }]
        }
      ]
    }
  }
}

const handleRefresh = () => getData()

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  stopAutoRefresh()
  getData()
  refreshTimer.value = window.setInterval(() => getData(), refreshInterval.value)
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

watch(refreshInterval, () => {
  if (autoRefresh.value) startAutoRefresh()
})

watch(chartColors, () => {
  if (cacheInfo.value.info?.used_memory) updateCharts(cacheInfo.value)
})

onMounted(() => getData())
onUnmounted(() => stopAutoRefresh())
</script>

<style lang="scss" scoped>
.cache-nexus {
  padding: 4px 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ─── Controls ─── */
.cnx-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* ─── Status grid ─── */
.cnx-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

/* ─── Online badge ─── */
.cnx-online-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--strix-color-success);
}

.cnx-dot-green {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--strix-color-success);
  box-shadow: 0 0 6px var(--strix-color-success);
  animation: cnx-pulse 2s ease-in-out infinite;
}

@keyframes cnx-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* ─── Panel content ─── */
.cnx-panel-loading {
  height: 100px;
  background: var(--strix-bg-surface-hover);
  animation: cnx-skel 1.2s ease-in-out infinite;
}

@keyframes cnx-skel {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}

.cnx-info-list {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cnx-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cnx-info-key {
  font-size: 12px;
  color: var(--strix-text-secondary);
  white-space: nowrap;
}

.cnx-info-val {
  font-size: 13px;
  font-weight: 500;
  color: var(--strix-text-primary);
  text-align: right;
}

.cnx-metrics-list {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cnx-metric {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cnx-metric__label {
  font-size: 11px;
  color: var(--strix-text-secondary);
}

.cnx-metric__val {
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  color: var(--strix-text-primary);
  letter-spacing: -0.5px;
}

.cnx-metric__unit {
  font-size: 12px;
  font-weight: 400;
  color: var(--strix-text-secondary);
  margin-left: 2px;
}

.cnx-info-color {
  color: var(--strix-color-info);
}

.cnx-accent-color {
  color: var(--strix-color-accent);
}

.cnx-warn-color {
  color: var(--strix-color-warning);
}

/* ─── Charts ─── */
.cnx-charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 12px;
}

.cnx-chart-body {
  height: 340px;
  padding: 12px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cnx-vchart {
  width: 100%;
  height: 100%;
}

.cnx-chart-empty {
  font-size: 13px;
  color: var(--strix-text-secondary);
  opacity: 0.4;
}

.cnx-chart-skel {
  position: absolute;
  inset: 12px;
  height: auto;
  border-radius: 8px;
}
</style>
