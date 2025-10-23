// /api/_ttt_types.ts
export type PlayerSymbol = 'X' | 'O';
export type Cell = PlayerSymbol | '';

export type RoomState = {
  id: string;
  createdAt: number;
  board: Cell[];            // length 9
  turn: PlayerSymbol;       // 'X' | 'O'
  players: {
    X: { username: string; name: string } | null;
    O: { username: string; name: string } | null;
  };
  status: 'waiting' | 'playing' | 'x_won' | 'o_won' | 'draw';
};
