import { useState } from 'react';
import { Pokemon } from '../api/bingo';
import { CellStatus } from '../types';

const MAX_NOTE = 40;

interface BingoCellProps {
  pokemon: Pokemon;
  status: CellStatus;
  note: string;
  shiny: boolean;
  showGame: boolean;
  canRegenerate: boolean;
  onClick: () => void;
  onRegenerate: () => void;
  onNoteChange: (note: string) => void;
}

const BORDER: Record<CellStatus, string> = {
  idle:      'border-gray-600 bg-gray-800 hover:border-blue-400 hover:bg-gray-700',
  hunting:   'border-blue-500 bg-blue-950/70 ring-1 ring-blue-500/30',
  found:     'border-yellow-400 bg-yellow-950/60 ring-2 ring-yellow-400/40',
  abandoned: 'border-gray-700 bg-gray-900/80',
};

const BADGE: Record<CellStatus, { icon: string; cls: string } | null> = {
  idle:      null,
  hunting:   { icon: '🎯', cls: 'text-blue-400' },
  found:     { icon: '✨', cls: 'text-yellow-400' },
  abandoned: { icon: '✗',  cls: 'text-gray-500 text-sm font-bold' },
};

export function BingoCell({ pokemon, status, note, shiny, showGame, canRegenerate, onClick, onRegenerate, onNoteChange }: BingoCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft]         = useState('');

  const sprite = shiny ? (pokemon.shinySprite || pokemon.sprite) : pokemon.sprite;
  const badge  = BADGE[status];

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(note);
    setIsEditing(true);
  };

  const commitEdit = () => {
    setIsEditing(false);
    onNoteChange(draft.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') { setIsEditing(false); }
  };

  return (
    <div className={`group relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-1.5 transition-all duration-200 ${BORDER[status]}`}>

      {/* Status badge — top-left */}
      {badge && (
        <span className={`absolute top-1 left-1.5 text-xs leading-none z-10 ${badge.cls}`}>
          {badge.icon}
        </span>
      )}

      {/* Edit note icon — top-left on hover, only when no badge to avoid overlap */}
      {!badge && (
        <button
          onClick={startEdit}
          title="Add a note"
          className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity
            w-5 h-5 rounded-full bg-gray-900/80 border border-gray-500
            flex items-center justify-center hover:bg-gray-600 hover:border-gray-400
            text-gray-400 hover:text-white text-[9px] z-10"
        >✏</button>
      )}

      {/* Regen button — top-right on hover */}
      {canRegenerate && (
        <button
          onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
          title="Replace this Pokémon"
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity
            w-5 h-5 rounded-full bg-gray-900/80 border border-gray-500
            flex items-center justify-center hover:bg-blue-600 hover:border-blue-400
            text-gray-300 hover:text-white text-[10px] z-10"
        >↺</button>
      )}

      {/* Sprite — clickable for status cycling */}
      <button onClick={onClick} className="flex-1 w-full flex items-center justify-center cursor-pointer select-none">
        <img
          src={sprite}
          alt={pokemon.name}
          className={`w-full max-w-[72px] object-contain transition-all
            ${status === 'found'     ? 'drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]' : ''}
            ${status === 'abandoned' ? 'grayscale opacity-40' : ''}
          `}
          loading="lazy"
        />
      </button>

      {/* Name */}
      <button onClick={onClick} className="w-full cursor-pointer select-none">
        <span className={`block text-center text-[10px] font-semibold leading-tight
          ${status === 'found'     ? 'text-yellow-300' : ''}
          ${status === 'hunting'   ? 'text-blue-300'   : ''}
          ${status === 'abandoned' ? 'text-gray-600'   : ''}
          ${status === 'idle'      ? 'text-gray-200'   : ''}
        `}>
          {pokemon.name}
        </span>
      </button>

      {/* Note — below name, inside card */}
      <div className="w-full mt-0.5 min-h-[13px]">
        {isEditing ? (
          <input
            autoFocus
            maxLength={MAX_NOTE}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-[9px] bg-gray-900/80 border border-blue-500 rounded px-1 py-0.5
              text-gray-200 placeholder-gray-600 focus:outline-none text-center"
          />
        ) : note ? (
          <p
            onClick={startEdit}
            title={`${note} — click to edit`}
            className="text-[9px] text-gray-400 text-center truncate cursor-text hover:text-gray-200 transition-colors leading-tight"
          >
            {note}
          </p>
        ) : null}
      </div>

      {/* Game label */}
      {showGame && (
        <span className="text-center text-[8px] text-gray-500 leading-tight mt-0.5 truncate w-full px-1">
          {pokemon.gameLabel}
        </span>
      )}
    </div>
  );
}
