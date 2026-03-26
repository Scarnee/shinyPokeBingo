import React, { useState } from 'react';

const GAME_GROUPS: { label: string; genKey: string; games: { id: string; fallback: string }[] }[] = [
  {
    label: 'Generation I',
    genKey: 'gen1',
    games: [
      { id: 'red', fallback: 'Red' },
      { id: 'blue', fallback: 'Blue' },
      { id: 'yellow', fallback: 'Yellow' },
    ],
  },
  {
    label: 'Generation II',
    genKey: 'gen2',
    games: [
      { id: 'gold', fallback: 'Gold' },
      { id: 'silver', fallback: 'Silver' },
      { id: 'crystal', fallback: 'Crystal' },
    ],
  },
  {
    label: 'Generation III',
    genKey: 'gen3',
    games: [
      { id: 'ruby', fallback: 'Ruby' },
      { id: 'sapphire', fallback: 'Sapphire' },
      { id: 'emerald', fallback: 'Emerald' },
      { id: 'firered', fallback: 'FireRed' },
      { id: 'leafgreen', fallback: 'LeafGreen' },
    ],
  },
  {
    label: 'Generation IV',
    genKey: 'gen4',
    games: [
      { id: 'diamond', fallback: 'Diamond' },
      { id: 'pearl', fallback: 'Pearl' },
      { id: 'platinum', fallback: 'Platinum' },
      { id: 'heartgold', fallback: 'HeartGold' },
      { id: 'soulsilver', fallback: 'SoulSilver' },
    ],
  },
  {
    label: 'Generation V',
    genKey: 'gen5',
    games: [
      { id: 'black', fallback: 'Black' },
      { id: 'white', fallback: 'White' },
      { id: 'black-2', fallback: 'Black 2' },
      { id: 'white-2', fallback: 'White 2' },
    ],
  },
  {
    label: 'Generation VI',
    genKey: 'gen6',
    games: [
      { id: 'x', fallback: 'X' },
      { id: 'y', fallback: 'Y' },
      { id: 'omega-ruby', fallback: 'Omega Ruby' },
      { id: 'alpha-sapphire', fallback: 'Alpha Sapphire' },
    ],
  },
  {
    label: 'Generation VII',
    genKey: 'gen7',
    games: [
      { id: 'sun', fallback: 'Sun' },
      { id: 'moon', fallback: 'Moon' },
      { id: 'ultra-sun', fallback: 'Ultra Sun' },
      { id: 'ultra-moon', fallback: 'Ultra Moon' },
      { id: 'lets-go-pikachu', fallback: "Let's Go Pikachu" },
      { id: 'lets-go-eevee', fallback: "Let's Go Eevee" },
    ],
  },
  {
    label: 'Generation VIII',
    genKey: 'gen8',
    games: [
      { id: 'sword', fallback: 'Sword' },
      { id: 'shield', fallback: 'Shield' },
      { id: 'the-isle-of-armor', fallback: 'Isle of Armor' },
      { id: 'the-crown-tundra', fallback: 'Crown Tundra' },
      { id: 'brilliant-diamond', fallback: 'Brilliant Diamond' },
      { id: 'shining-pearl', fallback: 'Shining Pearl' },
      { id: 'legends-arceus', fallback: 'Legends: Arceus' },
    ],
  },
  {
    label: 'Generation IX',
    genKey: 'gen9',
    games: [
      { id: 'scarlet', fallback: 'Scarlet' },
      { id: 'violet', fallback: 'Violet' },
      { id: 'the-teal-mask', fallback: 'Teal Mask' },
      { id: 'the-indigo-disk', fallback: 'Indigo Disk' },
      { id: 'legends-za', fallback: 'Legends: Z-A' },
    ],
  },
];

interface GameSelectorProps {
  selected: string[];
  gameNames: Record<string, string>;
  onChange: (games: string[]) => void;
}

export function GameSelector({ selected, gameNames, onChange }: GameSelectorProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['gen1']));
  const selectedSet = new Set(selected);

  const toggle = (id: string) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  const toggleGroup = (games: { id: string }[]) => {
    const allSelected = games.every((g) => selectedSet.has(g.id));
    const next = new Set(selectedSet);
    for (const g of games) {
      if (allSelected) next.delete(g.id);
      else next.add(g.id);
    }
    onChange(Array.from(next));
  };

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-0.5">
      {GAME_GROUPS.map((group) => {
        const allSelected = group.games.every((g) => selectedSet.has(g.id));
        const someSelected = group.games.some((g) => selectedSet.has(g.id));
        const isExpanded = expanded.has(group.genKey);
        const selectedCount = group.games.filter((g) => selectedSet.has(g.id)).length;

        return (
          <div key={group.genKey} className="rounded-lg overflow-hidden">
            {/* Group header row */}
            <div className="flex items-center gap-1">
              {/* All-toggle checkbox */}
              <button
                onClick={() => toggleGroup(group.games)}
                className={`
                  w-4 h-4 rounded flex-shrink-0 border transition-colors
                  ${allSelected ? 'bg-blue-500 border-blue-500' : someSelected ? 'bg-blue-500/40 border-blue-500/60' : 'border-gray-500 bg-transparent'}
                `}
                title={allSelected ? 'Deselect all' : 'Select all'}
              />
              {/* Expand/collapse button */}
              <button
                onClick={() => toggleExpand(group.genKey)}
                className="flex-1 flex items-center justify-between py-1.5 px-1 text-left text-xs font-semibold text-gray-300 hover:text-white transition-colors rounded"
              >
                <span>{group.label}</span>
                <span className="flex items-center gap-1.5">
                  {selectedCount > 0 && (
                    <span className="text-blue-400 font-bold">{selectedCount}/{group.games.length}</span>
                  )}
                  <span className="text-gray-500 text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                </span>
              </button>
            </div>

            {/* Game buttons — only shown when expanded */}
            {isExpanded && (
              <div className="flex flex-wrap gap-1 pb-2 pl-5">
                {group.games.map((game) => {
                  const isSelected = selectedSet.has(game.id);
                  const label = gameNames[game.id] || game.fallback;
                  return (
                    <button
                      key={game.id}
                      onClick={() => toggle(game.id)}
                      className={`
                        px-2 py-0.5 rounded text-xs font-medium transition-all
                        ${
                          isSelected
                            ? 'bg-blue-600 text-white border border-blue-500'
                            : 'bg-gray-700 text-gray-400 border border-gray-600 hover:border-blue-500 hover:text-white'
                        }
                      `}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
