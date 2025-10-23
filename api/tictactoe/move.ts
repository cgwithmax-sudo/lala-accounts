import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis } from '../_redis';
import type { RoomState, PlayerSymbol } from '../_ttt_types';

const redis = getRedis();

const WINS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function winner(board: RoomState['board']): PlayerSymbol | null {
  for (const [a,b,c] of WINS) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a] as PlayerSymbol;
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { roomId, index, username } = req.body || {};
  if (roomId == null || index == null || username == null) {
    return res.status(400).json({ ok: false, error: 'Missing roomId, index, or username' });
  }

  const key = `ttt:room:${roomId}`;
  const raw = await redis.get<string>(key);
  if (!raw) return res.status(404).json({ ok: false, error: 'Room not found' });

  const room: RoomState = JSON.parse(raw);
  if (room.status !== 'playing' && room.status !== 'waiting') {
    return res.status(409).json({ ok: false, error: 'Game already finished' });
  }

  const expectedUser = room.players[room.turn]?.username;
  if (expectedUser !== username) {
    return res.status(403).json({ ok: false, error: 'Not your turn' });
  }

  if (index < 0 || index > 8 || room.board[index]) {
    return res.status(400).json({ ok: false, error: 'Illegal move' });
  }

  room.board[index] = room.turn;

  const w = winner(room.board);
  if (w === 'X') room.status = 'x_won';
  else if (w === 'O') room.status = 'o_won';
  else if (room.board.every(c => c)) room.status = 'draw';
  else room.turn = room.turn === 'X' ? 'O' : 'X';

  await redis.set(key, JSON.stringify(room), { ex: 60 * 60 * 24 });
  res.setHeader('Cache-Control', 'no-store');
  return res.json({ ok: true, room });
}
