import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DesignerTreeNode, WfDefinition, WfDefinitionVersion } from '@/api/workflow'
import { workflowApi } from '@/api/workflow'
import {
  createDefaultTree,
  graphToTree,
  treeToGraph,
  createNode,
  insertNodeAfter,
  removeNode,
  findNode,
} from "@/utils/workflow-graph";
import type { NodeType, WorkflowGraph } from '@/api/workflow'

const MAX_UNDO_STEPS = 50

export const useWorkflowStore = defineStore('workflow', () => {
  // ---- Definition state ----
  const currentDefinition = ref<WfDefinition | null>(null)
  const currentVersion = ref<WfDefinitionVersion | null>(null)

  // ---- Designer tree ----
  const tree = ref<DesignerTreeNode>(createDefaultTree())
  const selectedNodeId = ref<string | null>(null)
  const isDirty = ref(false)

  // ---- Undo/Redo ----
  const undoStack = ref<string[]>([])
  const redoStack = ref<string[]>([])

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null
    return findNode(tree.value, selectedNodeId.value) ?? null
  })

  function pushUndoState() {
    const snapshot = JSON.stringify(tree.value)
    undoStack.value.push(snapshot)
    if (undoStack.value.length > MAX_UNDO_STEPS) {
      undoStack.value.shift()
    }
    redoStack.value = []
    isDirty.value = true
  }

  function undo() {
    if (undoStack.value.length === 0) return
    redoStack.value.push(JSON.stringify(tree.value))
    const prev = undoStack.value.pop()!
    tree.value = JSON.parse(prev)
    isDirty.value = true
  }

  function redo() {
    if (redoStack.value.length === 0) return
    undoStack.value.push(JSON.stringify(tree.value))
    const next = redoStack.value.pop()!
    tree.value = JSON.parse(next)
    isDirty.value = true
  }

  // ---- Node operations ----

  function addNode(afterNodeId: string, type: NodeType) {
    pushUndoState()
    const newNode = createNode(type)
    insertNodeAfter(tree.value, afterNodeId, newNode)
    selectedNodeId.value = newNode.id
  }

  function deleteNode(nodeId: string) {
    pushUndoState()
    removeNode(tree.value, nodeId)
    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null
    }
  }

  function updateNodeConfig(nodeId: string, config: Record<string, any>) {
    pushUndoState()
    const node = findNode(tree.value, nodeId)
    if (node) {
      node.config = { ...node.config, ...config }
    }
  }

  function updateNodeName(nodeId: string, name: string) {
    pushUndoState()
    const node = findNode(tree.value, nodeId)
    if (node) {
      node.name = name
    }
  }

  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId
  }

  // ---- Branch operations ----

  function addBranch(nodeId: string) {
    pushUndoState()
    const node = findNode(tree.value, nodeId)
    if (node && node.branches) {
      const idx = node.branches.length
      const isCondition = node.type === 'CONDITION_GROUP'
      node.branches.push({
        id: crypto.randomUUID(),
        name: isCondition ? `条件 ${idx + 1}` : `分支 ${idx + 1}`,
        sortOrder: idx,
        children: isCondition ? [createNode('CONDITION')] : []
      })
    }
  }

  function removeBranch(nodeId: string, branchId: string) {
    pushUndoState()
    const node = findNode(tree.value, nodeId)
    if (node && node.branches && node.branches.length > 2) {
      node.branches = node.branches.filter((b) => b.id !== branchId);
    }
  }

  // ---- Load/Save ----

  async function loadDefinition(definitionId: string) {
    const { data: res } = await workflowApi.definitionDetail(definitionId)
    currentDefinition.value = res.data

    if (res.data.latestVersionId) {
      const { data: vRes } = await workflowApi.versionDetail(definitionId, res.data.latestVersionId)
      currentVersion.value = vRes.data
      if (vRes.data.graphJson) {
        const graph: WorkflowGraph = JSON.parse(vRes.data.graphJson)
        tree.value = graphToTree(graph)
      } else {
        tree.value = createDefaultTree()
      }
    } else {
      tree.value = createDefaultTree()
      currentVersion.value = null
    }

    undoStack.value = []
    redoStack.value = []
    selectedNodeId.value = null
    isDirty.value = false
  }

  async function saveVersion(changeLog?: string) {
    if (!currentDefinition.value) return
    const graph = treeToGraph(tree.value)
    const { data: res } = await workflowApi.versionSave(currentDefinition.value.id, {
      graphJson: JSON.stringify(graph),
      changeLog
    })
    currentVersion.value = {
      ...currentVersion.value!,
      id: res.data
    }
    isDirty.value = false
    return res.data
  }

  async function publishVersion() {
    if (!currentDefinition.value || !currentVersion.value) return
    await workflowApi.versionPublish(currentDefinition.value.id, currentVersion.value.id)
  }

  function resetDesigner() {
    tree.value = createDefaultTree()
    selectedNodeId.value = null
    undoStack.value = []
    redoStack.value = []
    isDirty.value = false
    currentDefinition.value = null
    currentVersion.value = null
  }

  return {
    currentDefinition,
    currentVersion,
    tree,
    selectedNodeId,
    isDirty,
    canUndo,
    canRedo,
    selectedNode,
    undo,
    redo,
    addNode,
    deleteNode,
    updateNodeConfig,
    updateNodeName,
    selectNode,
    addBranch,
    removeBranch,
    loadDefinition,
    saveVersion,
    publishVersion,
    resetDesigner,
  };
})
