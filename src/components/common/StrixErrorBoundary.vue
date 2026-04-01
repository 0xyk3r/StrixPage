<template>
  <slot v-if="!hasError" />
  <div v-else class="strix-error-boundary">
    <n-result status="error" :title="title" :description="description">
      <template #footer>
        <n-space justify="center">
          <n-button type="primary" @click="retry">
            <template #icon>
              <RotateCcw :size="16" />
            </template>
            重试
          </n-button>
          <n-button @click="goHome">返回首页</n-button>
        </n-space>
      </template>
    </n-result>

    <n-collapse v-if="errorDetail" class="strix-error-boundary__detail">
      <n-collapse-item title="错误详情" name="detail">
        <n-code :code="errorDetail" language="text" word-wrap />
      </n-collapse-item>
    </n-collapse>
  </div>
</template>

<script lang="ts" setup>
import { RotateCcw } from 'lucide-vue-next'
import { useTabsBarStore } from '@/stores/tabs-bar'

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: '页面渲染异常',
    description: '抱歉，该页面遇到了意外错误。您可以尝试刷新页面或返回首页。'
  }
)

const router = useRouter()
const route = useRoute()
const tabsBarStore = useTabsBarStore()

const hasError = ref(false)
const errorDetail = ref('')

onErrorCaptured((err: Error, instance, info) => {
  hasError.value = true
  errorDetail.value = `${err.name}: ${err.message}\n\n来源: ${info}\n\n${err.stack || ''}`

  console.error('[StrixErrorBoundary] 捕获组件错误:', err, '\n组件信息:', info)

  // 阻止错误继续向上传播
  return false
})

const retry = () => {
  hasError.value = false
  errorDetail.value = ''
}

const goHome = () => {
  hasError.value = false
  errorDetail.value = ''
  tabsBarStore.removeTab(route.fullPath)
  router.replace('/')
}
</script>

<style lang="scss" scoped>
.strix-error-boundary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
}

.strix-error-boundary__detail {
  margin-top: 24px;
  max-width: 600px;
  width: 100%;
}
</style>
