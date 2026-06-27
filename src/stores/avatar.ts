import { defineStore } from 'pinia'
import { managerApi } from '@/api/manager'

/**
 * 头像配置缓存 Store
 *
 * 为「仅有 managerId、无头像配置」的场景提供按 ID 拉取头像配置的能力。
 * 三层优化，解决「同一页面大量数据、含大量重复人员」的性能问题：
 *
 * 1. 会话级内存缓存（cache）：同一 managerId 仅请求一次，结果常驻内存（不持久化）。
 * 2. microtask 批量合并：同一 tick 内所有组件的待查 ID 收集去重后合并成「一次」批量
 *    请求（100 个组件挂载 → 1 次请求）。
 * 3. 进行中去重：等待批次的 ID 共享同一 deferred Promise，不重复发起。
 *
 * 注意：会话级缓存意味着「他人修改头像」需重新进入页面/刷新后才生效（最终一致），
 * 符合头像这类弱实时数据的定位。当前用户修改自身头像时由 setCache 主动写回保持一致。
 */
export const useAvatarStore = defineStore('avatar', () => {
  // managerId -> avatarConfig（null 表示该用户无自定义头像配置，仍是有效的已知结果）
  const cache = ref<Map<string, string | null>>(new Map())

  // 待批量查询的 ID -> 等待该 ID 结果的 resolver 列表（同一 tick 内累积）
  const pending = new Map<string, Array<(config: string | null) => void>>()
  // 当前 tick 是否已安排 flush
  let flushScheduled = false

  /**
   * 执行一次批量拉取：取出当前累积的所有待查 ID，去重后发一次请求，
   * 完成后写缓存并 resolve 所有等待者。
   */
  async function flush() {
    flushScheduled = false
    if (!pending.size) return

    // 快照当前批次并立即清空，使本次请求期间新产生的请求归入下一批
    const batch = new Map(pending)
    pending.clear()
    const ids = [...batch.keys()]

    const settle = (id: string, config: string | null) => batch.get(id)?.forEach((fn) => fn(config))

    try {
      const { data: res } = await managerApi.avatars(ids)
      const avatars = res.data?.avatars ?? {}
      ids.forEach((id) => {
        // 接口未返回的 ID（如已删除用户）也写 null，避免反复重试
        const config = id in avatars ? (avatars[id] ?? null) : null
        cache.value.set(id, config)
        settle(id, config)
      })
      // 触发响应式更新
      cache.value = new Map(cache.value)
    } catch {
      // 请求失败：不写缓存（允许后续重试），但仍需 resolve 等待者避免悬挂
      ids.forEach((id) => settle(id, null))
    }
  }

  function scheduleFlush() {
    if (flushScheduled) return
    flushScheduled = true
    // microtask：聚合同一同步执行栈内（如 v-for 批量挂载）产生的全部请求
    queueMicrotask(flush)
  }

  /**
   * 请求某个 managerId 的头像配置。
   * - 命中缓存：立即返回缓存值。
   * - 否则：登记到本 tick 待查集合，等待批量拉取完成。
   */
  function fetchAvatar(managerId: string): Promise<string | null> {
    if (!managerId) return Promise.resolve(null)
    if (cache.value.has(managerId)) return Promise.resolve(cache.value.get(managerId)!)

    return new Promise<string | null>((resolve) => {
      const waiters = pending.get(managerId)
      if (waiters) {
        waiters.push(resolve)
      } else {
        pending.set(managerId, [resolve])
      }
      scheduleFlush()
    })
  }

  /** 同步读取缓存（未命中返回 undefined） */
  function peek(managerId: string): string | null | undefined {
    return cache.value.get(managerId)
  }

  /** 主动写入/更新缓存（如当前用户修改自身头像后保持一致） */
  function setCache(managerId: string, config: string | null) {
    if (!managerId) return
    cache.value.set(managerId, config)
    cache.value = new Map(cache.value)
  }

  return { cache, fetchAvatar, peek, setCache }
})
