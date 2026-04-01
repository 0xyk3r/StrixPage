import { defineStore } from 'pinia'
import type { HistoryState } from 'vue-router'

export interface BookmarkItem {
  path: string
  fullPath: string
  title: string
  icon?: string
  query?: Record<string, any>
  state?: HistoryState
  createdAt: number
}

export const useBookmarksStore = defineStore(
  'bookmarks',
  () => {
    const bookmarks = ref<BookmarkItem[]>([])

    function addBookmark(item: Omit<BookmarkItem, 'createdAt'>) {
      if (bookmarks.value.some((b) => b.fullPath === item.fullPath)) return
      bookmarks.value.push({ ...item, createdAt: Date.now() })
    }

    function removeBookmark(fullPath: string) {
      bookmarks.value = bookmarks.value.filter((b) => b.fullPath !== fullPath)
    }

    function isBookmarked(fullPath: string): boolean {
      return bookmarks.value.some((b) => b.fullPath === fullPath)
    }

    function isPathBookmarked(path: string): boolean {
      return bookmarks.value.some((b) => b.path === path)
    }

    function removeByPath(path: string) {
      bookmarks.value = bookmarks.value.filter((b) => b.path !== path)
    }

    function toggleBookmark(item: Omit<BookmarkItem, 'createdAt'>) {
      if (isBookmarked(item.fullPath)) {
        removeBookmark(item.fullPath)
      } else {
        addBookmark(item)
      }
    }

    function toggleByPath(item: Omit<BookmarkItem, 'createdAt'>) {
      if (isPathBookmarked(item.path)) {
        removeByPath(item.path)
      } else {
        addBookmark(item)
      }
    }

    return {
      bookmarks,
      addBookmark,
      removeBookmark,
      removeByPath,
      isBookmarked,
      isPathBookmarked,
      toggleBookmark,
      toggleByPath
    }
  },
  { persist: true }
)
