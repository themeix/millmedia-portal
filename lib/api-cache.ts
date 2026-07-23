interface CacheEntry<T> {
  data: T
  timestamp: number
  cacheTime: number // in minutes
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()
  private listeners = new Map<string, Set<(data: any) => void>>()

  // Get cached data
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const age = Date.now() - entry.timestamp
    const maxAge = entry.cacheTime * 60 * 1000 // convert minutes to milliseconds

    if (age > maxAge) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  // Set cache data
  set<T>(key: string, data: T, cacheTime = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      cacheTime
    })
    
    // Notify listeners
    const listeners = this.listeners.get(key)
    if (listeners) {
      listeners.forEach(listener => listener(data))
    }
  }

  // Clear specific cache
  clear(key: string): void {
    this.cache.delete(key)
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear()
  }

  // Subscribe to cache updates
  subscribe(key: string, listener: (data: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(listener)
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key)
      if (listeners) {
        listeners.delete(listener)
        if (listeners.size === 0) {
          this.listeners.delete(key)
        }
      }
    }
  }

  // Check if cache is expired
  isExpired(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return true

    const age = Date.now() - entry.timestamp
    const maxAge = entry.cacheTime * 60 * 1000
    return age > maxAge
  }

  // Get cache age in minutes
  getCacheAge(key: string): number {
    const entry = this.cache.get(key)
    if (!entry) return -1

    const age = Date.now() - entry.timestamp
    return Math.floor(age / 60000) // convert to minutes
  }
}

// Global cache instance
export const apiCache = new APICache()

// Cached fetch wrapper
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheTime = 5 // default 5 minutes
): Promise<T> {
  const cacheKey = url + JSON.stringify(options)
  
  // Check cache first
  const cachedData = apiCache.get<T>(cacheKey)
  if (cachedData && !apiCache.isExpired(cacheKey)) {
    return cachedData
  }

  // Fetch new data
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()
  
  // Store in cache
  apiCache.set(cacheKey, data, cacheTime)
  
  return data as T
}

// Force refresh cache
export async function refreshCache<T>(
  url: string,
  options: RequestInit = {},
  cacheTime = 5
): Promise<T> {
  const cacheKey = url + JSON.stringify(options)
  
  // Clear existing cache
  apiCache.clear(cacheKey)
  
  // Fetch new data
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()
  
  // Store in cache
  apiCache.set(cacheKey, data, cacheTime)
  
  return data as T
}