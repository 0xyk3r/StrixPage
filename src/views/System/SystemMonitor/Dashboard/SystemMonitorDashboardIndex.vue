<template>
  <div class="dash">
    <div class="nbp-header">
      <div class="nbp-header__left">
        <div class="nbp-header__brand">
          <span class="nbp-pulse-dot"></span>
          <span class="nbp-mono-label">MISSION_CONTROL</span>
        </div>
        <h2 class="nbp-page-title">活动仪表盘</h2>
      </div>
      <div class="dash-controls">
        <div class="dash-time-group">
          <button
            v-for="opt in timeRangeOptions"
            :key="opt.value"
            :class="['dash-time-btn', { 'is-active': timeRange === opt.value }]"
            @click="setTimeRange(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <div class="dash-divider-v"></div>
        <span v-if="lastUpdateTime" class="nbp-mono-xs nbp-dim">{{ lastUpdateTime }}</span>
        <select v-model="refreshInterval" :disabled="!autoRefresh" class="nbp-select">
          <option v-for="opt in intervalOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <button :class="['nbp-ctrl-btn', { 'is-active': autoRefresh }]" @click="toggleAutoRefresh">
          {{ autoRefresh ? '⏸ 暂停' : '▶ 自动刷新' }}
        </button>
        <button class="nbp-ctrl-btn" :disabled="loading" @click="fetchData">
          <span :class="{ 'nbp-spin': loading }">↻</span> 刷新
        </button>
      </div>
    </div>

    <!-- Stats strip -->
    <div class="nbp-stats">
      <div v-for="stat in statCards" :key="stat.key" class="nbp-stat-card">
        <span class="nbp-hud-corner nbp-hud-corner--tl"></span>
        <span class="nbp-hud-corner nbp-hud-corner--br"></span>
        <div class="nbp-stat-card__label">{{ stat.label }}</div>
        <div class="nbp-stat-card__val" :style="{ color: stat.color }">
          {{ stat.format ? stat.format(stat.val) : stat.val }}
          <span v-if="stat.suffix" class="nbp-stat-card__suffix">{{ stat.suffix }}</span>
        </div>
        <div class="nbp-stat-card__meta">{{ stat.meta }}</div>
      </div>
    </div>

    <!-- Charts: trend + hourly -->
    <div class="dash-chart-row">
      <div class="nbp-panel">
        <div class="nbp-panel__head">
          <span class="nbp-panel__title">操作趋势</span>
          <span class="nbp-mono-label nbp-dim">TREND_ANALYSIS</span>
        </div>
        <n-spin :show="loading">
          <div class="dash-chart-body">
            <v-chart v-if="trendChartOptions" :option="trendChartOptions" autoresize class="dash-vchart" />
            <div v-else-if="!loading" class="dash-chart-empty">暂无趋势数据</div>
          </div>
        </n-spin>
      </div>
      <div class="nbp-panel">
        <div class="nbp-panel__head">
          <span class="nbp-panel__title">今日小时分布</span>
          <span class="nbp-mono-label nbp-dim">HOURLY_DIST</span>
        </div>
        <n-spin :show="loading">
          <div class="dash-chart-body">
            <v-chart v-if="hourlyChartOptions" :option="hourlyChartOptions" autoresize class="dash-vchart" />
            <div v-else-if="!loading" class="dash-chart-empty">暂无数据</div>
          </div>
        </n-spin>
      </div>
    </div>

    <!-- Charts: user rank + module rank -->
    <div class="dash-chart-row">
      <div class="nbp-panel">
        <div class="nbp-panel__head">
          <span class="nbp-panel__title">用户活跃排名</span>
          <span class="nbp-mono-label nbp-dim">USER_RANK</span>
        </div>
        <n-spin :show="loading">
          <div class="dash-chart-body">
            <v-chart v-if="userRankChartOptions" :option="userRankChartOptions" autoresize class="dash-vchart" />
            <div v-else-if="!loading" class="dash-chart-empty">暂无数据</div>
          </div>
        </n-spin>
      </div>
      <div class="nbp-panel">
        <div class="nbp-panel__head">
          <span class="nbp-panel__title">模块操作排名</span>
          <span class="nbp-mono-label nbp-dim">MODULE_RANK</span>
        </div>
        <n-spin :show="loading">
          <div class="dash-chart-body">
            <v-chart v-if="moduleRankChartOptions" :option="moduleRankChartOptions" autoresize class="dash-vchart" />
            <div v-else-if="!loading" class="dash-chart-empty">暂无数据</div>
          </div>
        </n-spin>
      </div>
    </div>

    <!-- Recent activities -->
    <div class="nbp-panel">
      <div class="nbp-panel__head">
        <span class="nbp-panel__title">最近操作</span>
        <span class="nbp-mono-label nbp-dim">RECENT_ACTIVITY</span>
      </div>
      <div class="nbp-table-wrap dash-act-table">
        <div v-if="loading" class="nbp-loading-bar">
          <div class="nbp-loading-bar__fill"></div>
        </div>
        <div class="nbp-thead dash-act-cols">
          <div class="nbp-th">用户</div>
          <div class="nbp-th">模块</div>
          <div class="nbp-th">操作名称</div>
          <div class="nbp-th">状态</div>
          <div class="nbp-th">耗时</div>
          <div class="nbp-th">时间</div>
        </div>
        <div v-if="!loading && !data?.recentActivities?.length" class="nbp-table-empty">
          <span class="nbp-mono-label nbp-dim">NO_RECENT_ACTIVITY</span>
        </div>
        <div
          v-for="(row, i) in data?.recentActivities ?? []"
          :key="i"
          class="nbp-row dash-act-cols"
          :style="{ '--ri': i }"
        >
          <div class="nbp-td">{{ row.username }}</div>
          <div class="nbp-td">
            <span class="dash-act-chip">{{ row.operationGroup }}</span>
          </div>
          <div class="nbp-td nbp-ellipsis">{{ row.operationName }}</div>
          <div class="nbp-td">
            <span :class="['dash-act-status', row.responseCode === 200 ? 'is-ok' : 'is-err']">{{
                row.responseCode === 200 ? '成功' : '失败'
              }}</span>
          </div>
          <div class="nbp-td nbp-mono-xs nbp-dim">{{ row.operationSpend ?? '—' }} ms</div>
          <div class="nbp-td nbp-mono-xs nbp-dim">
            {{ row.operationTime ? formatRelativeTime(row.operationTime) : '—' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TimeRange } from '@/composables/useDashboard'
import { useDashboard } from '@/composables/useDashboard'
import { useChartTheme } from '@/composables/useChartTheme'
import { formatRelativeTime } from '@/utils/time-format'
import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts'
import { BarChart, LineChart } from 'echarts/charts'
import type { GridComponentOption, LegendComponentOption, TooltipComponentOption } from 'echarts/components'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

type ChartOption = ComposeOption<
  LineSeriesOption | BarSeriesOption | GridComponentOption | TooltipComponentOption | LegendComponentOption
>

const { loading, data, stats, timeRange, autoRefresh, refreshInterval, lastUpdateTime, fetchData, toggleAutoRefresh } =
  useDashboard()

const { colors } = useChartTheme()

const setTimeRange = (value: string) => {
  timeRange.value = value as TimeRange
}

const timeRangeOptions = [
  { label: '今日', value: 'today' },
  { label: '近7天', value: '7days' },
  { label: '近30天', value: '30days' }
]

const intervalOptions = [
  { label: '10 秒', value: 10000 },
  { label: '30 秒', value: 30000 },
  { label: '60 秒', value: 60000 }
]

const statCards = computed(() => [
  {
    key: 'todayCount',
    label: '今日操作',
    val: stats.value.todayCount,
    meta: 'OPERATIONS',
    color: 'var(--strix-color-accent)'
  },
  {
    key: 'todayErrorCount',
    label: '今日错误',
    val: stats.value.todayErrorCount,
    meta: 'ERRORS',
    color: 'var(--strix-color-error)'
  },
  {
    key: 'errorRate',
    label: '错误率',
    val: stats.value.errorRate,
    suffix: '%',
    format: (v: number) => v.toFixed(2),
    meta: 'ERROR_RATE',
    color: 'var(--strix-color-warning)'
  },
  {
    key: 'avgResponseTime',
    label: '平均响应',
    val: stats.value.avgResponseTime,
    suffix: 'ms',
    meta: 'AVG_LATENCY',
    color: 'var(--strix-color-info)'
  },
  {
    key: 'activeUserCount',
    label: '活跃用户',
    val: stats.value.activeUserCount,
    meta: 'ACTIVE_USERS',
    color: 'var(--strix-color-accent)'
  }
])

const trendChartOptions = computed<ChartOption | null>(() => {
  const trends = data.value?.trends
  if (!trends?.length) return null
  const c = colors.value
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: c.tooltipBg,
      borderColor: c.border,
      textStyle: { color: c.text, fontSize: 12 }
    },
    legend: { data: ['操作总数', '错误数'], textStyle: { color: c.textSecondary, fontSize: 12 }, top: 0 },
    grid: { top: 36, right: 16, bottom: 24, left: 48 },
    xAxis: {
      type: 'category',
      data: trends.map((t) => t.date.slice(5)),
      axisLine: { lineStyle: { color: c.border } },
      axisLabel: { color: c.textSecondary, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: c.textSecondary, fontSize: 11 },
      splitLine: { lineStyle: { color: c.gridLine } }
    },
    series: [
      {
        name: '操作总数',
        type: 'line',
        data: trends.map((t) => t.totalCount),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: c.accent, width: 2 },
        itemStyle: { color: c.accent },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: c.accent + '30' },
              { offset: 1, color: c.accent + '05' }
            ]
          }
        }
      },
      {
        name: '错误数',
        type: 'line',
        data: trends.map((t) => t.errorCount),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: c.error, width: 2 },
        itemStyle: { color: c.error }
      }
    ]
  }
})

const hourlyChartOptions = computed<ChartOption | null>(() => {
  const hourly = data.value?.hourlyDistribution
  if (!hourly?.length) return null
  const c = colors.value
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: c.tooltipBg,
      borderColor: c.border,
      textStyle: { color: c.text, fontSize: 12 }
    },
    grid: { top: 12, right: 16, bottom: 24, left: 48 },
    xAxis: {
      type: 'category',
      data: hourly.map((h) => String(h.hour).padStart(2, '0')),
      axisLine: { lineStyle: { color: c.border } },
      axisLabel: { color: c.textSecondary, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: c.textSecondary, fontSize: 11 },
      splitLine: { lineStyle: { color: c.gridLine } }
    },
    series: [
      {
        type: 'bar',
        data: hourly.map((h) => h.count),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: c.accent },
              { offset: 1, color: c.accent + '40' }
            ]
          },
          borderRadius: [3, 3, 0, 0]
        },
        barMaxWidth: 24
      }
    ]
  }
})

const buildRankOptions = (items: { name: string; count: number }[] | undefined, color: string): ChartOption | null => {
  if (!items?.length) return null
  const c = colors.value
  const reversed = [...items].reverse()
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: c.tooltipBg,
      borderColor: c.border,
      textStyle: { color: c.text, fontSize: 12 }
    },
    grid: { top: 8, right: 40, bottom: 8, left: 100 },
    xAxis: {
      type: 'value',
      axisLabel: { color: c.textSecondary, fontSize: 11 },
      splitLine: { lineStyle: { color: c.gridLine } }
    },
    yAxis: {
      type: 'category',
      data: reversed.map((r) => r.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: c.textSecondary, fontSize: 11, width: 88, overflow: 'truncate' }
    },
    series: [
      {
        type: 'bar',
        data: reversed.map((r) => r.count),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: color + '60' },
              { offset: 1, color: color }
            ]
          },
          borderRadius: [0, 3, 3, 0]
        },
        barMaxWidth: 20,
        label: { show: true, position: 'right', color: c.textSecondary, fontSize: 11 }
      }
    ]
  }
}

const userRankChartOptions = computed(() => buildRankOptions(data.value?.userRanks, colors.value.accent))
const moduleRankChartOptions = computed(() => buildRankOptions(data.value?.moduleRanks, colors.value.info))
</script>

<style lang="scss" scoped>
.dash {
  padding: 4px 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ─── Controls ─── */
.dash-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dash-time-group {
  display: flex;
  gap: 3px;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-default);
  border-radius: 8px;
  padding: 3px;
}

.dash-time-btn {
  height: 28px;
  padding: 0 12px;
  border-radius: 5px;
  border: none;
  background: transparent;
  color: var(--strix-text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--strix-text-primary);
  }

  &.is-active {
    background: var(--strix-color-accent);
    color: #06060e;
    font-weight: 600;
  }
}

.dash-divider-v {
  width: 1px;
  height: 24px;
  background: var(--strix-border-default);
}

/* ─── Charts ─── */
.dash-chart-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 12px;
}

.dash-chart-body {
  height: 280px;
  padding: 12px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dash-vchart {
  width: 100%;
  height: 100%;
}

.dash-chart-empty {
  font-size: 13px;
  color: var(--strix-text-secondary);
  opacity: 0.4;
}

.dash-chart-skel {
  position: absolute;
  inset: 12px;
  height: auto;
  border-radius: 8px;
}

/* ─── Activity table ─── */
.dash-act-table {
  border: none;
  border-radius: 0;
}

.dash-act-cols {
  grid-template-columns: 120px 100px 1fr 70px 90px 120px;
}

.dash-act-chip {
  padding: 2px 8px;
  background: var(--strix-bg-surface-hover);
  border: 1px solid var(--strix-border-default);
  border-radius: 4px;
  font-size: 11px;
  color: var(--strix-text-secondary);
}

.dash-act-status {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 100px;

  &.is-ok {
    color: var(--strix-color-success);
    background: color-mix(in srgb, var(--strix-color-success) 10%, transparent);
  }

  &.is-err {
    color: var(--strix-color-error);
    background: color-mix(in srgb, var(--strix-color-error) 10%, transparent);
  }
}
</style>
