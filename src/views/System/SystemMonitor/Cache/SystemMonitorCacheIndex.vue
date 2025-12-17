<template>
  <div class="page-container">
    <!-- 头部控制栏 -->
    <n-card class="control-card">
      <n-space :wrap="false" align="center" justify="space-between">
        <n-space align="center">
          <n-text strong>缓存服务监控</n-text>
          <n-divider vertical />
          <n-text depth="3" style="font-size: 13px">
            {{ lastUpdateTime ? `最后更新: ${lastUpdateTime}` : '暂未加载' }}
          </n-text>
        </n-space>

        <n-space align="center">
          <n-select
            v-model:value="refreshInterval"
            :disabled="!autoRefresh"
            :options="intervalOptions"
            size="small"
            style="width: 140px"
          />
          <n-button :type="autoRefresh ? 'primary' : 'default'" size="small" @click="toggleAutoRefresh">
            <template #icon>
              <Pause v-if="autoRefresh" :size="16" />
              <Play v-else :size="16" />
            </template>
            {{ autoRefresh ? '暂停刷新' : '自动刷新' }}
          </n-button>
          <n-button :disabled="loading" :loading="loading" size="small" @click="handleRefresh">
            <template #icon>
              <RefreshCw :size="16" />
            </template>
            刷新
          </n-button>
        </n-space>
      </n-space>
    </n-card>

    <!-- 服务状态统计卡片 -->
    <n-grid :x-gap="12" :y-gap="12" cols="1 s:2 m:2 l:4" responsive="screen">
      <n-gi>
        <n-card :segmented="{ content: true }" size="small" title="服务信息">
          <n-spin :show="loading">
            <n-space :size="12" vertical>
              <n-statistic :value="cacheInfo.info?.redis_version || '-'" label="服务版本" />
              <n-divider style="margin: 0" />
              <n-statistic label="运行模式">
                <template #default>
                  <n-tag :type="cacheInfo.info?.redis_mode === 'standalone' ? 'info' : 'success'">
                    {{ cacheInfo.info?.redis_mode === 'standalone' ? '单机' : '集群' }}
                  </n-tag>
                </template>
              </n-statistic>
              <n-divider style="margin: 0" />
              <n-statistic :value="cacheInfo.info?.tcp_port || '-'" label="运行端口" />
              <n-divider style="margin: 0" />
              <n-statistic label="运行天数">
                <template #suffix> 天 </template>
                <template #default>{{ cacheInfo.info?.uptime_in_days || 0 }}</template>
              </n-statistic>
            </n-space>
          </n-spin>
        </n-card>
      </n-gi>

      <n-gi>
        <n-card :segmented="{ content: true }" size="small" title="连接信息">
          <n-spin :show="loading">
            <n-space :size="12" vertical>
              <n-statistic label="连接数量">
                <template #default>
                  <n-tag :bordered="false" size="large" type="info">
                    {{ cacheInfo.info?.connected_clients || 0 }}
                  </n-tag>
                </template>
              </n-statistic>
              <n-divider style="margin: 0" />
              <n-statistic label="缓存数量">
                <template #default>
                  <n-tag :bordered="false" size="large" type="success">
                    {{ cacheInfo.dbSize || 0 }}
                  </n-tag>
                </template>
              </n-statistic>
              <n-divider style="margin: 0" />
              <n-statistic :value="cacheInfo.info?.instantaneous_input_kbps || '0'" label="实时速率" suffix="KB/s" />
            </n-space>
          </n-spin>
        </n-card>
      </n-gi>

      <n-gi>
        <n-card :segmented="{ content: true }" size="small" title="内存使用">
          <n-spin :show="loading">
            <n-space :size="12" vertical>
              <n-statistic label="内存用量">
                <template #default>
                  <n-tag :bordered="false" size="large" type="warning">
                    {{ cacheInfo.info?.used_memory_human || '-' }}
                  </n-tag>
                </template>
              </n-statistic>
              <n-divider style="margin: 0" />
              <n-statistic label="内存限制">
                <template #default>
                  <n-text>
                    {{
                      cacheInfo.info?.maxmemory_human === '0B' || !cacheInfo.info?.maxmemory_human
                        ? '无限制'
                        : cacheInfo.info.maxmemory_human
                    }}
                  </n-text>
                </template>
              </n-statistic>
              <n-divider style="margin: 0" />
              <n-statistic label="CPU占用">
                <template #suffix> % </template>
                <template #default>
                  {{ getCpuUsage() }}
                </template>
              </n-statistic>
            </n-space>
          </n-spin>
        </n-card>
      </n-gi>

      <n-gi>
        <n-card :segmented="{ content: true }" size="small" title="持久化状态">
          <n-spin :show="loading">
            <n-space :size="12" vertical>
              <n-statistic label="AOF状态">
                <template #default>
                  <n-tag :type="cacheInfo.info?.aof_enabled === '0' ? 'default' : 'success'">
                    {{ cacheInfo.info?.aof_enabled === '0' ? '关闭' : '开启' }}
                  </n-tag>
                </template>
              </n-statistic>
              <n-divider style="margin: 0" />
              <n-statistic label="RDB状态">
                <template #default>
                  <n-tag :type="cacheInfo.info?.rdb_last_bgsave_status === 'ok' ? 'success' : 'error'">
                    {{ cacheInfo.info?.rdb_last_bgsave_status || '-' }}
                  </n-tag>
                </template>
              </n-statistic>
            </n-space>
          </n-spin>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- 图表展示 -->
    <n-grid :x-gap="12" :y-gap="12" cols="1 m:2" responsive="screen" style="margin-top: 12px">
      <n-gi>
        <n-card :segmented="{ content: true }" title="命令统计">
          <n-spin :show="loading">
            <div class="chart-container">
              <v-chart
                v-if="!loading && commandStatsOptions.series"
                :option="commandStatsOptions"
                autoresize
                class="strix-charts"
              />
              <n-empty v-else-if="!loading" description="暂无命令统计数据" style="padding: 60px 0" />
            </div>
          </n-spin>
        </n-card>
      </n-gi>

      <n-gi>
        <n-card :segmented="{ content: true }" title="内存信息">
          <n-spin :show="loading">
            <div class="chart-container">
              <v-chart
                v-if="!loading && usedMemoryOptions.series"
                :option="usedMemoryOptions"
                autoresize
                class="strix-charts"
              />
              <n-empty v-else-if="!loading" description="暂无内存信息数据" style="padding: 60px 0" />
            </div>
          </n-spin>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script lang="ts" setup>
import { http } from '@/plugins/axios'
import type { GaugeSeriesOption, PieSeriesOption } from 'echarts/charts'
import { GaugeChart, PieChart } from 'echarts/charts'
import type { TooltipComponentOption } from 'echarts/components'
import { TooltipComponent } from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { Pause, Play, RefreshCw } from 'lucide-vue-next'
import VChart from 'vue-echarts'

use([CanvasRenderer, PieChart, GaugeChart, TooltipComponent])

// 数据状态
const loading = ref(true)
const cacheInfo = ref<any>({})
const lastUpdateTime = ref('')

// 自动刷新配置
const autoRefresh = ref(false)
const refreshInterval = ref(30000)
const refreshTimer = ref<number | null>(null)

// 刷新间隔选项
const intervalOptions = [
  { label: '10 秒', value: 10000 },
  { label: '30 秒', value: 30000 },
  { label: '60 秒', value: 60000 }
]

// 图表配置
const commandStatsOptions = ref<ComposeOption<TooltipComponentOption | PieSeriesOption>>({})
const usedMemoryOptions = ref<ComposeOption<TooltipComponentOption | GaugeSeriesOption>>({})

// 计算CPU占用率
const getCpuUsage = () => {
  if (!cacheInfo.value.info?.used_cpu_user_children) return '0.00'
  return (cacheInfo.value.info.used_cpu_user_children * 100).toFixed(2)
}

// 格式化时间
const formatTime = () => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
}

// 获取缓存数据
const getData = async () => {
  try {
    loading.value = true
    const { data: res } = await http.get('system/monitor/cache', {
      meta: { operate: '加载系统缓存信息' }
    })

    cacheInfo.value = res.data
    lastUpdateTime.value = formatTime()

    // 更新图表数据
    updateCharts(res.data)
  } catch (error) {
    console.error('获取缓存数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 更新图表配置
const updateCharts = (data: any) => {
  if (!data) return

  // 命令统计饼图
  if (data.commandStats && data.commandStats.length > 0) {
    commandStatsOptions.value = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
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

  // 内存使用仪表盘
  if (data.info?.used_memory) {
    const usedMemoryKB = parseInt((data.info.used_memory / 1024).toFixed(2))

    usedMemoryOptions.value = {
      tooltip: {
        formatter: '{b} <br/>{a} : ' + data.info.used_memory_human
      },
      series: [
        {
          name: '峰值',
          type: 'gauge',
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.3, '#67e0e3'],
                [0.7, '#37a2da'],
                [1, '#fd666d']
              ]
            }
          },
          axisTick: {
            distance: -20,
            length: 8,
            lineStyle: {
              color: '#fff',
              width: 2
            }
          },
          splitLine: {
            distance: -20,
            length: 20,
            lineStyle: {
              color: '#fff',
              width: 4
            }
          },
          axisLabel: {
            color: 'inherit',
            distance: 30,
            fontSize: 12
          },
          min: 0,
          max: 10000,
          detail: {
            color: 'inherit',
            formatter: usedMemoryKB + ' KB'
          },
          data: [
            {
              value: usedMemoryKB,
              name: '内存消耗'
            }
          ]
        }
      ]
    }
  }
}

// 手动刷新
const handleRefresh = () => {
  getData()
}

// 切换自动刷新
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value

  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

// 开始自动刷新
const startAutoRefresh = () => {
  stopAutoRefresh()
  getData()
  refreshTimer.value = window.setInterval(() => {
    getData()
  }, refreshInterval.value)
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// 监听刷新间隔变化
watch(refreshInterval, () => {
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

// 组件挂载
onMounted(() => {
  getData()
})

// 组件卸载
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style lang="scss" scoped>
.control-card {
  margin-bottom: 12px;

  :deep(.n-card__content) {
    padding: 12px 16px;
  }
}

.chart-container {
  height: 380px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.strix-charts {
  width: 100%;
  height: 100%;
}

:deep(.n-statistic) {
  .n-statistic-value__content {
    font-size: 18px;
  }
}
</style>
