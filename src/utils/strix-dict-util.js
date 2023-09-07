import { useDictsStore } from '@/stores/dicts'
import { onMounted, provide, ref } from 'vue'

export function useDict(dictName) {
  const dictsStore = useDictsStore()

  const dict = ref([])

  provide(`${dictName}Dict`, dict)

  onMounted(() => {
    dictsStore.getDictData(`${dictName}`, dict)
  })

  return dict
}
