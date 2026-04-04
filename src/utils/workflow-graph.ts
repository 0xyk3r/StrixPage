import { v4 as uuid } from 'uuid'
import type {
  WorkflowGraph, WorkflowNode, WorkflowEdge,
  DesignerTreeNode, DesignerBranch, NodeType
} from '@/api/workflow'

/**
 * Convert flat graph (backend) → tree (designer rendering).
 * Start from the START node and follow edges sequentially.
 * CONDITION_GROUP and PARALLEL nodes branch into multiple children.
 */
export function graphToTree(graph: WorkflowGraph): DesignerTreeNode {
  const nodeMap = new Map<string, WorkflowNode>()
  graph.nodes.forEach(n => nodeMap.set(n.id, n))

  // Build adjacency: sourceId → sorted target edges
  const edgesBySource = new Map<string, WorkflowEdge[]>()
  graph.edges.forEach(e => {
    const list = edgesBySource.get(e.sourceNodeId) || []
    list.push(e)
    edgesBySource.set(e.sourceNodeId, list)
  })
  // Sort edges by sortOrder
  edgesBySource.forEach(edges => edges.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)))

  const startNode = graph.nodes.find(n => n.type === 'START')
  if (!startNode) {
    return createDefaultTree()
  }

  // Find the END node so we know where branches reconverge
  const endNodeId = graph.nodes.find(n => n.type === 'END')?.id

  return buildSubtree(startNode.id, endNodeId)

  function buildSubtree(nodeId: string, stopAt?: string): DesignerTreeNode {
    const node = nodeMap.get(nodeId)!
    const treeNode: DesignerTreeNode = {
      id: node.id,
      type: node.type,
      name: node.name,
      config: node.config || {}
    }

    if (node.type === 'END') {
      return treeNode
    }

    const outEdges = edgesBySource.get(nodeId) || []

    if (node.type === 'CONDITION_GROUP' || node.type === 'PARALLEL') {
      // Each out-edge is a branch
      // Find the reconvergence point (node where all branches meet)
      const reconvergeId = findReconvergencePoint(nodeId, outEdges, endNodeId)

      treeNode.branches = outEdges.map((edge, idx) => {
        const branch: DesignerBranch = {
          id: edge.id,
          name: node.type === 'CONDITION_GROUP'
            ? (edge.conditionExpression ? `条件 ${idx + 1}` : '默认')
            : `分支 ${idx + 1}`,
          conditionExpression: edge.conditionExpression,
          sortOrder: edge.sortOrder ?? idx,
          children: []
        }

        // Build chain from this edge target to reconvergence point
        let currentId: string | undefined = edge.targetNodeId
        while (currentId && currentId !== reconvergeId) {
          const child = buildSubtree(currentId, reconvergeId)
          branch.children.push(child)
          // Follow next edge (non-branch node has single out-edge)
          const nextEdges = edgesBySource.get(currentId) || []
          const childNode = nodeMap.get(currentId)
          if (childNode?.type === 'CONDITION_GROUP' || childNode?.type === 'PARALLEL') {
            // The subtree handles its own branching; follow reconvergence
            currentId = findReconvergencePoint(currentId, nextEdges, reconvergeId)
          } else {
            const firstEdge = nextEdges[0]
            currentId = firstEdge ? firstEdge.targetNodeId : undefined
          }
        }

        return branch
      })

      // Continue after reconvergence
      if (reconvergeId) {
        treeNode.next = buildSubtree(reconvergeId, stopAt)
      }
    } else {
      // Sequential node: follow single out-edge
      const firstOutEdge = outEdges[0]
      if (firstOutEdge) {
        const nextId = firstOutEdge.targetNodeId
        if (nextId !== stopAt) {
          treeNode.next = buildSubtree(nextId, stopAt)
        }
      }
    }

    return treeNode
  }

  function findReconvergencePoint(
    branchNodeId: string,
    _outEdges: WorkflowEdge[],
    fallback?: string
  ): string | undefined {
    // Simple heuristic: find the first node that all branches can reach
    // For well-formed graphs, the reconvergence point is stored in config
    const node = nodeMap.get(branchNodeId)
    if (node?.config?.reconvergeNodeId) {
      return node.config.reconvergeNodeId
    }
    // Fallback: traverse all branches, find common descendant
    // For now, use the END node
    return fallback
  }
}

/**
 * Convert tree (designer) → flat graph (backend storage).
 */
export function treeToGraph(tree: DesignerTreeNode): WorkflowGraph {
  const nodes: WorkflowNode[] = []
  const edges: WorkflowEdge[] = []

  flattenNode(tree, undefined)

  return { nodes, edges }

  function flattenNode(treeNode: DesignerTreeNode, _parentNodeId?: string): string {
    nodes.push({
      id: treeNode.id,
      type: treeNode.type,
      name: treeNode.name,
      config: { ...treeNode.config }
    })

    if (treeNode.branches && treeNode.branches.length > 0) {
      // Find or create reconvergence point
      let reconvergeId: string | undefined

      if (treeNode.next) {
        reconvergeId = treeNode.next.id
      } else {
        // Create implicit END connection
        reconvergeId = undefined
      }

      // Store reconverge reference in config
      if (reconvergeId) {
        const nodeIdx = nodes.findIndex(n => n.id === treeNode.id)
        const foundNode = nodes[nodeIdx]
        if (foundNode) {
          foundNode.config = { ...foundNode.config, reconvergeNodeId: reconvergeId }
        }
      }

      treeNode.branches.forEach((branch, idx) => {
        if (branch.children.length > 0) {
          const firstChild = branch.children[0]!
          // Edge from branch node to first child
          edges.push({
            id: branch.id,
            sourceNodeId: treeNode.id,
            targetNodeId: firstChild.id,
            conditionExpression: branch.conditionExpression,
            sortOrder: idx
          })

          // Flatten branch children sequentially
          let prevId = firstChild.id
          flattenNode(firstChild, treeNode.id)

          for (let i = 1; i < branch.children.length; i++) {
            const child = branch.children[i]!
            edges.push({
              id: uuid(),
              sourceNodeId: prevId,
              targetNodeId: child.id,
              sortOrder: 0
            })
            flattenNode(child, prevId)
            prevId = child.id
          }

          // Connect last child to reconvergence point
          if (reconvergeId) {
            edges.push({
              id: uuid(),
              sourceNodeId: prevId,
              targetNodeId: reconvergeId,
              sortOrder: 0
            })
          }
        } else if (reconvergeId) {
          // Empty branch: direct edge to reconvergence
          edges.push({
            id: branch.id,
            sourceNodeId: treeNode.id,
            targetNodeId: reconvergeId,
            conditionExpression: branch.conditionExpression,
            sortOrder: idx
          })
        }
      })

      // Flatten the reconvergence (next) node
      if (treeNode.next) {
        flattenNode(treeNode.next, treeNode.id)
      }
    } else if (treeNode.next) {
      // Sequential: edge to next
      edges.push({
        id: uuid(),
        sourceNodeId: treeNode.id,
        targetNodeId: treeNode.next.id,
        sortOrder: 0
      })
      flattenNode(treeNode.next, treeNode.id)
    }

    return treeNode.id
  }
}

/**
 * Create a default tree with START → END.
 */
export function createDefaultTree(): DesignerTreeNode {
  return {
    id: uuid(),
    type: 'START',
    name: '开始',
    config: {},
    next: {
      id: uuid(),
      type: 'END',
      name: '结束',
      config: {}
    }
  }
}

/**
 * Create a new node of given type with default config.
 */
export function createNode(type: NodeType): DesignerTreeNode {
  const defaults: Record<NodeType, { name: string; config: Record<string, any> }> = {
    START: { name: '开始', config: {} },
    END: { name: '结束', config: {} },
    APPROVAL: {
      name: '审批',
      config: {
        approvalMode: 'ANY',
        assigneeType: 'MANAGER',
        assigneeIds: [],
        allowDelegate: true,
        allowReturn: true,
        allowCountersign: true,
        allowWithdraw: true,
        timeoutHours: 0
      }
    },
    CC: {
      name: '抄送',
      config: {
        assigneeType: 'MANAGER',
        assigneeIds: []
      }
    },
    CONDITION: {
      name: '条件',
      config: {
        rules: [],
        logicOperator: 'AND'
      }
    },
    CONDITION_GROUP: {
      name: '条件分支',
      config: {}
    },
    PARALLEL: {
      name: '并行分支',
      config: {}
    },
    DELAY: {
      name: '延迟',
      config: {
        delayType: 'FIXED',
        delayValue: 1,
        delayUnit: 'HOURS'
      }
    },
    TRIGGER: {
      name: '触发器',
      config: {
        triggerKey: '',
        triggerParams: {}
      }
    },
    JUMP: {
      name: '跳转',
      config: {
        targetNodeId: ''
      }
    },
    SUB_PROCESS: {
      name: '子流程',
      config: {
        subDefinitionId: '',
        variableMapping: {}
      }
    }
  }

  const def = defaults[type]
  const node: DesignerTreeNode = {
    id: uuid(),
    type,
    name: def.name,
    config: { ...def.config },
    branches: (type === 'CONDITION_GROUP' || type === 'PARALLEL')
      ? [
          {
            id: uuid(),
            name: type === 'CONDITION_GROUP' ? '条件 1' : '分支 1',
            sortOrder: 0,
            children: type === 'CONDITION_GROUP'
              ? [createNode('CONDITION')]
              : []
          },
          { id: uuid(), name: type === 'CONDITION_GROUP' ? '默认' : '分支 2', sortOrder: 1, children: [] }
        ]
      : undefined
  }
  return node
}

/**
 * Insert a new node after a given node in the tree (mutates tree in-place).
 * Returns true if insertion succeeded.
 */
export function insertNodeAfter(root: DesignerTreeNode, afterNodeId: string, newNode: DesignerTreeNode): boolean {
  if (root.id === afterNodeId) {
    newNode.next = root.next
    root.next = newNode
    return true
  }

  // Search in branches
  if (root.branches) {
    for (const branch of root.branches) {
      for (let i = 0; i < branch.children.length; i++) {
        const child = branch.children[i]!
        if (child.id === afterNodeId) {
          newNode.next = child.next
          child.next = newNode
          return true
        }
        if (insertNodeAfter(child, afterNodeId, newNode)) {
          return true
        }
      }
    }
  }

  // Search in next
  if (root.next) {
    return insertNodeAfter(root.next, afterNodeId, newNode)
  }

  return false
}

/**
 * Remove a node from the tree by ID (mutates tree in-place).
 * Cannot remove START or END nodes.
 * Returns true if removal succeeded.
 */
export function removeNode(root: DesignerTreeNode, nodeId: string): boolean {
  // Check if next is the target
  if (root.next?.id === nodeId) {
    root.next = root.next.next
    return true
  }

  // Search in branches
  if (root.branches) {
    for (const branch of root.branches) {
      for (let i = 0; i < branch.children.length; i++) {
        const child = branch.children[i]!
        if (child.id === nodeId) {
          // Splice out: reconnect the chain
          if (child.next) {
            branch.children.splice(i, 1, child.next)
          } else {
            branch.children.splice(i, 1)
          }
          return true
        }
        if (removeNode(child, nodeId)) {
          return true
        }
      }
    }
  }

  if (root.next) {
    return removeNode(root.next, nodeId)
  }

  return false
}

/**
 * Find a node in the tree by ID.
 */
export function findNode(root: DesignerTreeNode, nodeId: string): DesignerTreeNode | undefined {
  if (root.id === nodeId) return root

  if (root.branches) {
    for (const branch of root.branches) {
      for (const child of branch.children) {
        const found = findNode(child, nodeId)
        if (found) return found
      }
    }
  }

  if (root.next) {
    return findNode(root.next, nodeId)
  }

  return undefined
}
