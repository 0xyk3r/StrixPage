type CacheEntry<T> = {
  result: Promise<T>
  timestamp: number
}

const cacheTime = 2000
const cache: Map<string, CacheEntry<any>> = new Map()

function generateCacheKey(args: any[]): string {
  return JSON.stringify(args)
}

export async function callOnce<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
  const cacheKey = generateCacheKey(args)
  const now = Date.now()

  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey)!
    if (now - entry.timestamp < cacheTime) {
      return entry.result
    } else {
      cache.delete(cacheKey)
    }
  }

  const resultPromise = fn(...args)
  cache.set(cacheKey, { result: resultPromise, timestamp: now })

  try {
    return await resultPromise
  } catch (error) {
    cache.delete(cacheKey)
    throw error
  }
}
