<template>
  <div>
    <n-grid cols="1 l:2 xl:4" item-responsive responsive="screen" x-gap="12" y-gap="24">
      <n-gi v-for="(item, index) in tools" :key="index">
        <n-card class="tool-card" hoverable>
          <template #header>
            <div class="tool-header">
              <StrixIcon :icon="item.icon" :width="32" />
              {{ item.name }}
            </div>
          </template>
          {{ item.description }}
          <template #action>
            <n-button secondary strong type="primary" @click="openTool(item.url)">
              <template #icon>
                <StrixIcon icon="square-arrow-out-up-right" />
              </template>
              打开工具
            </n-button>
          </template>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script lang="ts" setup>
const router = useRouter()

const tools = [
  {
    name: '热度工具',
    description: '用于配置浏览量、人气值等数据的算法，以及查看相应数据的原始数值的工具。',
    icon: 'flame',
    url: '/system/tool/popularity'
  }
]
const openTool = (url: string) => {
  router.push({ path: url })
}
</script>

<style lang="scss" scoped>
.tool-card {
  .tool-header {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 600;
    height: 50px;

    .strix-icon {
      margin-right: 10px;
    }
  }
}
</style>
