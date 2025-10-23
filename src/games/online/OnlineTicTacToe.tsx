import React, { useEffect, useMemo, useState } from 'react';
import type { RoomState } from './tttTypes';

const API = ''; // same-origin (Vercel API routes)

/** Parse JSON safely; if server returned HTML/text error, show that instead. */
async function parseJsonSafe(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  // Not JSON – get text so we can surface a readable error
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: text || `HTTP ${res.status}` };
  }
}

type Props = {
  currentUser: { username: string; name: string };
};

export default function OnlineTicTacToe({ currentUser }: Props) {
  const [roomId, setRoomId] = useState('');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [poll, setPoll] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const mySymbol = useMemo(() => {
    if (!room) return null;
    if (room.players.X?.username === currentUser.username) return 'X';
    if (room.players.O?.username === currentUser.username) return 'O';
    return null;
  }, [room, currentUser.username]);

  async function createRoom() {
    setErr(null);
    setCreating(true);
    try {
      const res = await fetch(`${API}/api/tictactoe/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentUser),
      });
      const json = await parseJsonSafe(res);
      if (!json?.ok) throw new Error(json?.error || 'Failed to create room');
      setRoom(json.room);
      setRoomId(json.room.id);
      setPoll(true);
    } catch (e: any) {
      setErr(e?.message || 'Create failed');
    } finally {
      setCreating(false);
    }
  }

  async function joinRoom() {
    const id = roomId.trim();
    if (!id) { setErr('Enter a room ID'); return; }
    setErr(null);
    setJoining(true);
    try {
      const res = await fetch(`${API}/api/tictactoe/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: id, username: currentUser.username, name: currentUser.name }),
      });
      const json = await parseJsonSafe(res);
      if (!json?.ok) throw new Error(json?.error || 'Failed to join room');
      setRoom(json.room);
      setPoll(true);
    } catch (e: any) {
      setErr(e?.message || 'Join failed');
    } finally {
      setJoining(false);
    }
  }

  async function loadState(id = roomId) {
    if (!id) return;
    try {
      const res = await fetch(`${API}/api/tictactoe/state?roomId=${encodeURIComponent(id)}`, { cache: 'no-store' });
      const json = await parseJsonSafe(res);
      if (json?.ok) setRoom(json.room);
      else if (json?.error) setErr(json.error);
    } catch (e: any) {
      // transient fetch errors are fine; poller will retry
    }
  }

  // Poll state every 1.5s once in a room
  useEffect(() => {
    if (!poll || !roomId) return;
    loadState();
    const t = setInterval(() => loadState(), 1500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll, roomId]);

  async function move(i: number) {
    if (!room) return;
    const myTurn = room.players[room.turn]?.username === currentUser.username;
    if (!myTurn || room.board[i]) return;

    const res = await fetch(`${API}/api/tictactoe/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: room.id, index: i, username: currentUser.username }),
    });
    const json = await parseJsonSafe(res);
    if (json?.ok) setRoom(json.room);
    else if (json?.error) setErr(json.error);
  }

  function statusText(r: RoomState): string {
    if (r.status === 'waiting') return 'Waiting for an opponent to join…';
    if (r.status === 'playing') return `Playing — Turn: ${r.turn}`;
    if (r.status === 'x_won') return 'X won!';
    if (r.status === 'o_won') return 'O won!';
    return 'Draw!';
  }

  return (
    <div>
      {!room && (
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr auto' }}>
          <input
            placeholder="Room ID"
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 10 }}
          />
          <button
            onClick={joinRoom}
            disabled={joining}
            style={{ padding: '10px 14px', border: '1px solid #111827', borderRadius: 10 }}
          >
            {joining ? 'Joining…' : 'Join'}
          </button>
          <button
            onClick={createRoom}
            disabled={creating}
            style={{ gridColumn: '1/-1', padding: '10px 14px', border: '1px solid #111827', borderRadius: 10 }}
          >
            {creating ? 'Creating…' : 'Create New Room'}
          </button>
        </div>
      )}

      {err && <div style={{ marginTop: 10, color: '#b91c1c' }}>{err}</div>}

      {room && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>Room:</span> {room.id}
            <span style={{ marginLeft: 12, padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 999 }}>
              You are: {mySymbol ?? 'Spectator'}
            </span>
            <span style={{ marginLeft: 'auto' }}>{statusText(room)}</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 64px)',
              gap: 6,
            }}
          >
            {room.board.map((cell, i) => (
              <button
                key={i}
                onClick={() => move(i)}
                style={{
                  width: 64,
                  height: 64,
                  fontSize: 24,
                  fontWeight: 700,
                  border: '1px solid #111827',
                  borderRadius: 10,
                  background: 'white',
                }}
              >
                {cell}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
