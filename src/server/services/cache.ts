export class CacheService {
  private static cache = new Map<string, { data: any; expiry: number }>();

  static set(key: string, data: any, ttlSeconds: number = 3600) {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiry });
  }

  static get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  static delete(key: string) {
    this.cache.delete(key);
  }
}
