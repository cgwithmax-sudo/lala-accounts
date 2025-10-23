export type PlayerSymbol = 'X' | 'O';
export type Cell = PlayerSymbol | '';

export type RoomState = {
  id: string;
  createdAt: number;
  board: Cell[];
  turn: PlayerSymbol;
  players: {
    X: { username: string; name: string } | null;
    O: { username: string; name: string } | null;
  };
  status: 'waiting' | 'playing' | 'x_won' | 'o_won' | 'draw';
};
