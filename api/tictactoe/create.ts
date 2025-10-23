// /api/tictactoe/create.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis } from '../_redis';
import type { RoomState } from '../_ttt_types';

const redis = getRedis();

function newRoomId() {
  return Math.random().toString(36).slice(2, 8);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { username, name } = (req.body ?? {}) as { username?: string; name?: string };
  if (!username || !name) {
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
