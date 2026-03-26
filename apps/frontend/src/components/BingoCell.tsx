import React from 'react';
import { Pokemon } from '../api/bingo';

interface BingoCellProps {
  pokemon: Pokemon;
  marked: boolean;
  shiny: boolean;
  showGame: boolean;
  canRegenerate: boolean;
  onClick: () => void;
  onRegenerate: () => void;
}

export function BingoCell({
  pokemon,
  marked,
  shiny,
  showGame,
  canRegenerate,
  onClick,
  onRegenerate,
}: BingoCellProps) {
  const sprite = shiny ? (pokemon.shinySprite || pokemon.sprite) : pokemon.sprite;

  return (
    <div
      className={`relative group aspect-square${marked ? ' is-marked' : ''}`}
      data-bingo-cell=""
    >
      <button
        onClick={onClick}
        className={`
          w-full h-full flex flex-col items-center justify-center p-1.5 rounded-xl border-2
          transition-all duration-200 cursor-pointer select-none
          ${marked
            ? 'border-yellow-400 bg-yellow-400/20 scale-95 shadow-lg shadow-yellow-400/30'
            : 'border-gray-600 bg-gray-800 hover:border-blue-400 hover:bg-gray-700'}
        `}
      >
        {marked && (
          <span className="absolute text-yellow-400 text-4xl font-bold opacity-25 pointer-events-none">
            ✓
          </span>
        )}

        <img
          src={sprite}
          alt={pokemon.name}
          className={`w-full max-w-[72px] object-contain transition-opacity ${marked ? 'opacity-50' : 'opacity-100'}`}
          loading="lazy"
        />

        <span className={`text-center text-[10px] font-semibold mt-0.5 leading-tight ${marked ? 'text-yellow-300' : 'text-gray-200'}`}>
          {pokemon.name}
        </span>

        {showGame && (
          <span className="text-center text-[8px] text-gray-500 leading-tight mt-0.5 truncate w-full px-1">
            {pokemon.gameLabel}
          </span>
        )}
      </button>

      {/* Regenerate button — hover only */}
      {canRegenerate && (
        <button
          data-regen-btn=""
          onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
          title="Replace this Pokémon"
          className="
            absolute top-1 right-1
            opacity-0 group-hover:opacity-100 transition-opacity duration-150
            w-5 h-5 rounded-full bg-gray-900/80 border border-gray-500
            flex items-center justify-center
            hover:bg-blue-600 hover:border-blue-400
            text-gray-300 hover:text-white text-[10px] z-10
          "
        >
          ↺
        </button>
      )}
    </div>
  );
}
