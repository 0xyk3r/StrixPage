<template>
  <div>
    <n-grid cols="1 400:2 800:4">
      <n-grid-item v-for="(item, index) in tools" :key="index">
        <n-card hoverable>
          <template #header>
            <div class="tool-header">
              <Icon :icon="item.icon" :width="32" />
              {{ item.name }}
            </div>
          </template>
          {{ item.description }}
          <template #action>
            <n-button strong secondary type="primary" @click="openTool(item.url)">
              <template #icon>
                <Icon icon="ion:open-outline" />
              </template>
              打开工具
            </n-button>
          </template>
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { NCard } from 'naive-ui'

const router = useRouter()

const tools = [
  {
    name: '热度工具',
    description: '用于配置浏览量、人气值等数据的算法，以及查看相应数据的原始数值的工具。',
    icon: 'ion:flame-outline',
    url: '/system/tool/popularity'
  }
]
const openTool = (url: string) => {
  router.push({ path: url })
}
</script>

<style lang="less" scoped>
.tool-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  height: 50px;

  .iconify {
    margin-right: 10px;
  }
}
</style>
