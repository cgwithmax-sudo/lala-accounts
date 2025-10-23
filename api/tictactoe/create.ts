import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis } from '../_redis.js';
import type { RoomState } from '../_ttt_types';

function newRoomId() {
  return Math.random().toString(36).slice(2, 8);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { username, name } = (req.body ?? {}) as { username?: string; name?: string };
  if (!username || !name) return res.status(400).json({ ok: false, error: 'Missing username or name' });

  const id = newRoomId();
  const room: RoomState = {
    id,
    createdAt: Date.now(),
    board: Array(9).fill('') as RoomState['board'],
    turn: 'X',
    players: { X: { username, name }, O: null },
    status: 'waiting',
  };

  const redis = getRedis();
  // Store the plain object; Upstash SDK serializes for us
  await redis.set(`ttt:room:${id}`, room, { ex: 60 * 60 * 24 });

  res.setHeader('Cache-Control', 'no-store');
  return res.json({ ok: true, room });
}
