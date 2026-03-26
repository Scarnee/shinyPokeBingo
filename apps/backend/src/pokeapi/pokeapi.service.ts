import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configurable — point to self-hosted instance to eliminate external calls
const POKEAPI_BASE = process.env.POKEAPI_BASE_URL?.replace(/\/$/, '') || 'https://pokeapi.co/api/v2';
const CACHE_DIR = process.env.CACHE_DIR || '';

interface PokemonApiDetail {
  sprites: {
    front_shiny: string;
    front_default: string;
    other?: {
      'official-artwork'?: { front_shiny: string; front_default: string };
    };
  };
}

interface SpeciesApiDetail {
  names: Array<{ name: string; language: { name: string } }>;
}

interface VersionApiDetail {
  names: Array<{ name: string; language: { name: string } }>;
}

// In-memory representation
interface CachedPokemon {
  id: string;
  sprite: string;
  shinySprite: string;
  langNames: Map<string, string>;
}

// On-disk representation (Maps → plain objects)
interface CachedPokemonDisk {
  id: string;
  sprite: string;
  shinySprite: string;
  langNames: Record<string, string>;
}

export interface PokemonData {
  id: string;
  name: string;
  sprite: string;
  shinySprite: string;
}

export interface PokemonPoolResult {
  pokemon: PokemonData[];
  speciesGames: Map<string, string[]>;
}

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  'zh-Hans': '中文',
};

export const SUPPORTED_GAME_IDS = [
  'red', 'blue', 'yellow',
  'gold', 'silver', 'crystal',
  'ruby', 'sapphire', 'emerald', 'firered', 'leafgreen',
  'diamond', 'pearl', 'platinum', 'heartgold', 'soulsilver',
  'black', 'white', 'black-2', 'white-2',
  'x', 'y', 'omega-ruby', 'alpha-sapphire',
  'sun', 'moon', 'ultra-sun', 'ultra-moon',
  'lets-go-pikachu', 'lets-go-eevee',
  'sword', 'shield', 'the-isle-of-armor', 'the-crown-tundra',
  'brilliant-diamond', 'shining-pearl',
  'legends-arceus',
  'scarlet', 'violet', 'the-teal-mask', 'the-indigo-disk',
  'legends-za',
];

@Injectable()
export class PokeApiService implements OnModuleInit {
  private readonly logger = new Logger(PokeApiService.name);

  private gameCache = new Map<string, Set<string>>();
  private pokemonCache = new Map<string, CachedPokemon>();
  private versionNameCache = new Map<string, Map<string, string>>();
  private poolCache = new Map<string, PokemonPoolResult>();

  // ── Startup: warm up from disk cache ──────────────────────────────────────

  async onModuleInit() {
    if (!CACHE_DIR) {
      this.logger.warn('CACHE_DIR not set — data will not persist across restarts');
      return;
    }
    this.logger.log(`Disk cache enabled at: ${CACHE_DIR}`);
    await this.loadAllFromDisk();
  }

  private async loadAllFromDisk(): Promise<void> {
    try {
      // Load game → species lists
      const gamesDir = path.join(CACHE_DIR, 'games');
      const gameFiles = await fs.readdir(gamesDir).catch(() => []);
      for (const file of gameFiles) {
        const game = file.replace('.json', '');
        const ids = await this.readDisk<string[]>(path.join('games', file));
        if (ids) this.gameCache.set(game, new Set(ids));
      }
      this.logger.log(`Loaded ${this.gameCache.size} game(s) from disk cache`);

      // Load individual pokemon details
      const pokemonDir = path.join(CACHE_DIR, 'pokemon');
      const pokemonFiles = await fs.readdir(pokemonDir).catch(() => []);
      for (const file of pokemonFiles) {
        const disk = await this.readDisk<CachedPokemonDisk>(path.join('pokemon', file));
        if (disk) {
          this.pokemonCache.set(disk.id, {
            ...disk,
            langNames: new Map(Object.entries(disk.langNames)),
          });
        }
      }
      this.logger.log(`Loaded ${this.pokemonCache.size} Pokémon from disk cache`);

      // Load version name maps
      const versionsDir = path.join(CACHE_DIR, 'versions');
      const versionFiles = await fs.readdir(versionsDir).catch(() => []);
      for (const file of versionFiles) {
        const lang = file.replace('.json', '');
        const names = await this.readDisk<Record<string, string>>(path.join('versions', file));
        if (names) this.versionNameCache.set(lang, new Map(Object.entries(names)));
      }
      this.logger.log(`Loaded ${this.versionNameCache.size} version name map(s) from disk cache`);
    } catch (e) {
      this.logger.warn(`Disk cache load error: ${e}`);
    }
  }

  // ── Disk helpers ──────────────────────────────────────────────────────────

  private async readDisk<T>(relativePath: string): Promise<T | null> {
    if (!CACHE_DIR) return null;
    try {
      const raw = await fs.readFile(path.join(CACHE_DIR, relativePath), 'utf-8');
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private async writeDisk(relativePath: string, data: unknown): Promise<void> {
    if (!CACHE_DIR) return;
    try {
      const fullPath = path.join(CACHE_DIR, relativePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, JSON.stringify(data), 'utf-8');
    } catch (e) {
      this.logger.warn(`Cache write failed (${relativePath}): ${e}`);
    }
  }

  // ── Main: get Pokémon pool for a set of games ──────────────────────────────

  async getPokemonPool(games: string[], language = 'en'): Promise<PokemonPoolResult> {
    const cacheKey = `${[...games].sort().join(',')}:${language}`;
    if (this.poolCache.has(cacheKey)) return this.poolCache.get(cacheKey)!;

    this.logger.log(`Building pool for [${games.join(', ')}] lang=${language}`);

    const allIds = new Set<string>();
    await Promise.all(games.map(async (game) => {
      const ids = await this.getSpeciesIdsForGame(game);
      ids.forEach((id) => allIds.add(id));
    }));

    this.logger.log(`${allIds.size} unique species. Ensuring details are cached…`);
    await this.ensureCached([...allIds]);

    // Build speciesGames reverse map
    const speciesGames = new Map<string, string[]>();
    for (const game of games) {
      const idsForGame = this.gameCache.get(game) ?? new Set();
      for (const id of allIds) {
        if (idsForGame.has(id)) {
          if (!speciesGames.has(id)) speciesGames.set(id, []);
          speciesGames.get(id)!.push(game);
        }
      }
    }

    const seenNames = new Set<string>();
    const pokemon: PokemonData[] = [];
    for (const id of allIds) {
      const cached = this.pokemonCache.get(id);
      if (!cached) continue;
      const name =
        cached.langNames.get(language) ??
        cached.langNames.get('en') ??
        this.formatName(id);
      if (seenNames.has(name)) continue;
      seenNames.add(name);
      pokemon.push({ id, name, sprite: cached.sprite, shinySprite: cached.shinySprite });
    }

    this.logger.log(`Pool ready: ${pokemon.length} Pokémon`);
    const result: PokemonPoolResult = { pokemon, speciesGames };
    this.poolCache.set(cacheKey, result);
    return result;
  }

  // ── Game → species IDs (via pokedex) ─────────────────────────────────────

  private async getSpeciesIdsForGame(game: string): Promise<Set<string>> {
    if (this.gameCache.has(game)) return this.gameCache.get(game)!;

    try {
      const versionRes = await axios.get(`${POKEAPI_BASE}/version/${game}`);
      const vgRes = await axios.get(versionRes.data.version_group.url);
      const pokedexUrls: string[] = vgRes.data.pokedexes.map((p: { url: string }) => p.url);

      const namesPerPokedex = await Promise.all(
        pokedexUrls.map(async (url) => {
          const pdRes = await axios.get(url);
          return pdRes.data.pokemon_entries.map(
            (e: { pokemon_species: { name: string } }) => e.pokemon_species.name,
          ) as string[];
        }),
      );

      const ids = new Set(namesPerPokedex.flat());
      this.gameCache.set(game, ids);
      this.logger.log(`"${game}": ${ids.size} species — saving to disk`);
      // Persist to disk (non-blocking)
      this.writeDisk(path.join('games', `${game}.json`), [...ids]);
      return ids;
    } catch {
      this.logger.warn(`Could not fetch Pokémon for game: "${game}"`);
      const empty = new Set<string>();
      this.gameCache.set(game, empty);
      return empty;
    }
  }

  // ── Species details (sprite + names) ─────────────────────────────────────

  private async ensureCached(ids: string[]): Promise<void> {
    const uncached = ids.filter((id) => !this.pokemonCache.has(id));
    if (uncached.length === 0) return;

    this.logger.log(`${uncached.length} species need fetching…`);

    for (let i = 0; i < uncached.length; i += 20) {
      const batch = uncached.slice(i, i + 20);
      await Promise.all(
        batch.map(async (id) => {
          const [pkRes, spRes] = await Promise.allSettled([
            axios.get<PokemonApiDetail>(`${POKEAPI_BASE}/pokemon/${id}`),
            axios.get<SpeciesApiDetail>(`${POKEAPI_BASE}/pokemon-species/${id}`),
          ]);

          let sprite = '', shinySprite = '';
          if (pkRes.status === 'fulfilled') {
            const s = pkRes.value.data.sprites;
            sprite = s?.other?.['official-artwork']?.front_default || s?.front_default || '';
            shinySprite = s?.other?.['official-artwork']?.front_shiny || s?.front_shiny || sprite;
          }

          const langNames = new Map<string, string>();
          if (spRes.status === 'fulfilled') {
            for (const e of spRes.value.data.names) langNames.set(e.language.name, e.name);
          }

          if (sprite) {
            const cached: CachedPokemon = { id, sprite, shinySprite, langNames };
            this.pokemonCache.set(id, cached);
            // Persist to disk
            const disk: CachedPokemonDisk = {
              id, sprite, shinySprite,
              langNames: Object.fromEntries(langNames),
            };
            this.writeDisk(path.join('pokemon', `${id}.json`), disk);
          }
        }),
      );
    }
  }

  // ── Localized version names ───────────────────────────────────────────────

  async getVersionNamesForLanguage(lang: string): Promise<Record<string, string>> {
    if (this.versionNameCache.has(lang)) {
      return Object.fromEntries(this.versionNameCache.get(lang)!);
    }

    const langMap = new Map<string, string>();
    await Promise.all(
      SUPPORTED_GAME_IDS.map(async (id) => {
        try {
          const res = await axios.get<VersionApiDetail>(`${POKEAPI_BASE}/version/${id}`);
          const entry =
            res.data.names.find((n) => n.language.name === lang) ??
            res.data.names.find((n) => n.language.name === 'en');
          if (entry) langMap.set(id, entry.name);
        } catch { /* keep slug */ }
      }),
    );

    this.versionNameCache.set(lang, langMap);
    this.writeDisk(path.join('versions', `${lang}.json`), Object.fromEntries(langMap));
    return Object.fromEntries(langMap);
  }

  async getAvailableGames(): Promise<string[]> {
    try {
      const res = await axios.get<{ results: Array<{ name: string }> }>(
        `${POKEAPI_BASE}/version?limit=100`,
      );
      return res.data.results.map((v) => v.name);
    } catch { return []; }
  }

  private formatName(name: string): string {
    return name.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }
}
