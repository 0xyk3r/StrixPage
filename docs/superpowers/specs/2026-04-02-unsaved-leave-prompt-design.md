# 未保存离开提示 — 设计文档

## 概述

为 `useCrud` 管理的所有表单弹窗增加"未保存离开提示"功能：当用户编辑表单后尝试关闭弹窗（X 按钮、遮罩点击、Esc 键、取消按钮），若表单有修改则弹出确认对话框，防止误操作丢失数据。

该功能与现有的草稿自动保存（`useFormDraft`）协同生效：
- **草稿自动保存** = 被动安全网（后台每 3 秒写入 localStorage）
- **未保存离开提示** = 主动防护（关闭前警告用户）

## 核心机制

### 脏检测

在 `useCrud` 中增加表单快照（snapshot），用于判断表单是否被用户修改：

```ts
const addFormSnapshot = ref<Record<string, any>>({})
const editFormSnapshot = ref<Record<string, any>>({})
```

**快照时机：** `showAdd()` / `showEdit()` 中，所有初始化完成后（初始值设置、草稿恢复）、弹窗打开前拍摄快照。

```ts
// showAdd 中：
addForm.value = cloneDeep(initAddForm)
if (initialValues) Object.assign(addForm.value, initialValues)
await hooks?.beforeShowAdd?.()
if (draft) await draft.checkAndRestore(addForm, 'add')
addFormSnapshot.value = cloneDeep(addForm.value) // ← 快照
addModal.value = true

// showEdit 中：
editForm.value = pick(res.data, canUpdateFields)
hooks?.afterShowEdit?.(res.data)
if (draft) await draft.checkAndRestore(editForm, 'edit', id)
editFormSnapshot.value = cloneDeep(editForm.value) // ← 快照
editModal.value = true
```

**脏检测逻辑：** `!isEqual(form.value, snapshot.value)`，使用 lodash `isEqual` 深度比较。

### 关闭拦截

新增 `tryCloseAdd()` / `tryCloseEdit()` 异步方法，替代直接设置 `modal = false`：

```ts
const tryCloseAdd = async () => {
  if (!isEqual(addForm.value, addFormSnapshot.value)) {
    const confirmed = await confirmLeave(!!draft)
    if (!confirmed) return
  }
  addModal.value = false
}

const tryCloseEdit = async () => {
  if (!isEqual(editForm.value, editFormSnapshot.value)) {
    const confirmed = await confirmLeave(!!draft)
    if (!confirmed) return
  }
  editModal.value = false
}
```

### 确认对话框

根据是否启用了草稿功能，显示不同的提示文案：

```ts
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
      onMaskClick: () => resolve(false),
    })
  })
}
```

## 视图模板改动

所有使用 `useCrud` 的视图中，`n-modal` 绑定方式统一调整：

```vue
<!-- 之前 -->
<n-modal v-model:show="addModal" @after-leave="resetForms">
  ...
  <n-button @click="addModal = false">取消</n-button>

<!-- 之后 -->
<n-modal :show="addModal" @update:show="tryCloseAdd" @after-leave="resetForms">
  ...
  <n-button @click="tryCloseAdd">取消</n-button>
```

**原理：**
- 将 `v-model:show` 拆分为 `:show`（单向绑定）+ `@update:show`（拦截关闭）
- Naive UI 的 X 按钮、遮罩点击、Esc 键都通过 `update:show` 事件通知关闭意图
- 我们拦截该事件，执行脏检查后才决定是否真正关闭
- `submitAdd()` / `submitEdit()` 通过 `resetForms()` 直接设置 `modal = false`，不会触发 `update:show`

## 影响范围

### 需要改动的视图（15 个，共 28 个弹窗）

| 视图文件 | addModal | editModal | 有 draftKey |
|----------|----------|-----------|------------|
| SystemWorkflowConfigIndex.vue | ✅ | ✅ | ✅ |
| SystemUserIndex.vue | — | ✅ | ✅ |
| SystemRoleIndex.vue | ✅ | ✅ | ✅ |
| SystemRegionIndex.vue | ✅ | ✅ | ✅ |
| SystemModuleSmsIndex.vue | ✅ | ✅ | ✅ |
| SystemModuleOssIndex.vue | ✅ | ✅ | ✅ |
| SystemModuleOssFileGroup.vue | ✅ | ✅ | ✅ |
| SystemModuleOssBucket.vue | ✅ | — | ✅ |
| SystemModuleJobIndex.vue | ✅ | ✅ | ✅ |
| SystemDictData.vue | ✅ | ✅ | ✅ |
| SystemDictIndex.vue | ✅ | ✅ | ✅ |
| SystemMenuIndex.vue | ✅ | ✅ | ✅ |
| SystemManagerIndex.vue | ✅ | ✅ | ✅ |

### 不需要改动的视图（9 个纯列表页，无弹窗）

SystemWorkflowTaskUnfinished/Initiated/Finished/CC、SystemModuleSmsTemplate/Sign/Log、SystemMonitorLogIndex、SystemModuleOssFile

### 非标弹窗（不在本次范围）

- SystemRoleIndex: `editRoleMenusModalShow`（角色菜单权限编辑）
- SystemModuleOssFileGroup: `uploadModalShow`（文件上传）
- 这些自定义弹窗不通过 useCrud 管理，不受影响

## useCrud 改动汇总

1. 新增 `addFormSnapshot` / `editFormSnapshot` ref
2. 在 `showAdd()` 和 `showEdit()` 中拍快照
3. 新增 `confirmLeave()` 内部方法
4. 新增 `tryCloseAdd()` / `tryCloseEdit()` 公开方法
5. 返回值增加 `tryCloseAdd`、`tryCloseEdit`
6. 新增 `useDialog()` 调用（用于确认对话框）

## 边界情况

| 场景 | 行为 |
|------|------|
| 表单无修改直接关闭 | 跳过提示，直接关闭 |
| 恢复草稿后未再编辑 | 快照 = 恢复后数据，判定为无修改 → 直接关闭 |
| 提交成功 | `resetForms()` 直接关闭，不触发 tryClose |
| ESC 键 | Naive UI 触发 `update:show`，走 tryClose 流程 |
| 有草稿 + 离开 | 提示"已自动暂存"，下次打开可恢复 |
| 无草稿 + 离开 | 提示"更改将丢失"，用户确认后关闭 |
| initialValues 预填 | 快照包含预填数据，预填本身不算"脏" |
