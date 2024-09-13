import { useDictsStore } from '@/stores/dicts'
import { ref } from 'vue'

const dictsStore = useDictsStore()

export function useDict(dictName: string) {
  const dict = ref([])
  dictsStore.getDictData(dictName, dict)
  return dict
}
