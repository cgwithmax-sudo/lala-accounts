import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from '../_redis';
import type { RoomState } from '../_ttt_types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const roomId = (req.query.roomId as string | undefined)?.trim();
  if (!roomId) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ ok: false, error: 'Missing roomId' });
  }

  const key = `ttt:room:${roomId}`;
  const raw = await redis.get<string>(key);
  if (!raw) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).json({ ok: false, error: 'Room not found' });
  }

  const room: RoomState = JSON.parse(raw);
  res.setHeader('Cache-Control', 'no-store');
  return res.json({ ok: true, room });
}
