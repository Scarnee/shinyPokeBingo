import { useState, useEffect } from 'react';
import { generateBingo, getAvailableLanguages, getGameNames, Pokemon, Language } from './api/bingo';
import { BingoGrid } from './components/BingoGrid';
import { GameSelector } from './components/GameSelector';
import { LanguageSelector } from './components/LanguageSelector';

export default function App() {
  const [gridSize, setGridSize] = useState(5);
  const [selectedGames, setSelectedGames] = useState<string[]>(['red', 'blue']);
  const [language, setLanguage] = useState('en');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [gameNames, setGameNames] = useState<Record<string, string>>({});
  const [shiny, setShiny] = useState(false);
  const [showGame, setShowGame] = useState(false);

  const [grid, setGrid] = useState<Pokemon[][] | null>(null);
  const [extras, setExtras] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mobile drawer
  const [mobileOptionsOpen, setMobileOptionsOpen] = useState(false);

  useEffect(() => {
    getAvailableLanguages().then(setLanguages).catch(() => {});
  }, []);

  useEffect(() => {
    getGameNames(language).then(setGameNames).catch(() => {});
  }, [language]);

  const handleGenerate = async (closeMobile = false) => {
    if (selectedGames.length === 0) { setError('Please select at least one game.'); return; }
    if (closeMobile) setMobileOptionsOpen(false);
    setLoading(true);
    setError(null);
    setGrid(null);
    try {
      const result = await generateBingo({ gridSize, games: selectedGames, language });
      setGrid(result.grid);
      setExtras(result.extras);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to generate bingo grid. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Shared options panels ──────────────────────────────────────────────────

  const OptionsContent = () => (
    <>
      {/* Grid size */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
          Grid — <span className="text-yellow-400 normal-case text-xs">{gridSize}×{gridSize}</span>
        </p>
        <div className="flex gap-1.5">
          {[3, 4, 5, 6, 7].map((size) => (
            <button
              key={size}
              onClick={() => setGridSize(size)}
              className={`w-9 h-9 rounded-lg font-bold text-sm transition-all
                ${gridSize === size
                  ? 'bg-yellow-500 text-gray-900 shadow-md shadow-yellow-500/30 scale-110'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Language</p>
        {languages.length > 0
          ? <LanguageSelector languages={languages} selected={language} onChange={setLanguage} />
          : <p className="text-gray-600 text-xs">Loading…</p>}
      </div>

      {/* Display toggles */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Display</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Sprites</span>
            <div className="flex rounded-lg overflow-hidden border border-gray-600">
              <button
                onClick={() => setShiny(false)}
                className={`px-2.5 py-1 text-xs font-semibold transition-colors
                  ${!shiny ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
              >Normal</button>
              <button
                onClick={() => setShiny(true)}
                className={`px-2.5 py-1 text-xs font-semibold transition-colors
                  ${shiny ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
              >✨ Shiny</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Game origin</span>
            <button
              onClick={() => setShowGame((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                ${showGame ? 'bg-green-600' : 'bg-gray-600'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
                ${showGame ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-white overflow-hidden">

      {/* ════ DESKTOP SIDEBAR (hidden on mobile) ════ */}
      <aside className="hidden md:flex md:flex-col w-72 xl:w-80 flex-shrink-0 h-screen border-r border-gray-700/50 bg-gray-900/70 backdrop-blur">
        <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-700/40">
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
            Pokémon Bingo
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Custom bingo grid generator</p>
        </div>

        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-700/40 space-y-3">
          <OptionsContent />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 sticky top-0 bg-gray-900/80 py-1 z-10">
            Games — <span className="text-blue-400 normal-case text-xs font-normal">{selectedGames.length} selected</span>
          </p>
          <GameSelector selected={selectedGames} gameNames={gameNames} onChange={setSelectedGames} />
        </div>

        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-700/40 bg-gray-900/80">
          <button
            onClick={() => handleGenerate()}
            disabled={loading || selectedGames.length === 0}
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all
              ${loading || selectedGames.length === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-400 hover:to-red-400 text-white shadow-lg hover:scale-[1.02] active:scale-100'}`}
          >
            {loading ? <SpinnerLabel /> : 'Generate Bingo Grid'}
          </button>
          {loading && <p className="text-center text-gray-600 text-[10px] mt-1 animate-pulse">First load may take a moment…</p>}
        </div>
      </aside>

      {/* ════ MAIN CONTENT ════ */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">

        {/* Mobile top bar */}
        <header className="md:hidden flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-900/80">
          <h1 className="text-lg font-extrabold bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
            Pokémon Bingo
          </h1>
          <button
            onClick={() => setMobileOptionsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-colors"
          >
            <span>⚙</span>
            <span>Options{selectedGames.length > 0 && <span className="ml-1 text-blue-400 text-xs">{selectedGames.length}</span>}</span>
          </button>
        </header>

        {/* Grid area */}
        <main className="flex-1 flex flex-col items-center justify-center p-3 md:p-6 overflow-y-auto">
          {error && (
            <div className="no-print mb-4 w-full max-w-3xl p-3 bg-red-900/50 border border-red-500 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {grid ? (
            <div className="w-full">
              <div className="no-print flex items-center justify-between mb-2 md:mb-3 max-w-3xl mx-auto">
                <span className="text-xs md:text-sm text-gray-400">
                  {gridSize}×{gridSize}
                  {shiny && <span className="ml-1.5 text-yellow-400">✨</span>}
                  {showGame && <span className="ml-1.5 text-green-400 text-xs">· origins</span>}
                  <span className="ml-2 text-gray-600 text-xs hidden sm:inline">{extras.length} replacements</span>
                </span>
                <div className="flex items-center gap-2 md:gap-3">
                  <button onClick={() => window.print()} className="text-xs text-gray-400 hover:text-blue-400 transition-colors">↓ PDF</button>
                  <button onClick={() => handleGenerate()} className="text-xs text-gray-400 hover:text-yellow-400 transition-colors">↺ Regenerate</button>
                  <button onClick={() => { setGrid(null); setExtras([]); }} className="text-xs text-gray-400 hover:text-red-400 transition-colors">✕ Clear</button>
                </div>
              </div>
              <BingoGrid grid={grid} extras={extras} shiny={shiny} showGame={showGame} />
              <p className="no-print text-center text-gray-600 text-xs mt-2 md:mt-3 hidden sm:block">
                Click to mark · Hover for replace
              </p>
            </div>
          ) : (
            <div className="no-print text-center select-none px-4">
              {loading ? (
                <div className="text-gray-500 animate-pulse">
                  <div className="text-5xl mb-3 opacity-30">◉</div>
                  <p className="text-sm">Fetching Pokémon data…</p>
                  <p className="text-xs text-gray-600 mt-1">First load may take a moment</p>
                </div>
              ) : (
                <>
                  <div className="text-6xl md:text-7xl mb-3 md:mb-4 opacity-10">◉</div>
                  <p className="text-gray-600 text-sm md:text-base">
                    {window.innerWidth < 768
                      ? 'Tap ⚙ Options, then Generate'
                      : 'Configure your options and generate a grid'}
                  </p>
                </>
              )}
            </div>
          )}
        </main>

        {/* Mobile bottom generate button */}
        <div className="md:hidden flex-shrink-0 px-4 py-3 border-t border-gray-700/50 bg-gray-900/80 safe-area-bottom">
          <button
            onClick={() => handleGenerate()}
            disabled={loading || selectedGames.length === 0}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all
              ${loading || selectedGames.length === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-500 to-red-500 text-white shadow-lg active:scale-95'}`}
          >
            {loading ? <SpinnerLabel /> : 'Generate Bingo Grid'}
          </button>
        </div>
      </div>

      {/* ════ MOBILE OPTIONS DRAWER ════ */}
      {mobileOptionsOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOptionsOpen(false)}
          />

          {/* Drawer panel */}
          <div className="relative flex flex-col bg-gray-900 border-t border-gray-700 rounded-t-2xl max-h-[88vh]">
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-600" />
            </div>

            {/* Drawer header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 pb-3 border-b border-gray-700/50">
              <p className="font-bold text-gray-200">Options</p>
              <button
                onClick={() => setMobileOptionsOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white text-sm"
              >✕</button>
            </div>

            {/* Scrollable options */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              <OptionsContent />

              {/* Games inside drawer */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Games — <span className="text-blue-400 normal-case text-xs font-normal">{selectedGames.length} selected</span>
                </p>
                <GameSelector selected={selectedGames} gameNames={gameNames} onChange={setSelectedGames} />
              </div>
            </div>

            {/* Generate inside drawer */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-gray-700/50 bg-gray-900">
              <button
                onClick={() => handleGenerate(true)}
                disabled={loading || selectedGames.length === 0}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all
                  ${loading || selectedGames.length === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-500 to-red-500 text-white shadow-lg active:scale-95'}`}
              >
                {loading ? <SpinnerLabel /> : 'Generate Bingo Grid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpinnerLabel() {
  return (
    <span className="flex items-center justify-center gap-2">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Generating…
    </span>
  );
}
