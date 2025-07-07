interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Check if we have a pending request
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }

    // Create new request
    const promise = fetcher()
      .then(data => {
        this.cache.set(key, { data, timestamp: Date.now() });
        this.pendingRequests.delete(key);
        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

export const requestCache = new RequestCache();