import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from '../_redis';
import type { RoomState } from '../_ttt_types';

function newRoomId() {
  return Math.random().toString(36).slice(2, 8); // short id
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { username, name } = (req.body as any) || {};
  if (!username || !name) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ ok: false, error: 'Missing username or name' });
  }

  const id = newRoomId();
  const room: RoomState = {
    id,
    createdAt: Date.now(),
    board: Array(9).fill('') as RoomState['board'],
    turn: 'X',
    players: {
      X: { username, name },
      O: null,
    },
    status: 'waiting',
  };

  const key = `ttt:room:${id}`;
  await redis.set(key, JSON.stringify(room), { ex: 60 * 60 * 24 }); // 24h TTL
  res.setHeader('Cache-Control', 'no-store');
  return res.json({ ok: true, room });
}
