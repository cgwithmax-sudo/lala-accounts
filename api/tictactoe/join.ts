import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis } from '../_redis';
import type { RoomState } from '../_ttt_types';

const redis = getRedis();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { roomId, username, name } = req.body || {};
  if (!roomId || !username || !name) {
    return res.status(400).json({ ok: false, error: 'Missing roomId, username or name' });
  }

  const key = `ttt:room:${roomId}`;
  const raw = await redis.get<string>(key);
  if (!raw) return res.status(404).json({ ok: false, error: 'Room not found' });

  const room: RoomState = JSON.parse(raw);

  // Already in the room? allow rejoin
  if (room.players.X?.username === username || room.players.O?.username === username) {
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ ok: true, room });
  }

  // Join as O if free, else reject
  if (!room.players.O) {
    room.players.O = { username, name };
    room.status = 'playing';
  } else {
    return res.status(403).json({ ok: false, error: 'Room full' });
  }

  await redis.set(key, JSON.stringify(room), { ex: 60 * 60 * 24 });
  res.setHeader('Cache-Control', 'no-store');
  return res.json({ ok: true, room });
}
