<template>
  <div class="min-w-1024">
    <n-card title="缓存服务详情">
      <n-spin :show="loading">
        <n-descriptions :column="4" bordered label-placement="left">
          <n-descriptions-item label="服务版本">
            {{ cacheInfo.info?.redis_version }}
          </n-descriptions-item>
          <n-descriptions-item label="运行模式">
            {{ cacheInfo.info?.redis_mode == 'standalone' ? '单机' : '集群' }}
          </n-descriptions-item>
          <n-descriptions-item label="运行端口">
            {{ cacheInfo.info?.tcp_port }}
          </n-descriptions-item>
          <n-descriptions-item label="连接数量">
            {{ cacheInfo.info?.connected_clients }}
          </n-descriptions-item>

          <n-descriptions-item label="运行天数">
            {{ cacheInfo.info?.uptime_in_days }} 天
          </n-descriptions-item>
          <n-descriptions-item label="内存用量">
            {{ cacheInfo.info?.used_memory_human }}
          </n-descriptions-item>
          <n-descriptions-item label="CPU占用">
            {{ (cacheInfo.info?.used_cpu_user_children * 100).toFixed(2) }}%
          </n-descriptions-item>
          <n-descriptions-item label="内存限制">
            {{ cacheInfo.info?.maxmemory_human }}
          </n-descriptions-item>

          <n-descriptions-item label="AOF">
            {{ cacheInfo.info?.aof_enabled == '0' ? '关闭' : '开启' }}
          </n-descriptions-item>
          <n-descriptions-item label="RDB">
            {{ cacheInfo.info?.rdb_last_bgsave_status }}
          </n-descriptions-item>
          <n-descriptions-item label="缓存数量">
            {{ cacheInfo.dbSize }}
          </n-descriptions-item>
          <n-descriptions-item label="实时速率">
            {{ cacheInfo.info?.instantaneous_input_kbps }}
          </n-descriptions-item>
        </n-descriptions>
      </n-spin>
    </n-card>

    <n-grid :cols="2" x-gap="12">
      <n-gi>
        <n-card style="min-height: 420px; margin-top: 15px" title="命令统计">
          <n-spin :show="loading">
            <v-chart :option="commandStatsOptions" autoresize class="strix-charts" />
          </n-spin>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card style="min-height: 420px; margin-top: 15px" title="内存信息">
          <n-spin :show="loading">
            <v-chart :option="usedMemoryOptions" autoresize class="strix-charts" />
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
import VChart from 'vue-echarts'

use([CanvasRenderer, PieChart, GaugeChart, TooltipComponent])

const loading = ref(true)
const cacheInfo = ref<any>({})

const commandStatsOptions = ref<ComposeOption<TooltipComponentOption | PieSeriesOption>>({})
const usedMemoryOptions = ref<ComposeOption<TooltipComponentOption | GaugeSeriesOption>>({})

const getData = () => {
  loading.value = true
  http
    .get('system/monitor/cache', { meta: { operate: '加载系统缓存信息' } })
    .then(({ data: res }) => {
      loading.value = false
      cacheInfo.value = res.data

      const usedMemoryKB = parseInt((res.data.info.used_memory / 1024).toFixed(2))

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
            data: res.data.commandStats,
            animationEasing: 'cubicInOut',
            animationDuration: 1000
          }
        ]
      }

      usedMemoryOptions.value = {
        tooltip: {
          formatter: '{b} <br/>{a} : ' + res.data.info.used_memory_human
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
    })
}
onMounted(getData)

setInterval(getData, 30000)
</script>
<style lang="scss" scoped></style>
