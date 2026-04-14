<template>
  <n-drawer v-model:show="visible" :width="540" placement="right">
    <n-drawer-content :title="drawerTitle" closable>
      <n-space vertical :size="16">
        <!-- 操作信息 -->
        <n-card size="small" title="操作信息">
          <n-descriptions :column="2" label-placement="left" bordered>
            <n-descriptions-item label="操作模块">{{ logData?.operationGroup }}</n-descriptions-item>
            <n-descriptions-item label="操作名称">{{ logData?.operationName }}</n-descriptions-item>
            <n-descriptions-item label="操作类型">
              <StrixTag :value="logData?.operationType ?? ''" dict-name="SystemLogOperType" />
            </n-descriptions-item>
            <n-descriptions-item label="响应时间">
              <NebulaTag :type="spendTagType" bordered>{{ logData?.operationSpend ?? '-' }}ms</NebulaTag>
            </n-descriptions-item>
            <n-descriptions-item label="发生时间" :span="2">{{ logData?.operationTime }}</n-descriptions-item>
          </n-descriptions>
        </n-card>

        <!-- 请求详情 -->
        <n-card size="small" title="请求详情">
          <template #header-extra>
            <n-button quaternary size="tiny" @click="copyText(logData?.operationParam)">
              <template #icon>
                <strix-icon icon="copy" :size="14" />
              </template>
            </n-button>
          </template>
          <n-descriptions :column="1" label-placement="left" bordered>
            <n-descriptions-item label="请求方式">
              <NebulaTag :type="logData?.operationMethod === 'POST' ? 'info' : 'default'">
                {{ logData?.operationMethod }}
              </NebulaTag>
            </n-descriptions-item>
            <n-descriptions-item label="请求地址">
              <n-text code>{{ logData?.operationUrl }}</n-text>
            </n-descriptions-item>
          </n-descriptions>
          <n-card
            v-if="logData?.operationParam"
            size="small"
            style="margin-top: 8px; max-height: 300px; overflow: auto"
          >
            <n-code :code="formattedParam" language="json" word-wrap />
          </n-card>
        </n-card>

        <!-- 客户端信息 -->
        <n-card size="small" title="客户端信息">
          <n-descriptions :column="2" label-placement="left" bordered>
            <n-descriptions-item label="操作用户">{{ logData?.clientUsername }}</n-descriptions-item>
            <n-descriptions-item label="用户ID">{{ logData?.clientUser }}</n-descriptions-item>
            <n-descriptions-item label="客户端IP">{{ logData?.clientIp }}</n-descriptions-item>
            <n-descriptions-item label="客户端设备" :span="1">
              <n-ellipsis :tooltip="{ contentStyle: { maxWidth: '360px' } }" style="max-width: 200px">
                {{ logData?.clientDevice }}
              </n-ellipsis>
            </n-descriptions-item>
          </n-descriptions>
        </n-card>

        <!-- 响应信息 -->
        <n-card size="small" title="响应信息">
          <template #header-extra>
            <n-button quaternary size="tiny" @click="copyText(logData?.responseData)">
              <template #icon>
                <strix-icon icon="copy" :size="14" />
              </template>
            </n-button>
          </template>
          <n-descriptions :column="2" label-placement="left" bordered>
            <n-descriptions-item label="状态码">
              <NebulaTag :type="responseCodeTagType" bordered>{{ logData?.responseCode }}</NebulaTag>
            </n-descriptions-item>
            <n-descriptions-item label="响应消息">{{ logData?.responseMsg }}</n-descriptions-item>
          </n-descriptions>
          <n-card
            v-if="logData?.responseData"
            size="small"
            style="margin-top: 8px; max-height: 300px; overflow: auto"
          >
            <n-code :code="formattedResponseData" language="json" word-wrap />
          </n-card>
        </n-card>

        <!-- 应用信息 -->
        <n-card size="small" title="应用信息">
          <n-descriptions :column="2" label-placement="left" bordered>
            <n-descriptions-item label="应用ID">{{ logData?.appId }}</n-descriptions-item>
            <n-descriptions-item label="应用版本">{{ logData?.appVersion }}</n-descriptions-item>
          </n-descriptions>
        </n-card>
      </n-space>
    </n-drawer-content>
  </n-drawer>
</template>

<script lang="ts" setup>
import type { SystemLogItem } from '@/api/monitor'
import type { NTagType } from '@/@types/naive-ui'
import NebulaTag from '@/components/common/NebulaTag.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import StrixIcon from '@/components/icon/StrixIcon.vue'

const props = defineProps<{
  logData: SystemLogItem | null
}>()

const visible = defineModel<boolean>('show', { default: false })

const drawerTitle = computed(() => props.logData?.operationName ?? '日志详情')

const formatJson = (str?: string) => {
  if (!str) return ''
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

const formattedParam = computed(() => formatJson(props.logData?.operationParam))
const formattedResponseData = computed(() => formatJson(props.logData?.responseData))

const spendTagType = computed<NTagType>(() => {
  const spend = props.logData?.operationSpend
  if (!spend) return 'default'
  if (spend < 500) return 'success'
  if (spend < 2000) return 'info'
  if (spend < 5000) return 'warning'
  return 'error'
})

const responseCodeTagType = computed<NTagType>(() => {
  const code = props.logData?.responseCode
  if (code === 200) return 'success'
  if (code === 500) return 'error'
  return 'warning'
})

const message = useMessage()
const copyText = (text?: string) => {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    message.success('已复制到剪贴板')
  })
}
</script>
