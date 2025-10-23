import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis } from '../_redis';
import type { RoomState } from '../_ttt_types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { roomId, username, name } = (req.body ?? {}) as { roomId?: string; username?: string; name?: string };
  if (!roomId || !username || !name) return res.status(400).json({ ok: false, error: 'Missing roomId, username or name' });

  const redis = getRedis();
  const key = `ttt:room:${roomId}`;
  const raw = await redis.get<RoomState | string | null>(key);
  if (!raw) return res.status(404).json({ ok: false, error: 'Room not found' });

  const room: RoomState = typeof raw === 'string' ? JSON.parse(raw) : raw;

  // already in room? allow
  if (room.players.X?.username === username || room.players.O?.username === username) {
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ ok: true, room });
  }

  if (!room.players.O) {
    room.players.O = { username, name };
    room.status = 'playing';
  } else {
    return res.status(403).json({ ok: false, error: 'Room full' });
  }

  await redis.set(key, room, { ex: 60 * 60 * 24 });

  res.setHeader('Cache-Control', 'no-store');
  return res.json({ ok: true, room });
}
