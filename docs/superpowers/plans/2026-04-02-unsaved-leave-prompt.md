# Unsaved Leave Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an unsaved-changes confirmation dialog when users try to close CRUD form modals with pending edits.

**Architecture:** Centralized dirty detection + close interception in `useCrud`. Form snapshots are taken after all initialization (initial values, draft restoration) completes. `tryCloseAdd()` / `tryCloseEdit()` replace direct modal toggles in all 13 view templates.

**Tech Stack:** Vue 3 Composition API, Naive UI `useDialog`, lodash `isEqual` / `cloneDeep`

**Verification:** `pnpm build` (includes `vue-tsc` type-check)

---

### Task 1: Add unsaved-leave logic to useCrud

**Files:**
- Modify: `src/composables/useCrud.ts`

- [ ] **Step 1: Add `isEqual` to lodash import**

Change line 2 from:
```ts
import { cloneDeep, pick } from 'lodash-es'
```
to:
```ts
import { cloneDeep, isEqual, pick } from 'lodash-es'
```

- [ ] **Step 2: Add snapshot refs after existing form refs**

After line 88 (`const editFormRef = ref<FormInst | null>(null)`), add:

```ts
// ===== 表单快照（用于脏检测） =====
const addFormSnapshot = ref<Record<string, any>>({})
const editFormSnapshot = ref<Record<string, any>>({})
```

- [ ] **Step 3: Add `confirmLeave` and `tryClose` methods**

After the `resetForms` function (after line 103), add:

```ts
// ===== 未保存离开提示 =====
const dialog = useDialog()

const confirmLeave = (hasDraft: boolean): Promise<boolean> => {
  return new Promise((resolve) => {
    dialog.warning({
      title: '确认离开',
      content: hasDraft
        ? '表单数据已自动暂存，下次打开时可以恢复。确定要离开吗？'
        : '你有未保存的更改，离开后将丢失。确定要离开吗？',
      positiveText: '离开',
      negativeText: '继续编辑',
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false),
      onClose: () => resolve(false),
      onMaskClick: () => resolve(false)
    })
  })
}

/** 尝试关闭新增弹窗（有未保存更改时弹出确认） */
const tryCloseAdd = async () => {
  if (!isEqual(addForm.value, addFormSnapshot.value)) {
    const confirmed = await confirmLeave(!!draft)
    if (!confirmed) return
  }
  addModal.value = false
}

/** 尝试关闭编辑弹窗（有未保存更改时弹出确认） */
const tryCloseEdit = async () => {
  if (!isEqual(editForm.value, editFormSnapshot.value)) {
    const confirmed = await confirmLeave(!!draft)
    if (!confirmed) return
  }
  editModal.value = false
}
```

- [ ] **Step 4: Add snapshot capture in `showAdd`**

In `showAdd`, add snapshot line before `addModal.value = true`. The function becomes:

```ts
const showAdd = async (initialValues?: Record<string, any>) => {
  if (initAddForm) addForm.value = cloneDeep(initAddForm)
  if (initialValues && !(initialValues instanceof Event)) Object.assign(addForm.value, initialValues)
  await hooks?.beforeShowAdd?.()
  if (draft) await draft.checkAndRestore(addForm, 'add')
  addFormSnapshot.value = cloneDeep(addForm.value)
  addModal.value = true
  if (draft) draft.startAutoSave(addForm, 'add')
}
```

- [ ] **Step 5: Add snapshot capture in `showEdit`**

In `showEdit`, add snapshot line before `editModal.value = true`. The function becomes:

```ts
const showEdit = async (id: string) => {
  if (!api?.detail) return
  editLoading.value = true
  try {
    await hooks?.beforeShowEdit?.(id)
    const { data: res } = await api.detail(id)
    editId.value = id
    if (initEditForm) {
      const canUpdateFields = Object.keys(initEditForm)
      editForm.value = pick(res.data, canUpdateFields)
    } else {
      editForm.value = res.data
    }
    hooks?.afterShowEdit?.(res.data)
    if (draft) await draft.checkAndRestore(editForm, 'edit', id)
    editFormSnapshot.value = cloneDeep(editForm.value)
    editModal.value = true
    if (draft) draft.startAutoSave(editForm, 'edit', id)
  } finally {
    editLoading.value = false
  }
}
```

- [ ] **Step 6: Add `tryCloseAdd` and `tryCloseEdit` to return object**

Add to the return object after `resetForms`:

```ts
return {
  // ... existing entries ...
  resetForms,
  tryCloseAdd,
  tryCloseEdit,
  // ... existing entries ...
}
```

- [ ] **Step 7: Run build to verify**

Run: `pnpm build`
Expected: Build passes with no type errors.

- [ ] **Step 8: Commit**

```bash
git add src/composables/useCrud.ts
git commit -m "feat: add unsaved leave prompt to useCrud

Add tryCloseAdd/tryCloseEdit methods with dirty detection via
form snapshots. Shows confirmation dialog when closing modals
with pending edits. Different messages for draft-enabled vs
non-draft views.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 2: Update view templates — add modal + edit modal bindings

**Files (13 views):**
- Modify: `src/views/System/Workflow/Config/SystemWorkflowConfigIndex.vue`
- Modify: `src/views/System/SystemUser/SystemUserIndex.vue`
- Modify: `src/views/System/SystemRole/SystemRoleIndex.vue`
- Modify: `src/views/System/SystemRegion/SystemRegionIndex.vue`
- Modify: `src/views/System/SystemModule/Sms/SystemModuleSmsIndex.vue`
- Modify: `src/views/System/SystemModule/Oss/SystemModuleOssIndex.vue`
- Modify: `src/views/System/SystemModule/Oss/SystemModuleOssFileGroup.vue`
- Modify: `src/views/System/SystemModule/Oss/SystemModuleOssBucket.vue`
- Modify: `src/views/System/SystemModule/Job/SystemModuleJobIndex.vue`
- Modify: `src/views/System/SystemDict/SystemDictData.vue`
- Modify: `src/views/System/SystemDict/SystemDictIndex.vue`
- Modify: `src/views/System/SystemMenu/SystemMenuIndex.vue`
- Modify: `src/views/System/SystemManager/SystemManagerIndex.vue`

Each view needs exactly 3 types of changes:

**Change A — Destructuring:** Add `tryCloseAdd` and/or `tryCloseEdit` to the `useCrud()` destructuring.

**Change B — Modal binding:** Replace `v-model:show="addModal"` with `:show="addModal" @update:show="tryCloseAdd"` (same pattern for editModal → tryCloseEdit).

**Change C — Cancel button:** Replace `@click="addModal = false"` with `@click="tryCloseAdd"` (same for editModal → tryCloseEdit).

---

- [ ] **Step 1: Update all 13 views**

Apply the following changes per file. Each file gets Change A + B + C as applicable:

**1. SystemWorkflowConfigIndex.vue**
- Destructuring: add `tryCloseAdd, tryCloseEdit` after `resetForms`
- Line 70: `v-model:show="addModal"` → `:show="addModal" @update:show="tryCloseAdd"`
- Line 91: `@click="addModal = false"` → `@click="tryCloseAdd"`
- Line 98: `v-model:show="editModal"` → `:show="editModal" @update:show="tryCloseEdit"`
- Line 121: `@click="editModal = false"` → `@click="tryCloseEdit"`

**2. SystemUserIndex.vue** _(editModal only)_
- Destructuring: add `tryCloseEdit` after `resetForms`
- Line 62: `v-model:show="editModal"` → `:show="editModal" @update:show="tryCloseEdit"`
- Line 97: `@click="editModal = false"` → `@click="tryCloseEdit"`

**3. SystemRoleIndex.vue**
- Destructuring: add `tryCloseAdd, tryCloseEdit` after `resetForms`
- Line 54: `v-model:show="addModal"` → `:show="addModal" @update:show="tryCloseAdd"`
- Line 83: `@click="addModal = false"` → `@click="addModal = false"` → `@click="tryCloseAdd"`
- Line 90: `v-model:show="editModal"` → `:show="editModal" @update:show="tryCloseEdit"`
- Line 121: `@click="editModal = false"` → `@click="tryCloseEdit"`

**4. SystemRegionIndex.vue**
- Destructuring: add `tryCloseAdd, tryCloseEdit` after `resetForms`
- Line 53: `v-model:show="addModal"` → `:show="addModal" @update:show="tryCloseAdd"`
- Line 97: `@click="addModal = false"` → `@click="tryCloseAdd"`
- Line 104: `v-model:show="editModal"` → `:show="editModal" @update:show="tryCloseEdit"`
- Line 150: `@click="editModal = false"` → `@click="tryCloseEdit"`

**5. SystemModuleSmsIndex.vue**
- Destructuring: add `tryCloseAdd, tryCloseEdit` after `resetForms`
- Line 55: `v-model:show="addModal"` → `:show="addModal" @update:show="tryCloseAdd"`
- Line 107: `@click="addModal = false"` → `@click="tryCloseAdd"`
- Line 114: `v-model:show="editModal"` → `:show="editModal" @update:show="tryCloseEdit"`
- Line 172: `@click="editModal = false"` → `@click="tryCloseEdit"`

**6. SystemModuleOssIndex.vue**
- Destructuring: add `tryCloseAdd, tryCloseEdit` after `resetForms`
- Line 55: `v-model:show="addModal"` → `:show="addModal" @update:show="tryCloseAdd"`
- Line 113: `@click="addModal = false"` → `@click="tryCloseAdd"`
- Line 120: `v-model:show="editModal"` → `:show="editModal" @update:show="tryCloseEdit"`
- Line 184: `@click="editModal = false"` → `@click="tryCloseEdit"`

**7. SystemModuleOssFileGroup.vue**
- Destructuring: add `tryCloseAdd, tryCloseEdit` after `resetForms`
- Line 66: `v-model:show="addModal"` → `:show="addModal" @update:show="tryCloseAdd"`
- Line 140: `@click="addModal = false"` → `@click="tryCloseAdd"`
- Line 147: `v-model:show="editModal"` → `:show="editModal" @update:show="tryCloseEdit"`
- Line 209: `@click="editModal = false"` → `@click="tryCloseEdit"`

**8. SystemModuleOssBucket.vue** _(addModal only)_
- Destructuring: add `tryCloseAdd` after `resetForms`
- Line 63: `v-model:show="addModal"` → `:show="addModal" @update:show="tryCloseAdd"`
- Line 92: `@click="addModal = false"` → `@click="tryCloseAdd"`

**9. SystemModuleJobIndex.vue**
- Destructuring: add `tryCloseAdd, tryCloseEdit` after `resetForms`
- Line 49: `v-model:show="addModal"` → `:show="addModal" @update:show="tryCloseAdd"`
- Line 103: `@click="addModal = false"` → `@click="tryCloseAdd"`
- Line 110: `v-model:show="editModal"` → `:show="editModal" @update:show="tryCloseEdit"`
- Line 163: `@click="editModal = false"` → `@click="tryCloseEdit"`

**10. SystemDictData.vue**
- Destructuring: add `tryCloseAdd, tryCloseEdit` after `resetForms`
- Line 63: `v-model:show="addModal"` → `:show="addModal" @update:show="tryCloseAdd"`
- Line 117: `@click="addModal = false"` → `@click="tryCloseAdd"`
- Line 124: `v-model:show="editModal"` → `:show="editModal" @update:show="tryCloseEdit"`
- Line 180: `@click="editModal = false"` → `@click="tryCloseEdit"`

**11. SystemDictIndex.vue**
- Destructuring: add `tryCloseAdd, tryCloseEdit` after `resetForms`
- Line 72: `v-model:show="addModal"` → `:show="addModal" @update:show="tryCloseAdd"`
- Line 123: `@click="addModal = false"` → `@click="tryCloseAdd"`
- Line 130: `v-model:show="editModal"` → `:show="editModal" @update:show="tryCloseEdit"`
- Line 183: `@click="editModal = false"` → `@click="tryCloseEdit"`

**12. SystemMenuIndex.vue**
- Destructuring: add `tryCloseAdd, tryCloseEdit` after `resetForms`
- Line 50: `v-model:show="addModal"` → `:show="addModal" @update:show="tryCloseAdd"`
- Line 143: `@click="addModal = false"` → `@click="tryCloseAdd"`
- Line 150: `v-model:show="editModal"` → `:show="editModal" @update:show="tryCloseEdit"`
- Line 245: `@click="editModal = false"` → `@click="tryCloseEdit"`

**13. SystemManagerIndex.vue**
- Destructuring: add `tryCloseAdd, tryCloseEdit` after `resetForms`
- Line 83: `v-model:show="addModal"` → `:show="addModal" @update:show="tryCloseAdd"`
- Line 155: `@click="addModal = false"` → `@click="tryCloseAdd"`
- Line 162: `v-model:show="editModal"` → `:show="editModal" @update:show="tryCloseEdit"`
- Line 236: `@click="editModal = false"` → `@click="tryCloseEdit"`

- [ ] **Step 2: Run build to verify**

Run: `pnpm build`
Expected: Build passes with no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/views/
git commit -m "feat: wire unsaved leave prompt in all CRUD views

Update 13 view templates:
- Replace v-model:show with :show + @update:show interceptor
- Replace cancel button @click='modal = false' with tryCloseAdd/tryCloseEdit
- Add tryCloseAdd/tryCloseEdit to useCrud destructuring

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 3: Browser verification

- [ ] **Step 1: Open a CRUD page with draftKey (e.g., /system/dict)**

Navigate to `http://localhost:13232/system/dict` in browser.

- [ ] **Step 2: Test dirty close — add modal**

1. Click "添加系统字典" to open the add modal
2. Type something in a form field
3. Click the X button on the modal
4. **Expected:** Warning dialog appears: "表单数据已自动暂存，下次打开时可以恢复。确定要离开吗？"
5. Click "继续编辑" → modal stays open with form data intact
6. Click X again → click "离开" → modal closes

- [ ] **Step 3: Test clean close — add modal**

1. Click "添加系统字典" to open the add modal
2. Do NOT modify any field
3. Click X or "取消"
4. **Expected:** Modal closes immediately with no prompt

- [ ] **Step 4: Test dirty close — edit modal**

1. Click edit on an existing dict entry
2. Modify a field value
3. Click "取消"
4. **Expected:** Warning dialog appears
5. Click "离开" → modal closes

- [ ] **Step 5: Test Esc key**

1. Open add modal, type something
2. Press Escape key
3. **Expected:** Warning dialog appears (same as X button)

- [ ] **Step 6: Test submit path (no prompt)**

1. Open add modal, fill all required fields
2. Click "确定" to submit
3. **Expected:** Modal closes after submit, NO unsaved prompt appears
