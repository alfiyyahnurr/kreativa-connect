import { redis } from './client';

export async function redisGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (!redis) {
    return await fetcher();
  }

  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch (err) {
    console.warn(`Redis GET error for key ${key}:`, err);
  }

  const fresh = await fetcher();

  try {
    if (fresh !== null && fresh !== undefined) {
      await redis.set(key, fresh, { ex: ttlSeconds });
    }
  } catch (err) {
    console.warn(`Redis SET error for key ${key}:`, err);
  }

  return fresh;
}

export async function redisDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`Redis DEL error for key ${key}:`, err);
  }
}
