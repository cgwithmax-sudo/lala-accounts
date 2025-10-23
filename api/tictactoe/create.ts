import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis } from '../_redis';
import type { RoomState } from '../_ttt_types';

function newRoomId() {
  return Math.random().toString(36).slice(2, 8);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { username, name } = req.body || {};
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
  const key = `ttt:room:${id}`;
  // Let Upstash serialize for us; also works if you previously saved strings.
  await redis.set(key, room, { ex: 60 * 60 * 24 });

  res.setHeader('Cache-Control', 'no-store');
  return res.json({ ok: true, room });
}
