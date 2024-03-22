import WorkflowNode from '@/components/workflow/WorkflowNode.vue'
import { createStrixMessage } from '@/utils/strix-message'
import { h } from 'vue'

export const renderNode = (node, isBranch = false, parent = null) => {
  if (!node) {
    return
  }

  const children = handleChildren(node)

  return h(
    WorkflowNode,
    {
      node: node,
      icon: typeMap[node.type]?.icon || 'ion:help-circle',
      removable: typeMap[node.type]?.removable || false,
      onAddNode: (type) => {
        handleAddChildren(node, type)
      },
      onRemoveNode: () => {
        handleRemoveChildren(parent, node)
      }
    },
    {
      default: () => {
        // return renderNode(children, false, node)
        if (children) {
          return renderNode(children, isBranch, node)
        } else if (!isBranch) {
          return h('div', { class: 'wf-node-main node-end' }, { default: () => '流程结束' })
        } else {
          return
        }
      },
      branches:
        node.type === 'conditions'
          ? () => {
              return node.branches?.map((branch) => {
                return h(
                  WorkflowNode,
                  {
                    node: branch,
                    icon: typeMap[branch.type]?.icon || 'ion:help-circle',
                    removable: typeMap[branch.type]?.removable || false,
                    className: 'wf-node wf-node-branch',
                    onAddNode: (type) => {
                      handleAddChildren(branch, type)
                    },
                    onRemoveNode: () => {
                      handleRemoveChildren(node, branch)
                    }
                  },
                  {
                    default: () => {
                      return renderNode(branch.children, true, branch)
                    }
                  }
                )
              })
            }
          : null
    }
  )
}

export const handleChildren = (node) => {
  if (node?.children) {
    if (node.children.type === 'EMPTY') {
      return node.children.children
    }
    return node.children
  }
}

/**
 * 添加子节点
 * @param {*} node  当前节点
 * @param {*} type  添加的节点类型
 */
const handleAddChildren = (node, type) => {
  const cacheChildren = { ...node.children }

  if (type === 'conditions') {
    // 处理添加条件分支
    const randomId = generateRandomId()
    node.children = {
      id: 'node-' + randomId + '-start',
      name: '新' + getTypeName(type),
      desc: '新' + getTypeName(type) + '...',
      type: type,
      props: null,
      parentid: node.id,
      parenttype: node.type,
      branches: [],
      children: {
        id: 'node-' + randomId + '-end',
        name: '新' + getTypeName(type),
        desc: '新' + getTypeName(type) + '...',
        type: 'empty',
        props: null,
        parentid: node.id,
        parenttype: node.type,
        branches: null,
        children: node.children ? cacheChildren : null
      }
    }
  } else if (type === 'condition') {
    // 处理添加条件节点
    node.branches?.push({
      id: 'node-' + generateRandomId(),
      name: '新条件' + node.branches.length,
      desc: '新条件...',
      type: 'condition',
      props: null,
      parentid: node.id,
      parenttype: node.type,
      branches: null,
      children: null
    })
  } else {
    node.children = {
      id: 'node-' + generateRandomId(),
      name: '新' + getTypeName(type),
      desc: '新' + getTypeName(type) + '...',
      type: type,
      props: null,
      parentid: node.id,
      parenttype: node.type,
      branches: null,
      children: node.children ? cacheChildren : null
    }
  }
}

/**
 * 删除子节点
 * @param {*} parent  父节点
 * @param {*} node  要删除的节点
 */
const handleRemoveChildren = (parent, node) => {
  if (node.type === 'conditions') {
    // 处理删除条件分支
    // node.children 是条件分支结束节点 一并删除
    parent.children = node.children.children
    return
  }
  if (node.type === 'condition') {
    // 处理删除条件节点
    if (parent.branches.length <= 2) {
      createStrixMessage('warning', '删除节点失败', '至少保留两个条件分支')
      return
    }
    parent.branches = parent.branches.filter((branch) => branch.id !== node.id)
    return
  }

  if (!node.children) {
    parent.children = node.children
    return
  }
  // 拷贝子级所有属性
  parent.children = { ...node.children }
}

const typeMap = {
  root: {
    name: '发起人',
    removable: false,
    icon: 'ion:person-sharp'
  },
  approval: {
    name: '审批人',
    removable: true,
    icon: 'ion:checkmark-done-circle'
  },
  task: {
    name: '办理人',
    removable: true,
    icon: 'ion:checkbox'
  },
  condition: {
    name: '条件节点',
    removable: true,
    icon: 'ion:git-branch-outline'
  },
  cc: {
    name: '抄送人',
    removable: true,
    icon: 'ion:paper-plane'
  },
  empty: {
    name: '空节点',
    removable: false,
    icon: 'ion:square'
  }
}

export const getTypeName = (type) => {
  return typeMap[type]?.name || type
}

const generateRandomId = () => {
  return Math.random().toString(36).substring(2)
}
