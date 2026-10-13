import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './client';

export async function checkRateLimit(
  identifier: string,
  limit: number = 20,
  window: `${number} s` | `${number} m` | `${number} h` | `${number} d` = '1 m'
): Promise<{ success: boolean; remaining: number }> {
  if (!redis) {
    // If Redis is not configured in local environment, allow request
    return { success: true, remaining: limit };
  }

  try {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      analytics: true,
      prefix: '@kreativa/ratelimit',
    });

    const result = await ratelimit.limit(identifier);
    return { success: result.success, remaining: result.remaining };
  } catch (err) {
    console.warn('Rate limit error, allowing request:', err);
    return { success: true, remaining: limit };
  }
}
