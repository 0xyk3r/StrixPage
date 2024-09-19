<template>
  <div>
    <article-tag
      v-for="tag in model"
      :key="tag.key"
      :class="!selectedKeys.includes(tag.key) && mode === 'edit' ? 'article-tag-unselected' : ''"
      :model="tag"
      class="article-tag-list-item"
      @click="clickTag(tag)"
      @contextmenu.prevent.stop="handleTabContextmenu($event, tag.key)"
    />
    <article-tag v-if="mode === 'edit'" create @click="createTag" />

    <n-dropdown
      v-if="mode === 'edit'"
      :options="contextmenuList"
      :show="showRightMenu"
      :x="contextmenuPosition.x"
      :y="contextmenuPosition.y"
      placement="bottom-start"
      trigger="manual"
      @select="handleContextmenuSelect"
      @contextmenu.prevent.stop
    />
  </div>
</template>
<script lang="ts" setup>
import type { ArticleTagModel } from '@/@types/components/ArticleTag'
import type { ArticleTagListProps } from '@/@types/components/ArticleTagList'
import ArticleTag from '@/components/ArticleTag.vue'
import { EventBus } from '@/plugins/event-bus'
import { Icon } from '@iconify/vue'

const model = defineModel<ArticleTagModel[]>()
const { mode = 'show' } = defineProps<ArticleTagListProps>()
const emit = defineEmits(['create', 'edit', 'select-changed'])

const dialog = useDialog()

const selectedKeys = ref<string[]>([])
const clickTag = (tag: ArticleTagModel) => {
  selectedKeys.value = selectedKeys.value.includes(tag.key)
    ? selectedKeys.value.filter((key) => key !== tag.key)
    : [...selectedKeys.value, tag.key]
  emit('select-changed', selectedKeys.value)
}

const createTag = () => {
  model.value?.push({
    key: String(model.value?.length + 1),
    label: '新标签',
    colorParams:
      '{"colorType":"linear-gradient","deg":109,"startColor":"#f093fb","endColor":"#f5576c"}'
  })
}

const showRightMenu = ref()
const contextmenuTagKey = ref('')
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
const handleTabContextmenu = (e: MouseEvent, tagKey: string) => {
  showRightMenu.value = true
  contextmenuPosition.value.x = e.x
  contextmenuPosition.value.y = e.y
  contextmenuTagKey.value = tagKey
}
const handleContextmenuSelect = (key: string) => {
  showRightMenu.value = false
  if (key === 'edit') {
    emit('edit', contextmenuTagKey.value)
  } else if (key === 'delete') {
    dialog.error({
      title: '删除确认',
      content: '确定要删除这个标签吗？该操作不可恢复！',
      positiveText: '确定删除',
      negativeText: '取消',
      onPositiveClick: () => {
        model.value = model.value?.filter((tag) => tag.key !== contextmenuTagKey.value)
      }
    })
  }
}
onMounted(() => {
  // 点击任意地方隐藏右键菜单
  EventBus.on('click-container', () => {
    showRightMenu.value = false
  })
})

const reset = () => {
  selectedKeys.value = []
}
defineExpose({ reset })
</script>
<style lang="scss" scoped>
.article-tag-list-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.article-tag-unselected {
  filter: brightness(0.75);
}
</style>
