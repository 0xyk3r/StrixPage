import { commentApi } from '@/api/comment'
import type { OperateButton } from '@/utils/strix-table-tool'

/**
 * 通用评论 Composable
 * 为列表页提供评论功能集成
 *
 * @param bizType 业务类型标识（如 SystemUser、Dict 等）
 */
export function useComment(bizType: string) {
  const show = ref(false)
  const currentBizId = ref('')
  const currentEntityLabel = ref('')

  /** 评论计数缓存: bizId -> count */
  const commentCounts = ref<Record<string, number>>({})

  /**
   * 生成操作列评论按钮
   */
  function commentButton(row: Record<string, any>, label?: string): OperateButton {
    return {
      label: '评论',
      icon: 'message-square',
      onClick: () => {
        currentBizId.value = row.id
        currentEntityLabel.value = label || row.name || row.nickname || row.title || row.dictKey || row.key || row.id
        show.value = true
      }
    }
  }

  /**
   * 面板组件绑定 props
   */
  const panelProps = computed(() => ({
    'show': show.value,
    'onUpdate:show': (v: boolean) => {
      show.value = v
    },
    'bizType': bizType,
    'bizId': currentBizId.value,
    'entityLabel': currentEntityLabel.value
  }))

  /**
   * 批量加载评论数（用于列表页角标）
   */
  async function loadCommentCounts(bizIds: string[]) {
    if (!bizIds.length) return
    try {
      const { data } = await commentApi.batchCount({ bizType, bizIds })
      if (data?.data?.counts) {
        commentCounts.value = { ...commentCounts.value, ...data.data.counts }
      }
    } catch {
      // 静默失败，不影响页面
    }
  }

  /**
   * 获取指定实体的评论数
   */
  function getCommentCount(bizId: string): number {
    return commentCounts.value[bizId] || 0
  }

  return {
    show,
    currentBizId,
    currentEntityLabel,
    commentButton,
    panelProps,
    commentCounts,
    loadCommentCounts,
    getCommentCount
  }
}
