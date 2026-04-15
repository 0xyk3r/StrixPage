<template>
  <div class="page-container">
    <!-- 控制栏 -->
    <n-card class="control-card">
      <n-space :wrap="false" align="center" justify="space-between">
        <n-space align="center">
          <n-text strong>活动仪表板</n-text>
          <n-divider vertical />
          <n-radio-group v-model:value="timeRange" size="small">
            <n-radio-button value="today">今日</n-radio-button>
            <n-radio-button value="7days">近7天</n-radio-button>
            <n-radio-button value="30days">近30天</n-radio-button>
          </n-radio-group>
        </n-space>

        <n-space align="center">
          <n-text depth="3" style="font-size: 13px">
            {{ lastUpdateTime ? `最后更新: ${lastUpdateTime}` : '暂未加载' }}
          </n-text>
          <n-select
            v-model:value="refreshInterval"
            :disabled="!autoRefresh"
            :options="intervalOptions"
            size="small"
            style="width: 140px"
          />
          <n-button :type="autoRefresh ? 'primary' : 'default'" size="small" @click="toggleAutoRefresh">
            <template #icon>
              <strix-icon :icon="autoRefresh ? 'pause' : 'play'" :size="16" />
            </template>
            {{ autoRefresh ? '暂停刷新' : '自动刷新' }}
          </n-button>
          <n-button :disabled="loading" :loading="loading" size="small" @click="fetchData">
            <template #icon>
              <strix-icon icon="refresh-cw" :size="16" />
            </template>
            刷新
          </n-button>
        </n-space>
      </n-space>
    </n-card>

    <!-- 统计卡片 -->
    <n-grid :x-gap="12" :y-gap="12" cols="2 s:2 m:5" responsive="screen" style="margin-bottom: 12px">
      <n-gi>
        <n-card size="small">
          <n-spin :show="loading">
            <n-statistic label="今日操作">
              <n-number-animation :from="0" :to="stats.todayCount" />
            </n-statistic>
          </n-spin>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-spin :show="loading">
            <n-statistic label="今日错误">
              <n-number-animation :from="0" :to="stats.todayErrorCount" />
            </n-statistic>
          </n-spin>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-spin :show="loading">
            <n-statistic label="错误率">
              <template #suffix>%</template>
              <n-number-animation :from="0" :to="stats.errorRate" :precision="2" />
            </n-statistic>
          </n-spin>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-spin :show="loading">
            <n-statistic label="平均响应">
              <template #suffix>ms</template>
              <n-number-animation :from="0" :to="stats.avgResponseTime" />
            </n-statistic>
          </n-spin>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-spin :show="loading">
            <n-statistic label="活跃用户">
              <n-number-animation :from="0" :to="stats.activeUserCount" />
            </n-statistic>
          </n-spin>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- 趋势图 + 小时分布 -->
    <n-grid :x-gap="12" :y-gap="12" cols="1 m:2" responsive="screen" style="margin-bottom: 12px">
      <n-gi>
        <n-card :segmented="{ content: true }" title="操作趋势">
          <n-spin :show="loading">
            <div class="chart-container">
              <v-chart v-if="trendChartOptions" :option="trendChartOptions" autoresize class="strix-charts" />
              <StrixEmpty v-else description="暂无趋势数据" />
            </div>
          </n-spin>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card :segmented="{ content: true }" title="今日小时分布">
          <n-spin :show="loading">
            <div class="chart-container">
              <v-chart v-if="hourlyChartOptions" :option="hourlyChartOptions" autoresize class="strix-charts" />
              <StrixEmpty v-else description="暂无小时分布数据" />
            </div>
          </n-spin>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- 排名图 -->
    <n-grid :x-gap="12" :y-gap="12" cols="1 m:2" responsive="screen" style="margin-bottom: 12px">
      <n-gi>
        <n-card :segmented="{ content: true }" title="用户活跃排名">
          <n-spin :show="loading">
            <div class="chart-container">
              <v-chart v-if="userRankChartOptions" :option="userRankChartOptions" autoresize class="strix-charts" />
              <StrixEmpty v-else description="暂无用户排名数据" />
            </div>
          </n-spin>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card :segmented="{ content: true }" title="模块操作排名">
          <n-spin :show="loading">
            <div class="chart-container">
              <v-chart v-if="moduleRankChartOptions" :option="moduleRankChartOptions" autoresize class="strix-charts" />
              <StrixEmpty v-else description="暂无模块排名数据" />
            </div>
          </n-spin>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- 最近操作 -->
    <n-card :segmented="{ content: true }" title="最近操作">
      <n-spin :show="loading">
        <n-data-table
          :columns="recentColumns"
          :data="data?.recentActivities || []"
          :bordered="false"
          :single-line="false"
          size="small"
          :pagination="false"
        />
      </n-spin>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import StrixEmpty from '@/components/common/StrixEmpty.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import { useDashboard } from '@/composables/useDashboard'
import { formatRelativeTime } from '@/utils/time-format'
import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts'
import { BarChart, LineChart } from 'echarts/charts'
import type { GridComponentOption, LegendComponentOption, TooltipComponentOption } from 'echarts/components'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import type { DataTableColumn } from 'naive-ui'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

type ChartOption = ComposeOption<
  LineSeriesOption | BarSeriesOption | GridComponentOption | TooltipComponentOption | LegendComponentOption
>

const { loading, data, stats, timeRange, autoRefresh, refreshInterval, lastUpdateTime, fetchData, toggleAutoRefresh } =
  useDashboard()

const { colors } = useChartTheme()

const intervalOptions = [
  { label: '10 秒', value: 10000 },
  { label: '30 秒', value: 30000 },
  { label: '60 秒', value: 60000 }
]

// ---------- 趋势图 ----------
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
    legend: {
      data: ['操作总数', '错误数'],
      textStyle: { color: c.textSecondary, fontSize: 12 },
      top: 0
    },
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

// ---------- 小时分布图 ----------
const hourlyChartOptions = computed<ChartOption | null>(() => {
  const hourly = data.value?.hourlyDistribution
  if (!hourly?.length) return null
  const c = colors.value

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: c.tooltipBg,
      borderColor: c.border,
      textStyle: { color: c.text, fontSize: 12 },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        return `${p.name}:00 — ${p.value} 次操作`
      }
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

// ---------- 排名图 (水平条形图) ----------
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
      axisLabel: {
        color: c.textSecondary,
        fontSize: 11,
        width: 88,
        overflow: 'truncate'
      }
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
        label: {
          show: true,
          position: 'right',
          color: c.textSecondary,
          fontSize: 11
        }
      }
    ]
  }
}

const userRankChartOptions = computed(() => buildRankOptions(data.value?.userRanks, colors.value.accent))
const moduleRankChartOptions = computed(() => buildRankOptions(data.value?.moduleRanks, colors.value.info))

// ---------- 最近操作表格 ----------
const recentColumns: DataTableColumn[] = [
  { title: '用户', key: 'username', width: 120 },
  { title: '操作模块', key: 'operationGroup', width: 120 },
  { title: '操作名称', key: 'operationName', ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'responseCode',
    width: 80,
    render: (row: any) =>
      h(
        'span',
        { style: { color: row.responseCode === 200 ? colors.value.accent : colors.value.error } },
        row.responseCode === 200 ? '成功' : '失败'
      )
  },
  {
    title: '耗时',
    key: 'operationSpend',
    width: 80,
    render: (row: any) => `${row.operationSpend ?? '-'} ms`
  },
  {
    title: '时间',
    key: 'operationTime',
    width: 130,
    render: (row: any) => (row.operationTime ? formatRelativeTime(row.operationTime) : '-')
  }
]
</script>

<style lang="scss" scoped>
.control-card {
  margin-bottom: 12px;

  :deep(.n-card__content) {
    padding: 12px 16px;
  }
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.strix-charts {
  width: 100%;
  height: 100%;
}
</style>
