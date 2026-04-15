<template>
  <div class="nebula-dashboard-widget">
    <div class="nebula-dashboard-widget__header">
      <span class="nebula-dashboard-widget__label">SYSTEM_ACTIVITY</span>
      <span class="nebula-dashboard-widget__update" @click="fetchData">
        {{ lastUpdateTime ? `UPD ${lastUpdateTime}` : 'LOADING...' }}
      </span>
    </div>

    <div class="nebula-dashboard-widget__stats">
      <div v-for="item in statItems" :key="item.key" class="nebula-dashboard-widget__stat">
        <div class="nebula-dashboard-widget__stat-value">
          <n-number-animation :from="0" :to="item.value" :precision="item.precision || 0" />
          <span v-if="item.suffix" class="nebula-dashboard-widget__stat-suffix">{{ item.suffix }}</span>
        </div>
        <div class="nebula-dashboard-widget__stat-label">{{ item.label }}</div>
      </div>
    </div>

    <div class="nebula-dashboard-widget__chart">
      <v-chart v-if="sparklineOptions" :option="sparklineOptions" autoresize class="nebula-dashboard-widget__vchart" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useChartTheme } from '@/composables/useChartTheme'
import { useDashboard } from '@/composables/useDashboard'
import type { LineSeriesOption } from 'echarts/charts'
import { LineChart } from 'echarts/charts'
import type { GridComponentOption, TooltipComponentOption } from 'echarts/components'
import { GridComponent, TooltipComponent } from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

type SparklineOption = ComposeOption<LineSeriesOption | GridComponentOption | TooltipComponentOption>

const { stats, data, lastUpdateTime, fetchData } = useDashboard()
const { colors } = useChartTheme()

const statItems = computed(() => [
  { key: 'total', label: 'TODAY_OPS', value: stats.value.todayCount, precision: 0, suffix: '' },
  { key: 'errors', label: 'ERRORS', value: stats.value.todayErrorCount, precision: 0, suffix: '' },
  { key: 'avg', label: 'AVG_RESP', value: stats.value.avgResponseTime, precision: 0, suffix: 'ms' },
  { key: 'users', label: 'ACTIVE_USR', value: stats.value.activeUserCount, precision: 0, suffix: '' }
])

const sparklineOptions = computed<SparklineOption | null>(() => {
  const trends = data.value?.trends
  if (!trends?.length) return null
  const c = colors.value

  return {
    grid: { top: 8, right: 8, bottom: 20, left: 36 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: c.tooltipBg,
      borderColor: c.border,
      textStyle: { color: c.text, fontSize: 12 }
    },
    xAxis: {
      type: 'category',
      data: trends.map((t) => t.date.slice(5)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: c.textTertiary, fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: c.textTertiary, fontSize: 10 },
      splitLine: { lineStyle: { color: c.gridLine } }
    },
    series: [
      {
        type: 'line',
        data: trends.map((t) => t.totalCount),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: c.accent, width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: c.accent + '40' },
              { offset: 1, color: c.accent + '05' }
            ]
          }
        }
      }
    ]
  }
})
</script>

<style lang="scss" scoped>
.nebula-dashboard-widget {
  margin: 0 auto 24px;
  max-width: 1200px;
  border: 1px solid var(--nebula-border-subtle);
  border-radius: 6px;
  padding: 16px 20px;
  background: var(--nebula-bg-surface);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  &__label {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--nebula-text-accent);
    text-transform: uppercase;
  }

  &__update {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 10px;
    color: var(--nebula-text-tertiary);
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: var(--nebula-text-accent);
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 14px;
  }

  &__stat {
    text-align: center;
    padding: 8px 4px;
    border: 1px solid var(--nebula-border-subtle);
    border-radius: 4px;

    &-value {
      font-size: 22px;
      font-weight: 600;
      color: var(--nebula-text-primary);
      line-height: 1.2;
    }

    &-suffix {
      font-size: 12px;
      color: var(--nebula-text-tertiary);
      margin-left: 2px;
    }

    &-label {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 10px;
      letter-spacing: 0.06em;
      color: var(--nebula-text-tertiary);
      margin-top: 4px;
      text-transform: uppercase;
    }
  }

  &__chart {
    height: 120px;
  }

  &__vchart {
    width: 100%;
    height: 100%;
  }
}

@media (max-width: 640px) {
  .nebula-dashboard-widget__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
