// src/games/TicTacToe.tsx
import React, { useMemo, useState } from 'react';

type Cell = 'X' | 'O' | null;
const LINES = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6]          // diagonals
];

function winnerOf(b: Cell[]): Cell | 'Draw' | null {
  for (const [a,b2,c] of LINES) {
    if (b[a] && b[a] === b[b2] && b[a] === b[c]) return b[a];
  }
  if (b.every(Boolean)) return 'Draw';
  return null;
}

export default function TicTacToe(){
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<Cell>('X');

  const result = useMemo(()=>winnerOf(board), [board]);

  function play(i: number){
    if (board[i] || result) return;
    const next = board.slice();
    next[i] = turn;
    setBoard(next);
    setTurn(turn === 'X' ? 'O' : 'X');
  }
  function reset(){
    setBoard(Array(9).fill(null));
    setTurn('X');
  }

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 80px)', gap:8, justifyContent:'center'}}>
        {board.map((v, i)=>(
          <button
            key={i}
            onClick={()=>play(i)}
            style={{
              width:80, height:80, borderRadius:12, fontSize:32, fontWeight:800,
              border:'1px solid #111827', background:'white'
            }}
          >
            {v ?? ''}
          </button>
        ))}
      </div>
      <div style={{textAlign:'center', marginTop:10, fontWeight:600}}>
        {result ? (result === 'Draw' ? 'Draw!' : `${result} wins!`) : `Turn: ${turn}`}
      </div>
      <div style={{textAlign:'center', marginTop:8}}>
        <button onClick={reset} style={{padding:'8px 12px', borderRadius:10, border:'1px solid #111827'}}>Reset</button>
      </div>
    </div>
  );
}
