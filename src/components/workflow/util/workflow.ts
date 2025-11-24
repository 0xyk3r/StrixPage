import '@/assets/style/components/workflow.scss'
import WorkflowConditionsNode from '@/components/workflow/WorkflowConditionsNode.vue'
import WorkflowNode from '@/components/workflow/WorkflowNode.vue'
import { createStrixMessage } from '@/utils/strix-message'
import { cloneDeep } from 'lodash'

export type WorkflowNodeType =
  | 'root'
  | 'approval'
  | 'task'
  | 'conditions'
  | 'condition'
  | 'cc'
  | 'empty'

export interface WorkflowNode {
  id: string
  name: string
  desc: string
  type: WorkflowNodeType
  props: any
  parentId: string
  parentType: string
  conditionsId: string | null
  branches: WorkflowNode[]
}

/**
 * 节点类型映射
 */
export const nodeTypeMap: { [key: string]: any } = {
  root: {
    name: '发起人',
    removable: false,
    configurable: false,
    icon: 'user'
  },
  approval: {
    name: '审批人',
    operationName: '审批',
    removable: true,
    configurable: true,
    icon: 'user-check',
    defaultProps: {
      assign: {
        type: 'USER',
        id: [],
        mode: 'ALL'
      },
      timeLimit: {
        value: 48,
        unit: 'HOUR',
        handler: 'NOTIFY'
      },
      reject: {
        type: 'END',
        nodeId: ''
      }
    }
  },
  task: {
    name: '办理人',
    operationName: '办理',
    removable: true,
    configurable: true,
    icon: 'user-round-check',
    defaultProps: {
      assign: {
        type: 'USER',
        id: [],
        mode: 'ALL'
      },
      timeLimit: {
        value: 24,
        unit: 'HOUR',
        handler: 'NOTIFY'
      }
    }
  },
  condition: {
    name: '条件节点',
    operationName: '条件',
    removable: true,
    configurable: true,
    icon: 'split',
    defaultProps: {
      type: 'AND',
      groups: [
        {
          type: 'AND',
          conditions: []
        }
      ]
    }
  },
  cc: {
    name: '抄送人',
    operationName: '抄送',
    removable: true,
    configurable: true,
    icon: 'send',
    defaultProps: {
      assign: {
        type: 'USER',
        id: [],
        mode: 'ALL'
      },
      allowAdd: false
    }
  },
  empty: {
    name: '空节点',
    removable: false,
    configurable: false,
    icon: 'square-dashed'
  }
}

/**
 * 随机生成id
 * @returns 随机生成的id
 */
const generateRandomId = () => {
  return Math.random().toString(36).substring(2)
}

/**
 * 获取根节点
 * @param {*} nodes 节点集
 * @returns 根节点
 */
const getRootNode = (nodes: WorkflowNode[]) => {
  return nodes.find((node) => node.type === 'root')
}

/**
 * 根据传入的节点id, 获取该节点的子节点
 * @param {*} nodes 节点集
 * @param {*} nodeId 节点id
 * @returns 子节点
 */
const getChildrenNode = (nodes: WorkflowNode[], nodeId: string) => {
  return nodes.find((node) => node.parentId === nodeId)
}

/**
 * 根据传入的节点id, 递归获取该节点的所有子节点
 * @param {*} nodes 节点集
 * @param {*} nodeId 节点id
 * @returns 所有子节点
 */
const getAllChildrenNode = (nodes: WorkflowNode[], nodeId: string): WorkflowNode[] => {
  const children = getChildrenNode(nodes, nodeId)
  if (!children) {
    return []
  }
  return [children, ...getAllChildrenNode(nodes, children.id)]
}

/**
 * 根据传入的节点id, 获取该节点
 * @param {*} nodes 节点集
 * @param {*} nodeId 节点id
 * @returns 节点id对应的节点
 */
const getNodeById = (nodes: WorkflowNode[], nodeId: string) => {
  return nodes.find((node) => node.id === nodeId)
}

/**
 * 获取条件节点使用的节点ID
 * @param {*} nodes 节点数组
 * @param {*} node 节点
 * @returns 使用的节点ID数组
 */
const getConditionUsedNode = (nodes: WorkflowNode[], node: WorkflowNode): string[] => {
  const usedNodeIds = new Set<string>()
  const branchStartIds = node.branches.map((branch) => branch.id)

  branchStartIds.forEach((nodeId) => {
    usedNodeIds.add(nodeId)
    getAllChildrenNode(nodes, nodeId)?.forEach((node) => {
      usedNodeIds.add(node.id)
    })
  })

  return Array.from(usedNodeIds)
}

/**
 * 渲染节点
 * @param {*} nodes 节点集
 * @param {*} node 节点
 * @returns 渲染后组件
 */
const renderNode = (nodes: WorkflowNode[], node: WorkflowNode) => {
  const children = getChildrenNode(nodes, node.id)
  const isConditionsNode = node.type === 'conditions'

  return h(
    isConditionsNode ? WorkflowConditionsNode : WorkflowNode,
    {
      modelValue: node,
      onUpdateModelValue: (value: WorkflowNode) => {
        node = value
      },
      onAddNode: (type) => {
        handleAddChildren(nodes, node, type)
      },
      onRemoveNode: () => {
        handleRemoveChildren(nodes, node)
      }
    },
    {
      default: () => {
        if (!children) {
          return h('div', { class: 'wf-node-main node-end' }, { default: () => '流程 / 分支结束' })
        }
        return renderNode(nodes, children)
      },
      ...(isConditionsNode && {
        branches: () => {
          return node.branches?.map((branchNode) => renderNode(nodes, branchNode))
        }
      })
    }
  )
}

/**
 * 添加子节点
 * @param {Array} nodes 节点集
 * @param {Object} parentNode  父节点
 * @param {string} type  添加的节点类型
 */
const handleAddChildren = (
  nodes: WorkflowNode[],
  parentNode: WorkflowNode,
  type: WorkflowNodeType
) => {
  const oldChildren = getChildrenNode(nodes, parentNode.id)
  const newNodeId = generateRandomId()
  // 深拷贝默认属性, 避免修改默认属性
  const defaultProps = cloneDeep(nodeTypeMap[type]?.defaultProps || {})

  // 记录条件分支的主节点ID
  const conditionsId = type === 'condition' ? parentNode.id : parentNode.conditionsId || null

  const newNode: WorkflowNode = {
    id: newNodeId,
    name: '新' + getTypeName(type),
    desc: '新' + getTypeName(type) + '...',
    type,
    props: defaultProps,
    parentId: parentNode.id,
    parentType: parentNode.type,
    conditionsId,
    branches: []
  }

  if (type === 'condition') {
    // 处理添加条件节点
    if (!parentNode.branches) {
      parentNode.branches = []
    }
    newNode.name = '新条件' + parentNode.branches.length
    newNode.desc = '新条件...'
    parentNode.branches.push(newNode)
  } else {
    nodes.push(newNode)
    if (oldChildren) {
      oldChildren.parentId = newNodeId
    }
  }
}

/**
 * 删除子节点
 * @param {*} nodes 节点集
 * @param {*} node  要删除的节点
 */
const handleRemoveChildren = (nodes: WorkflowNode[], node: WorkflowNode) => {
  const children = getChildrenNode(nodes, node.id)

  if (node.type === 'conditions') {
    // 处理删除条件分支
    const usedNodeIds = getConditionUsedNode(nodes, node)
    usedNodeIds.push(node.id)
    if (children) {
      children.parentId = node.parentId
    }
    nodes.splice(0, nodes.length, ...nodes.filter((item) => !usedNodeIds.includes(item.id)))
  }
  if (node.type === 'condition') {
    // 处理删除条件节点
    const parentNode = getNodeById(nodes, node.parentId)
    if (parentNode) {
      if (parentNode.branches.length <= 2) {
        createStrixMessage('warning', '删除节点失败', '至少保留两个条件分支')
        return
      }
      parentNode.branches = parentNode.branches.filter((item) => item.id !== node.id)
    }
  } else {
    if (children) {
      children.parentId = node.parentId
    }
    nodes.splice(0, nodes.length, ...nodes.filter((item) => item.id !== node.id))
  }
}

export const getTypeNameByKey = (key: string) => {
  return nodeTypeMap[key]?.name || key
}

/**
 * 获取节点类型名称
 * @param {*} type  节点类型
 * @returns  节点类型名称
 */
export const getTypeName = (type: WorkflowNodeType) => {
  return nodeTypeMap[type]?.name || type
}

/**
 * 获取节点操作名称
 */
export const getOperationName = (type: WorkflowNodeType) => {
  return nodeTypeMap[type]?.operationName || type
}

/**
 * 渲染工作流
 * @param {*} nodes  节点集
 * @returns  渲染后的节点
 */
export const renderWorkflow = (nodes: WorkflowNode[]) => {
  if (!nodes || !nodes[0]) {
    return
  }
  const rootNode = getRootNode(nodes)
  if (!rootNode) {
    createStrixMessage('warning', '工作流配置异常', '工作流根节点不存在')
    return
  }
  return renderNode(nodes, rootNode)
}
