<template>
  <div>
    <article-tag
      v-for="(tag, index) in model"
      :key="index"
      :model="tag"
      class="article-tag-list-item"
      :class="!selected.includes(tag.value) && mode === 'edit' ? 'article-tag-unselected' : ''"
      @click="selectTag(tag)"
      @contextmenu.prevent.stop="handleTabContextmenu($event, tag.value)"
    />
    <article-tag v-if="mode === 'edit'" :model="{}" create @click="$emits('create')" />

    <n-dropdown
      v-if="mode === 'edit'"
      placement="bottom-start"
      trigger="manual"
      :x="contextmenuPosition.x"
      :y="contextmenuPosition.y"
      :options="contextmenuList"
      :show="showRightMenu"
      @select="handleContextmenuSelect"
      @contextmenu.prevent.stop
    />
  </div>
</template>
<script setup>
import ArticleTag from '@/components/ArticleTag.vue'
import { Icon } from '@iconify/vue'
import { useDialog } from 'naive-ui'
import { getCurrentInstance, h, onMounted, ref } from 'vue'

const { proxy } = getCurrentInstance()
const dialog = useDialog()

defineProps({
  model: { type: Array, required: true },
  mode: { type: String, default: 'show' }
})
const $emits = defineEmits(['create', 'edit', 'delete', 'select-changed'])

const selected = ref([])

const selectTag = (tag) => {
  if (selected.value.includes(tag.value)) {
    selected.value.splice(selected.value.indexOf(tag.value), 1)
  } else {
    selected.value.push(tag.value)
  }
  $emits('select-changed', selected.value)
}

const showRightMenu = ref()
const contextmenuTagValue = ref('')
const contextmenuPosition = ref({ x: 0, y: 0 })
const contextmenuList = [
  {
    key: 'edit',
    label: '编辑标签',
    icon: () => h(Icon, { icon: 'ion:create-outline' })
  },
  {
    key: 'delete',
    label: '删除标签',
    icon: () => h(Icon, { icon: 'ion:close-outline' })
  }
]
const handleTabContextmenu = (e, tagValue) => {
  showRightMenu.value = true
  contextmenuPosition.value.x = e.x
  contextmenuPosition.value.y = e.y
  contextmenuTagValue.value = tagValue
}
const handleContextmenuSelect = (key) => {
  showRightMenu.value = false
  if (key === 'edit') {
    $emits('edit', contextmenuTagValue.value)
  } else if (key === 'delete') {
    dialog.error({
      title: '删除确认',
      content: '确定要删除这个标签吗？该操作不可恢复！',
      positiveText: '确定删除',
      negativeText: '取消',
      onPositiveClick: () => {
        $emits('delete', contextmenuTagValue.value)
      }
    })
  }
}
onMounted(() => {
  // 点击任意地方隐藏右键菜单
  proxy.$EventBus.on('click-container', () => {
    showRightMenu.value = false
  })
})

const reset = () => {
  selected.value = []
}
defineExpose({ reset })
</script>
<style lang="scss" scoped>
.article-tag-list-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.article-tag-unselected {
  filter: brightness(0.6);
}
</style>
