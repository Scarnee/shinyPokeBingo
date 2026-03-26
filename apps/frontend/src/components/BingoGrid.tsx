import React, { useState } from 'react';
import { Pokemon } from '../api/bingo';
import { BingoCell } from './BingoCell';

interface BingoGridProps {
  grid: Pokemon[][];
  extras: Pokemon[];
  shiny: boolean;
  showGame: boolean;
}

export function BingoGrid({ grid: initialGrid, extras: initialExtras, shiny, showGame }: BingoGridProps) {
  const [grid, setGrid] = useState<Pokemon[][]>(initialGrid);
  const [extras, setExtras] = useState<Pokemon[]>(initialExtras);
  const [marked, setMarked] = useState<Set<string>>(new Set());

  const toggleMark = (row: number, col: number) => {
    const key = `${row}-${col}`;
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const regenerateCell = (row: number, col: number) => {
    if (extras.length === 0) return;
    const idx = Math.floor(Math.random() * extras.length);
    const next = extras[idx];
    const old = grid[row][col];

    setExtras((prev) => {
      const a = [...prev];
      a[idx] = old;
      return a;
    });
    setGrid((prev) => {
      const g = prev.map((r) => [...r]);
      g[row][col] = next;
      return g;
    });
    setMarked((prev) => {
      const s = new Set(prev);
      s.delete(`${row}-${col}`);
      return s;
    });
  };

  const size = grid.length;

  return (
    <div
      className="grid gap-2 w-full max-w-3xl mx-auto"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
    >
      {grid.map((row, ri) =>
        row.map((pokemon, ci) => (
          <BingoCell
            key={`${ri}-${ci}`}
            pokemon={pokemon}
            marked={marked.has(`${ri}-${ci}`)}
            shiny={shiny}
            showGame={showGame}
            canRegenerate={extras.length > 0}
            onClick={() => toggleMark(ri, ci)}
            onRegenerate={() => regenerateCell(ri, ci)}
          />
        )),
      )}
    </div>
  );
}
