// /api/redisClient.ts
import { Redis } from '@upstash/redis';

let client: Redis | null = null;

export function getRedis() {
