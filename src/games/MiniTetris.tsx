// src/games/MiniTetris.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

const W = 10;
const H = 20;

type Cell = 0 | 1;
type Grid = Cell[][];

type Shape = number[][];
const SHAPES: Shape[] = [
  // I
  [[1,1,1,1]],
  // O
  [[1,1],[1,1]],
  // T
  [[1,1,1],[0,1,0]],
  // L
  [[1,0],[1,0],[1,1]],
  // J
  [[0,1],[0,1],[1,1]],
  // S
  [[0,1,1],[1,1,0]],
  // Z
  [[1,1,0],[0,1,1]],
];

function emptyGrid(): Grid {
  return Array.from({length:H},()=>Array<Cell>(W).fill(0));
}
function cloneGrid(g: Grid): Grid {
  return g.map(r=>r.slice()) as Grid;
}
function rotate(shape: Shape): Shape {
  const rows = shape.length, cols = shape[0].length;
  const out: number[][] = Array.from({length:cols},()=>Array(rows).fill(0));
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) out[c][rows-1-r] = shape[r][c];
  return out;
}
function collide(grid: Grid, shape: Shape, x: number, y: number): boolean {
  for (let r=0;r<shape.length;r++){
    for (let c=0;c<shape[0].length;c++){
      if (!shape[r][c]) continue;
      const gx = x+c, gy = y+r;
      if (gx<0 || gx>=W || gy>=H) return true;
      if (gy>=0 && grid[gy][gx]) return true;
    }
  }
  return false;
}
function merge(grid: Grid, shape: Shape, x: number, y: number){
  const g = cloneGrid(grid);
  for (let r=0;r<shape.length;r++){
    for (let c=0;c<shape[0].length;c++){
      if (!shape[r][c]) continue;
      const gx = x+c, gy = y+r;
      if (gy>=0) g[gy][gx] = 1;
    }
  }
  return g;
}
function clearLines(grid: Grid): { grid: Grid; cleared: number } {
  const keep = grid.filter(row => row.some(v=>v===0));
  const cleared = H - keep.length;
  const newRows = Array.from({length:cleared}, ()=>Array<Cell>(W).fill(0));
  return { grid: [...newRows, ...keep], cleared };
}
function randShape(): Shape {
  return SHAPES[(Math.random()*SHAPES.length)|0].map(r=>r.slice());
}

export default function MiniTetris(){
  const [grid, setGrid] = useState<Grid>(emptyGrid());
  const [shape, setShape] = useState<Shape>(randShape());
  const [x, setX] = useState<number>(3);
  const [y, setY] = useState<number>(-2);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const dropMs = 600;

  const stepRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function spawnNew(){
    const s = randShape();
    const startX = Math.floor((W - s[0].length)/2);
    const startY = -2;
    if (collide(grid, s, startX, startY+1)) {
      setGameOver(true);
    } else {
      setShape(s); setX(startX); setY(startY);
    }
  }

  useEffect(()=>{
    if (gameOver) { if (stepRef.current) clearInterval(stepRef.current); return; }
    stepRef.current = setInterval(()=>{
      setY(prev=>{
        const ny = prev + 1;
        if (collide(grid, shape, x, ny)){
          // lock
          setGrid(g => {
            const merged = merge(g, shape, x, prev);
            const { grid: clearedGrid, cleared } = clearLines(merged);
            if (cleared) setScore(s=>s + cleared*100);
            return clearedGrid;
          });
          spawnNew();
          return prev;
        }
        return ny;
      });
    }, dropMs);
    return ()=> { if (stepRef.current) clearInterval(stepRef.current); };
  }, [grid, shape, x, gameOver]);

  // controls
  useEffect(()=>{
    function onKey(e: KeyboardEvent){
      if (gameOver) return;
      if (e.key === 'ArrowLeft'){
        const nx = x-1;
        if (!collide(grid, shape, nx, y)) setX(nx);
      } else if (e.key === 'ArrowRight'){
        const nx = x+1;
        if (!collide(grid, shape, nx, y)) setX(nx);
      } else if (e.key === 'ArrowDown'){
        const ny = y+1;
        if (!collide(grid, shape, x, ny)) setY(ny);
      } else if (e.key === 'ArrowUp'){
        const rs = rotate(shape);
        if (!collide(grid, rs, x, y)) setShape(rs as Shape);
      } else if (e.code === 'Space'){
        // hard drop
        let dy = y;
        while(!collide(grid, shape, x, dy+1)) dy++;
        setY(dy);
      }
    }
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  }, [x,y,grid,shape,gameOver]);

  const previewGrid = useMemo(()=>{
    const g = cloneGrid(grid);
    for (let r=0;r<shape.length;r++){
      for (let c=0;c<shape[0].length;c++){
        if (!shape[r][c]) continue;
        const gx = x+c, gy = y+r;
        if (gy>=0 && gy<H && gx>=0 && gx<W) g[gy][gx] = 1;
      }
    }
    return g;
  }, [grid, shape, x, y]);

  function reset(){
    setGrid(emptyGrid());
    setShape(randShape());
    setX(3); setY(-2);
    setScore(0); setGameOver(false);
  }

  return (
    <div style={{display:'flex', gap:16, alignItems:'flex-start', justifyContent:'center'}}>
      <div style={{
        display:'grid',
        gridTemplateColumns:`repeat(${W}, 18px)`,
        gap:2, background:'#e5e7eb', padding:4, borderRadius:8
      }}>
        {previewGrid.map((row, ri)=>row.map((cell, ci)=>(
          <div key={`${ri}-${ci}`}
            style={{
              width:18, height:18,
              background: cell ? '#111827' : 'white',
              borderRadius:3
            }} />
        )))}
      </div>
      <div>
        <div style={{fontWeight:700, marginBottom:8}}>Score: {score}</div>
        <button onClick={reset} style={{padding:'8px 12px', borderRadius:10, border:'1px solid #111827'}}>Reset</button>
        {gameOver && <div style={{marginTop:8, color:'#b91c1c', fontWeight:700}}>Game Over</div>}
        <div style={{marginTop:10, fontSize:12, color:'#6b7280'}}>
          Controls: ← → move, ↓ soft drop, ↑ rotate, Space hard drop
        </div>
      </div>
    </div>
  );
}
