<template>
  <div>
    <n-grid :cols="2" x-gap="12">
      <n-gi>
        <n-card title="CPU Info">
          <n-spin :show="!serverInfo.cpu">
            <n-table :single-line="false">
              <thead>
                <tr>
                  <th>属性</th>
                  <th>数值</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>核心数</td>
                  <td>{{ serverInfo.cpu?.cpuNum }}</td>
                </tr>
                <tr>
                  <td>用户使用率</td>
                  <td>{{ serverInfo.cpu?.used }}</td>
                </tr>
                <tr>
                  <td>系统使用率</td>
                  <td>{{ serverInfo.cpu?.sys }}</td>
                </tr>
                <tr>
                  <td>当前空闲率</td>
                  <td>{{ serverInfo.cpu?.free }}</td>
                </tr>
              </tbody>
            </n-table>
          </n-spin>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="Memory Info">
          <n-spin :show="!serverInfo.mem">
            <n-table :single-line="false">
              <thead>
                <tr>
                  <th>属性</th>
                  <th>ALL (GB)</th>
                  <th>JVM (MB)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>总内存</td>
                  <td>{{ serverInfo.mem?.total }}</td>
                  <td>{{ serverInfo.jvm?.total }}</td>
                </tr>
                <tr>
                  <td>已用内存</td>
                  <td>{{ serverInfo.mem?.used }}</td>
                  <td>{{ serverInfo.jvm?.used }}</td>
                </tr>
                <tr>
                  <td>剩余内存</td>
                  <td>{{ serverInfo.mem?.free }}</td>
                  <td>{{ serverInfo.jvm?.free }}</td>
                </tr>
                <tr>
                  <td>使用率</td>
                  <td>{{ serverInfo.mem?.usage }}</td>
                  <td>{{ serverInfo.jvm?.usage }}</td>
                </tr>
              </tbody>
            </n-table>
          </n-spin>
        </n-card>
      </n-gi>
    </n-grid>

    <n-card style="margin-top: 15px" title="Server Info">
      <n-spin :show="!serverInfo.sys">
        <n-descriptions :column="2" bordered label-placement="left">
          <n-descriptions-item label="服务器名称">
            {{ serverInfo.sys?.computerName }}
          </n-descriptions-item>
          <n-descriptions-item label="操作系统">
            {{ serverInfo.sys?.osName }}
          </n-descriptions-item>
          <n-descriptions-item label="服务器IP">
            {{ serverInfo.sys?.computerIp }}
          </n-descriptions-item>
          <n-descriptions-item label="系统架构">
            {{ serverInfo.sys?.osArch }}
          </n-descriptions-item>
        </n-descriptions>
      </n-spin>
    </n-card>

    <n-card style="margin-top: 15px" title="JVM Info">
      <n-spin :show="!serverInfo.jvm">
        <n-descriptions :column="2" bordered label-placement="left">
          <n-descriptions-item label="Java名称">
            {{ serverInfo.jvm?.name }}
          </n-descriptions-item>
          <n-descriptions-item label="Java版本">
            {{ serverInfo.jvm?.version }}
          </n-descriptions-item>
          <n-descriptions-item label="启动时间">
            {{ serverInfo.jvm?.startTime }}
          </n-descriptions-item>
          <n-descriptions-item label="运行时长">
            {{ serverInfo.jvm?.runTime }}
          </n-descriptions-item>
          <n-descriptions-item :span="2" label="安装路径">
            {{ serverInfo.jvm?.home }}
          </n-descriptions-item>
          <n-descriptions-item :span="2" label="项目路径">
            {{ serverInfo.sys?.userDir }}
          </n-descriptions-item>
          <n-descriptions-item :span="2" label="运行参数">
            {{ serverInfo.jvm?.inputArgs }}
          </n-descriptions-item>
        </n-descriptions>
      </n-spin>
    </n-card>

    <n-card style="margin-top: 15px" title="Disk Info">
      <n-spin :show="!serverInfo.sysFiles">
        <n-table :single-line="false">
          <thead>
            <tr>
              <th>盘符路径</th>
              <th>文件系统</th>
              <th>盘符类型</th>
              <th>总大小</th>
              <th>可用大小</th>
              <th>已用大小</th>
              <th>已用百分比</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(sysFile, index) in serverInfo.sysFiles" :key="index">
              <td>{{ sysFile.dirName }}</td>
              <td>{{ sysFile.sysTypeName }}</td>
              <td>{{ sysFile.typeName }}</td>
              <td>{{ sysFile.total }}</td>
              <td>{{ sysFile.free }}</td>
              <td>{{ sysFile.used }}</td>
              <td>{{ sysFile.usage }}</td>
            </tr>
          </tbody>
        </n-table>
      </n-spin>
    </n-card>
  </div>
</template>
<script lang="ts" setup>
import { http } from '@/plugins/axios'

const loading = ref(true)
const serverInfo = ref<any>({})

const getData = () => {
  loading.value = true
  http.get('system/monitor/server', { meta: { operate: '加载系统运行信息' } }).then(({ data: res }) => {
    loading.value = false
    serverInfo.value = res.data.server
  })
}
onMounted(getData)
</script>
<style lang="scss" scoped>
::v-deep(.n-descriptions-table-header) {
  width: 25%;
}
</style>
