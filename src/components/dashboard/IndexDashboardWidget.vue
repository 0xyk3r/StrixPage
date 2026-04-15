<template>
  <div class="dw">
    <!-- Top: 4 stat cards -->
    <div class="dw__top">
      <div
        v-for="item in statCards"
        :key="item.key"
        class="dw__card"
        :class="`dw__card--${item.key}`"
      >
        <div class="dw__card-bg"></div>
        <div class="dw__card-label">
          <span class="dw__card-icon">
            <StrixIcon :icon="item.icon" :size="12" />
          </span>
          {{ item.label }}
        </div>
        <div class="dw__card-row">
          <div class="dw__card-value">
            <n-number-animation :from="0" :to="item.value" :precision="0" />
            <span v-if="item.suffix" class="dw__card-suffix">{{ item.suffix }}</span>
          </div>
          <v-chart
            v-if="item.sparkOpts"
            :option="item.sparkOpts"
            autoresize
            class="dw__card-spark"
          />
        </div>
        <div class="dw__card-trend" :class="item.trendClass">
          {{ item.trendText }}
        </div>
      </div>
    </div>

    <!-- Bottom: trend chart + module ranking -->
    <div class="dw__bottom">
      <!-- Trend chart -->
      <div class="dw__trend">
        <div class="dw__trend-header">
          <div class="dw__trend-title">近 7 日操作趋势</div>
          <div class="dw__trend-actions">
            <router-link to="/system/monitor/dashboard" class="dw__trend-link">
              查看完整仪表板 →
            </router-link>
            <span class="dw__trend-time" @click="fetchData">
              {{ lastUpdateTime ? `更新于 ${lastUpdateTime}` : '加载中...' }}
            </span>
          </div>
        </div>
        <div class="dw__trend-chart">
          <v-chart v-if="trendOptions" :option="trendOptions" autoresize class="dw__vchart" />
        </div>
      </div>

      <!-- Module ranking -->
      <div class="dw__ranking">
        <div class="dw__ranking-title">模块操作排名</div>
        <ul v-if="moduleRanks.length" class="dw__rank-list">
          <li v-for="(item, idx) in moduleRanks" :key="item.name" class="dw__rank-item">
            <span
              class="dw__rank-pos"
              :class="idx < 3 ? `dw__rank-pos--${idx + 1}` : 'dw__rank-pos--other'"
            >
              {{ idx + 1 }}
            </span>
            <span class="dw__rank-name">{{ item.name }}</span>
            <span class="dw__rank-bar">
              <span
                class="dw__rank-bar-fill"
                :style="{ width: `${rankPercent(item.count)}%` }"
              ></span>
            </span>
            <span class="dw__rank-count">{{ item.count }}</span>
          </li>
        </ul>
        <div v-else class="dw__rank-empty">暂无数据</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import StrixIcon from '@/components/icon/StrixIcon.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import { useDashboard } from '@/composables/useDashboard'
import type { LineSeriesOption } from 'echarts/charts'
import { LineChart } from 'echarts/charts'
import type { GridComponentOption, LegendComponentOption, TooltipComponentOption } from 'echarts/components'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

type ChartOption = ComposeOption<LineSeriesOption | GridComponentOption | TooltipComponentOption | LegendComponentOption>

const { stats, data, lastUpdateTime, fetchData } = useDashboard()
const { colors } = useChartTheme()

const moduleRanks = computed(() => data.value?.moduleRanks?.slice(0, 5) ?? [])
const rankMax = computed(() => Math.max(...moduleRanks.value.map((r) => r.count), 1))
const rankPercent = (count: number) => Math.round((count / rankMax.value) * 100)

// Compute trend comparison (today vs yesterday from trends array)
const comparison = computed(() => {
  const trends = data.value?.trends
  if (!trends || trends.length < 2) return null
  const today = trends[trends.length - 1]
  const yesterday = trends[trends.length - 2]
  if (!today || !yesterday) return null
  return { today, yesterday }
})

function trendInfo(todayVal: number, yesterdayVal: number, unit = '', invert = false) {
  const diff = todayVal - yesterdayVal
  if (diff === 0) return { text: '— 与昨日持平', cls: 'dw__card-trend--neutral' }
  const isUp = diff > 0
  const isGood = invert ? !isUp : isUp
  const arrow = isUp ? '↑' : '↓'
  const sign = isUp ? '+' : ''
  if (yesterdayVal === 0) {
    return {
      text: `${arrow} 较昨日 ${sign}${diff}${unit}`,
      cls: isGood ? 'dw__card-trend--up' : 'dw__card-trend--down'
    }
  }
  const pct = Math.round((Math.abs(diff) / yesterdayVal) * 100)
  return {
    text: `${arrow} 较昨日 ${sign}${pct}%`,
    cls: isGood ? 'dw__card-trend--up' : 'dw__card-trend--down'
  }
}

// Mini sparkline builder per stat card
function buildMiniSpark(
  values: number[],
  color: string
): ChartOption {
  return {
    grid: { top: 2, right: 0, bottom: 2, left: 0 },
    xAxis: { type: 'category', show: false, data: values.map((_, i) => i) },
    yAxis: { type: 'value', show: false },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'none',
        lineStyle: { color, width: 1.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + '30' },
              { offset: 1, color: color + '05' }
            ]
          }
        }
      }
    ]
  }
}

const statCards = computed(() => {
  const c = colors.value
  const cmp = comparison.value
  const trends = data.value?.trends ?? []
  const trendVals = trends.map((t) => t.totalCount)
  const errorVals = trends.map((t) => t.errorCount)
  const respVals = trends.map((t) => t.avgResponseTime)
  const userVals = trends.map((t) => t.activeUserCount)

  const opsInfo = cmp
    ? trendInfo(cmp.today.totalCount, cmp.yesterday.totalCount)
    : { text: '—', cls: 'dw__card-trend--neutral' }
  const errInfo = cmp
    ? trendInfo(cmp.today.errorCount, cmp.yesterday.errorCount, '', true)
    : { text: '—', cls: 'dw__card-trend--neutral' }
  // For response time: lower is better → invert
  const respInfo = cmp
    ? trendInfo(cmp.today.avgResponseTime, cmp.yesterday.avgResponseTime, 'ms', true)
    : { text: '—', cls: 'dw__card-trend--neutral' }
  const usrInfo = cmp
    ? trendInfo(cmp.today.activeUserCount, cmp.yesterday.activeUserCount)
    : { text: '—', cls: 'dw__card-trend--neutral' }

  return [
    {
      key: 'ops',
      icon: 'activity',
      label: '今日操作',
      value: stats.value.todayCount,
      suffix: '',
      sparkOpts: trendVals.length > 1 ? buildMiniSpark(trendVals, c.accent) : null,
      trendText: opsInfo.text,
      trendClass: opsInfo.cls
    },
    {
      key: 'err',
      icon: 'alert-triangle',
      label: '今日错误',
      value: stats.value.todayErrorCount,
      suffix: '',
      sparkOpts: errorVals.length > 1 ? buildMiniSpark(errorVals, c.error) : null,
      trendText: errInfo.text,
      trendClass: errInfo.cls
    },
    {
      key: 'resp',
      icon: 'clock',
      label: '平均响应',
      value: stats.value.avgResponseTime,
      suffix: 'ms',
      sparkOpts: respVals.length > 1 ? buildMiniSpark(respVals, c.info) : null,
      trendText: respInfo.text,
      trendClass: respInfo.cls
    },
    {
      key: 'usr',
      icon: 'users',
      label: '活跃用户',
      value: stats.value.activeUserCount,
      suffix: '',
      sparkOpts: userVals.length > 1 ? buildMiniSpark(userVals, c.warning) : null,
      trendText: usrInfo.text,
      trendClass: usrInfo.cls
    }
  ]
})

// Main trend chart
const trendOptions = computed<ChartOption | null>(() => {
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
    legend: {
      data: ['操作总数', '错误数'],
      textStyle: { color: c.textSecondary, fontSize: 11 },
      top: 0,
      left: 0,
      itemWidth: 12,
      itemHeight: 8
    },
    grid: { top: 28, right: 12, bottom: 20, left: 40 },
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
        name: '操作总数',
        type: 'line',
        data: trends.map((t) => t.totalCount),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: c.accent, width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: c.accent + '25' },
              { offset: 1, color: c.accent + '03' }
            ]
          }
        }
      },
      {
        name: '错误数',
        type: 'line',
        data: trends.map((t) => t.errorCount),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: c.error, width: 1.5, type: 'dashed' }
      }
    ]
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/style/tokens/typography' as t;

.dw {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;

  // ---- Top: 4 stat cards ----
  &__top {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  &__card {
    padding: 18px 20px;
    border: 1px solid var(--strix-border-default);
    border-radius: 6px;
    background: var(--strix-bg-surface);
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;

    &:hover {
      border-color: var(--strix-border-accent-hover);
    }
  }

  // Colored background circle
  &__card-bg {
    position: absolute;
    right: -10px;
    bottom: -10px;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    opacity: 0.06;
  }

  &__card--ops &__card-bg { background: var(--strix-color-accent); }
  &__card--err &__card-bg { background: var(--strix-color-error); }
  &__card--resp &__card-bg { background: var(--strix-color-info); }
  &__card--usr &__card-bg { background: var(--strix-color-warning); }

  &__card-label {
    font-size: 12px;
    color: var(--strix-text-muted);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__card-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }

  &__card--ops &__card-icon { background: rgba(99, 226, 183, 0.15); color: var(--strix-color-accent); }
  &__card--err &__card-icon { background: rgba(232, 128, 128, 0.15); color: var(--strix-color-error); }
  &__card--resp &__card-icon { background: rgba(112, 192, 232, 0.15); color: var(--strix-color-info); }
  &__card--usr &__card-icon { background: rgba(242, 201, 125, 0.15); color: var(--strix-color-warning); }

  &__card-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  &__card-value {
    font-size: 30px;
    font-weight: 700;
    color: var(--strix-text-primary);
    line-height: 1;
  }

  &__card-suffix {
    font-size: 13px;
    color: var(--strix-text-muted);
    margin-left: 2px;
  }

  &__card-spark {
    width: 80px;
    height: 30px;
    opacity: 0.5;
  }

  &__card-trend {
    font-size: 10px;
    margin-top: 2px;
    font-family: t.$font-mono;

    &--up { color: var(--strix-color-accent); }
    &--down { color: var(--strix-color-error); }
    &--neutral { color: var(--strix-text-dim); }
  }

  // ---- Bottom: trend chart + ranking ----
  &__bottom {
    display: grid;
    grid-template-columns: 3fr 1fr;
    gap: 12px;
  }

  &__trend {
    border: 1px solid var(--strix-border-default);
    border-radius: 6px;
    background: var(--strix-bg-surface);
    padding: 16px 20px;
  }

  &__trend-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  &__trend-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--strix-text-primary);
  }

  &__trend-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__trend-link {
    font-size: 11px;
    color: var(--strix-text-accent);
    text-decoration: none;
    opacity: 0.8;
    transition: opacity 0.2s;

    &:hover { opacity: 1; }
  }

  &__trend-time {
    font-family: t.$font-mono;
    font-size: 10px;
    color: var(--strix-text-dim);
    cursor: pointer;
    transition: color 0.2s;

    &:hover { color: var(--strix-text-accent); }
  }

  &__trend-chart {
    height: 150px;
  }

  &__vchart {
    width: 100%;
    height: 100%;
  }

  // ---- Module ranking ----
  &__ranking {
    border: 1px solid var(--strix-border-default);
    border-radius: 6px;
    background: var(--strix-bg-surface);
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
  }

  &__ranking-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--strix-text-primary);
    margin-bottom: 14px;
  }

  &__rank-list {
    list-style: none;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__rank-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 0;
    border-bottom: 1px solid var(--strix-border-subtle);
    font-size: 12px;

    &:last-child { border-bottom: none; }
  }

  &__rank-pos {
    width: 18px;
    height: 18px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;

    &--1 { background: var(--strix-color-accent); color: var(--strix-bg-base); }
    &--2 { background: rgba(99, 226, 183, 0.3); color: var(--strix-text-accent); }
    &--3 { background: rgba(99, 226, 183, 0.15); color: var(--strix-text-secondary); }
    &--other { background: var(--strix-bg-surface-hover); color: var(--strix-text-dim); }
  }

  &__rank-name {
    flex: 1;
    color: var(--strix-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__rank-bar {
    width: 50px;
    height: 4px;
    background: var(--strix-border-default);
    border-radius: 2px;
    overflow: hidden;
    flex-shrink: 0;
  }

  &__rank-bar-fill {
    height: 100%;
    background: var(--strix-color-accent);
    border-radius: 2px;
    transition: width 0.6s ease;
  }

  &__rank-count {
    font-family: t.$font-mono;
    color: var(--strix-text-muted);
    flex-shrink: 0;
    min-width: 24px;
    text-align: right;
  }

  &__rank-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--strix-text-dim);
    font-size: 12px;
  }
}

// Responsive
@media (max-width: 900px) {
  .dw__top { grid-template-columns: repeat(2, 1fr); }
  .dw__bottom { grid-template-columns: 1fr; }
}

@media (max-width: 520px) {
  .dw__top { grid-template-columns: 1fr; }
}
</style>
