import { forwardRef } from 'react';
import { Pokemon } from '../api/bingo';
import { CellStatus, CELL_STATUS_CYCLE } from '../types';
import { BingoCell } from './BingoCell';

interface BingoGridProps {
  grid: Pokemon[][];
  extras: Pokemon[];
  cellStatuses: Record<string, CellStatus>;
  cellNotes: Record<string, string>;
  shiny: boolean;
  showGame: boolean;
  onStatusChange: (row: number, col: number, status: CellStatus) => void;
  onRegenerate: (row: number, col: number) => void;
  onNoteChange: (row: number, col: number, note: string) => void;
}

export const BingoGrid = forwardRef<HTMLDivElement, BingoGridProps>(
  ({ grid, extras, cellStatuses, cellNotes, shiny, showGame, onStatusChange, onRegenerate, onNoteChange }, ref) => {
    const size = grid.length;

    const handleClick = (row: number, col: number) => {
      const current = cellStatuses[`${row}-${col}`] ?? 'idle';
      const next = CELL_STATUS_CYCLE[(CELL_STATUS_CYCLE.indexOf(current) + 1) % CELL_STATUS_CYCLE.length];
      onStatusChange(row, col, next);
    };

    return (
      <div
        ref={ref}
        className="grid gap-2 w-full max-w-3xl mx-auto"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {grid.map((row, ri) =>
          row.map((pokemon, ci) => (
            <BingoCell
              key={`${ri}-${ci}`}
              pokemon={pokemon}
              status={cellStatuses[`${ri}-${ci}`] ?? 'idle'}
              note={cellNotes[`${ri}-${ci}`] ?? ''}
              shiny={shiny}
              showGame={showGame}
              canRegenerate={extras.length > 0}
              onClick={() => handleClick(ri, ci)}
              onRegenerate={() => onRegenerate(ri, ci)}
              onNoteChange={(note) => onNoteChange(ri, ci, note)}
            />
          )),
        )}
      </div>
    );
  },
);

BingoGrid.displayName = 'BingoGrid';
