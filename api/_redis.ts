// /api/_redis.ts
import { Redis } from '@upstash/redis';

let client: Redis | null = null;

export function getRedis() {
  if (client) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Upstash Redis env vars are missing. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel.'
    );
  }
  client = new Redis({ url, token });
  return client;
}
