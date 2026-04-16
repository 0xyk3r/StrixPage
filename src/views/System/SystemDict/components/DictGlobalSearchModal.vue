<template>
  <n-modal v-model:show="show" preset="card" title="字典全局搜索" style="width: 640px">
    <n-space vertical :size="12">
      <n-input v-model:value="keyword" clearable placeholder="搜索字典键名、名称、数据标签、数据值..." @input="onInput">
        <template #prefix><strix-icon icon="search" :size="16" /></template>
      </n-input>

      <n-spin :show="loading">
        <template v-if="groups.length > 0">
          <div v-for="group in groups" :key="group.type" style="margin-bottom: 12px">
            <n-text strong depth="3" style="font-size: 12px">{{ groupLabel(group.type) }}</n-text>
            <n-list bordered size="small" style="margin-top: 4px">
              <n-list-item v-for="item in group.items" :key="item.dictKey + item.matchText" style="cursor: pointer" @click="handleClick(item)">
                <n-space align="center" :size="8">
                  <n-tag size="tiny" :bordered="false">{{ item.dictKey }}</n-tag>
                  <n-text>{{ item.dictName }}</n-text>
                  <n-text v-if="item.matchText" depth="3" style="font-size: 12px">— {{ item.matchText }}</n-text>
                </n-space>
              </n-list-item>
            </n-list>
          </div>
        </template>
        <n-empty v-else-if="keyword && !loading" description="未找到匹配结果" />
      </n-spin>
    </n-space>
  </n-modal>
</template>

<script lang="ts" setup>
import { dictApi } from '@/api/dict'
import { debounce } from 'lodash-es'

const show = defineModel<boolean>('show', { default: false })
const emit = defineEmits<{ select: [dictKey: string] }>()

const keyword = ref('')
const loading = ref(false)
const results = ref<any[]>([])

interface GroupedResult {
  type: string
  items: any[]
}

const groups = computed<GroupedResult[]>(() => {
  const map = new Map<string, any[]>()
  for (const r of results.value) {
    const type = r.matchType ?? 'OTHER'
    if (!map.has(type)) map.set(type, [])
    map.get(type)!.push(r)
  }
  return Array.from(map.entries()).map(([type, items]) => ({ type, items }))
})

const groupLabelMap: Record<string, string> = {
  DICT_KEY: '字典键名匹配',
  DICT_NAME: '字典名称匹配',
  DATA_LABEL: '数据标签匹配',
  DATA_VALUE: '数据值匹配',
  OTHER: '其他匹配'
}

function groupLabel(type: string) {
  return groupLabelMap[type] || type
}

function handleClick(item: any) {
  emit('select', item.dictKey)
  show.value = false
}

const doSearch = debounce(async () => {
  if (!keyword.value?.trim()) {
    results.value = []
    return
  }
  try {
    loading.value = true
    const { data: res } = await dictApi.globalSearch({ keyword: keyword.value.trim() })
    results.value = res.data?.items ?? res.data ?? []
  } catch (e) {
    console.error('全局搜索失败', e)
  } finally {
    loading.value = false
  }
}, 300)

function onInput() {
  doSearch()
}

watch(show, (val) => {
  if (val) {
    keyword.value = ''
    results.value = []
  }
})
</script>
