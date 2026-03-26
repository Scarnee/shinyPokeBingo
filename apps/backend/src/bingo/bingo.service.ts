import { Injectable, BadRequestException } from '@nestjs/common';
import { PokeApiService } from '../pokeapi/pokeapi.service';
import { GenerateBingoDto } from './bingo.dto';

export interface Pokemon {
  name: string;
  sprite: string;
  shinySprite: string;
  game: string;       // game ID (e.g. "omega-ruby")
  gameLabel: string;  // localized game name (e.g. "Rubis Oméga")
}

@Injectable()
export class BingoService {
  constructor(private readonly pokeApiService: PokeApiService) {}

  async generateGrid(dto: GenerateBingoDto): Promise<{ grid: Pokemon[][]; extras: Pokemon[] }> {
    const { gridSize, games, language = 'en' } = dto;

    if (!gridSize || gridSize < 2 || gridSize > 10) {
      throw new BadRequestException('gridSize must be between 2 and 10');
    }
    if (!games || games.length === 0) {
      throw new BadRequestException('At least one game must be selected');
    }

    const total = gridSize * gridSize;

    // Fetch pool + version names in parallel
    const [poolResult, versionNames] = await Promise.all([
      this.pokeApiService.getPokemonPool(games, language),
      this.pokeApiService.getVersionNamesForLanguage(language),
    ]);

    const { pokemon, speciesGames } = poolResult;

    if (pokemon.length < total) {
      throw new BadRequestException(
        `Not enough Pokémon (${pokemon.length}) for a ${gridSize}×${gridSize} grid (needs ${total}). Try selecting more games.`,
      );
    }

    // Shuffle — input list is already deduplicated (unique species IDs)
    const shuffled = this.shuffle([...pokemon]);

    // Assign a random game origin to each Pokémon
    const withGame = shuffled.map((p) => {
      const candidates = speciesGames.get(p.id) ?? games;
      const assignedGame = candidates[Math.floor(Math.random() * candidates.length)];
      return {
        name: p.name,
        sprite: p.sprite,
        shinySprite: p.shinySprite,
        game: assignedGame,
        gameLabel: versionNames[assignedGame] ?? assignedGame,
      } satisfies Pokemon;
    });

    const selected = withGame.slice(0, total);
    const extras = withGame.slice(total, total + Math.min(total * 3, withGame.length - total));

    const grid: Pokemon[][] = [];
    for (let row = 0; row < gridSize; row++) {
      grid.push(selected.slice(row * gridSize, (row + 1) * gridSize));
    }

    return { grid, extras };
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
