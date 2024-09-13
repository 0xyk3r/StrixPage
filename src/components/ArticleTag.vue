<template>
  <div v-if="!create" class="article-tag-container">
    <div class="article-tag" :style="tagStyle">
      <span class="article-tag-text">{{ model?.label }}</span>
    </div>
  </div>
  <div v-else class="article-tag-container">
    <div class="article-tag-add">
      <span class="article-tag-add-text">点击添加</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { ArticleTagProps } from '@/@types/components/ArticleTag'
import { computed } from 'vue'

const { model, create = false } = defineProps<ArticleTagProps>()

const tagStyle = computed(() => {
  if (create || !model) return ''
  const colorObj = JSON.parse(model.colorParams)
  return `background-image: ${colorObj.colorType}(${colorObj.deg}deg, ${colorObj.startColor} 0%, ${colorObj.endColor} 100%);`
})
</script>
<style lang="scss" scoped>
.article-tag-container {
  display: inline-block;
  margin: 0 5px;
}

.article-tag {
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 90px;
  padding: 0 15px;
  height: 32px;
  background-image: linear-gradient(109deg, #cca8f1 0%, #ec9ab1 100%);
  border-radius: 20.5px;
  cursor: pointer;

  .article-tag-text {
    font-weight: bold;
    font-size: 14px;
    color: #ffffff;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.article-tag-add {
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 90px;
  height: 32px;
  border-radius: 20.5px;
  cursor: pointer;
  text-align: center;
  border: 1px dashed #cccccc;
}
</style>
