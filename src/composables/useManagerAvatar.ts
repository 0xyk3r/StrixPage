import { type MaybeRefOrGetter, toRef } from 'vue'
import { useAvatarStore } from '@/stores/avatar'

/**
 * 按 managerId 响应式获取头像配置。
 *
 * 供「仅有 managerId、无头像配置」的场景使用：内部经 avatar store 批量合并 + 缓存 + 去重，
 * 同一页面大量重复人员只会触发一次合并请求。
 *
 * @param managerId 管理员 ID（支持 ref / getter / 原始值）
 * @returns config 响应式头像配置（加载完成前为 null，组件可先用 managerId 作 seed 渲染默认头像）
 */
export function useManagerAvatar(managerId: MaybeRefOrGetter<string | null | undefined>) {
  const avatarStore = useAvatarStore()
  const idRef = toRef(managerId)

  // 优先取缓存（同步命中则无闪烁），否则 null 占位
  const config = ref<string | null>(avatarStore.peek(idRef.value || '') ?? null)

  watch(
    idRef,
    (id) => {
      if (!id) {
        config.value = null
        return
      }
      const cached = avatarStore.peek(id)
      if (cached !== undefined) {
        config.value = cached
        return
      }
      // 未命中：拉取（批量合并），仅当 id 未变时写回，避免竞态覆盖
      const requestedId = id
      avatarStore.fetchAvatar(id).then((c) => {
        if (idRef.value === requestedId) config.value = c
      })
    },
    { immediate: true }
  )

  return { config }
}
