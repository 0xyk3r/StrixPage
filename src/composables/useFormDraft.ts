import type { Ref } from 'vue'
import { debounce, isEqual } from 'lodash-es'

interface DraftEntry {
  data: Record<string, any>
  savedAt: number
}

const DRAFT_PREFIX = '$draft:'
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000
const DRAFT_DEBOUNCE_MS = 3000

function buildKey(draftKey: string, type: 'add' | 'edit', editId?: string): string {
  if (type === 'edit' && editId) {
    return `${DRAFT_PREFIX}${draftKey}:edit:${editId}`
  }
  return `${DRAFT_PREFIX}${draftKey}:add`
}

function saveDraftToStorage(key: string, data: Record<string, any>) {
  try {
    const entry: DraftEntry = { data, savedAt: Date.now() }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage 不可用或已满
  }
}

function loadDraftFromStorage(key: string): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry: DraftEntry = JSON.parse(raw)
    if (Date.now() - entry.savedAt > DRAFT_EXPIRY_MS) {
      localStorage.removeItem(key)
      return null
    }
    return entry.data
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

function removeDraft(key: string) {
  localStorage.removeItem(key)
}

/**
 * 表单草稿自动保存
 * 在 useCrud 中通过 draftKey 配置项启用，自动保存编辑中的表单数据到 localStorage，
 * 页面刷新后重新打开表单时提示恢复。
 */
export function useFormDraft(draftKey: string) {
  const dialog = useDialog()

  let stopWatcher: (() => void) | null = null
  let debouncedSave: ReturnType<typeof debounce> | null = null

  /** 开始自动保存（监听表单变化，3 秒防抖写入 localStorage） */
  function startAutoSave(form: Ref<Record<string, any>>, type: 'add' | 'edit', editId?: string) {
    stopAutoSave()
    const key = buildKey(draftKey, type, editId)
    debouncedSave = debounce(() => saveDraftToStorage(key, form.value), DRAFT_DEBOUNCE_MS)
    stopWatcher = watch(form, debouncedSave, { deep: true })
  }

  /** 停止自动保存 */
  function stopAutoSave() {
    debouncedSave?.cancel()
    stopWatcher?.()
    stopWatcher = null
    debouncedSave = null
  }

  /** 检测草稿并提示恢复 */
  function checkAndRestore(form: Ref<Record<string, any>>, type: 'add' | 'edit', editId?: string) {
    const key = buildKey(draftKey, type, editId)
    const draft = loadDraftFromStorage(key)
    if (!draft) return

    if (isEqual(draft, form.value)) {
      removeDraft(key)
      return
    }

    dialog.info({
      title: '发现未提交的草稿',
      content: '检测到上次编辑未提交的表单数据，是否恢复？',
      positiveText: '恢复草稿',
      negativeText: '丢弃',
      onPositiveClick: () => {
        Object.assign(form.value, draft)
      },
      onNegativeClick: () => {
        removeDraft(key)
      }
    })
  }

  /** 清除指定草稿 */
  function clearDraft(type: 'add' | 'edit', editId?: string) {
    removeDraft(buildKey(draftKey, type, editId))
  }

  return { startAutoSave, stopAutoSave, checkAndRestore, clearDraft }
}
