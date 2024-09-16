<template>
  <div class="min-w-1024">
    <n-card title="Redis Info">
      <n-spin :show="!cacheInfo">
        <n-descriptions label-placement="left" :column="4" bordered>
          <n-descriptions-item label="Redis版本">
            {{ cacheInfo.info?.redis_version }}
          </n-descriptions-item>
          <n-descriptions-item label="运行模式">
            {{ cacheInfo.info?.redis_mode == 'standalone' ? '单机' : '集群' }}
          </n-descriptions-item>
          <n-descriptions-item label="端口">
            {{ cacheInfo.info?.tcp_port }}
          </n-descriptions-item>
          <n-descriptions-item label="客户端数">
            {{ cacheInfo.info?.connected_clients }}
          </n-descriptions-item>

          <n-descriptions-item label="运行天数">
            {{ cacheInfo.info?.uptime_in_days }}
          </n-descriptions-item>
          <n-descriptions-item label="使用内存">
            {{ cacheInfo.info?.used_memory_human }}
          </n-descriptions-item>
          <n-descriptions-item label="CPU占用">
            {{ cacheInfo.info?.used_cpu_user_children }}
          </n-descriptions-item>
          <n-descriptions-item label="内存配置">
            {{ cacheInfo.info?.maxmemory_human }}
          </n-descriptions-item>

          <n-descriptions-item label="AOF状态">
            {{ cacheInfo.info?.aof_enabled == '0' ? '关闭' : '开启' }}
          </n-descriptions-item>
          <n-descriptions-item label="RDB状态">
            {{ cacheInfo.info?.rdb_last_bgsave_status }}
          </n-descriptions-item>
          <n-descriptions-item label="Key数量">
            {{ cacheInfo.dbSize }}
          </n-descriptions-item>
          <n-descriptions-item label="实时速率">
            {{ cacheInfo.info?.instantaneous_input_kbps }}
          </n-descriptions-item>
        </n-descriptions>
      </n-spin>
    </n-card>

    <n-grid x-gap="12" :cols="2">
      <n-gi>
        <n-card title="命令统计" style="margin-top: 15px">
          <div id="commandstats" style="height: 420px" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="内存信息" style="margin-top: 15px">
          <div id="usedmemory" style="height: 420px" />
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>
<script setup lang="ts">
import { http } from '@/plugins/axios'
import { useEcharts } from '@/plugins/echarts'

const loading = ref(true)
const cacheInfo = ref<any>({})

const getData = () => {
  const commandstats = useEcharts(document.getElementById('commandstats'))
  const usedmemory = useEcharts(document.getElementById('usedmemory'))

  loading.value = true
  http
    .get('system/monitor/cache', { meta: { operate: '加载系统缓存信息' } })
    .then(({ data: res }) => {
      loading.value = false
      cacheInfo.value = res.data

      const usedMemoryKB = (res.data.info.used_memory / 1024).toFixed(2)

      commandstats.setOption({
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
      })

      usedmemory.setOption({
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
              formatter: usedMemoryKB
            },
            data: [
              {
                value: usedMemoryKB,
                name: '内存消耗'
              }
            ]
          }
        ]
      })
    })
}
onMounted(getData)
</script>
<style lang="scss" scoped></style>
