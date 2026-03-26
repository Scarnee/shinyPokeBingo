import { Controller, Post, Get, Body, Query, HttpCode } from '@nestjs/common';
import { BingoService } from './bingo.service';
import { GenerateBingoDto } from './bingo.dto';
import { PokeApiService, SUPPORTED_LANGUAGES } from '../pokeapi/pokeapi.service';

@Controller('bingo')
export class BingoController {
  constructor(
    private readonly bingoService: BingoService,
    private readonly pokeApiService: PokeApiService,
  ) {}

  @Post('generate')
  @HttpCode(200)
  async generate(@Body() dto: GenerateBingoDto) {
    return this.bingoService.generateGrid(dto);
  }

  @Get('games')
  async getGames() {
    const games = await this.pokeApiService.getAvailableGames();
    return { games };
  }

  @Get('languages')
  getLanguages() {
    return {
      languages: Object.entries(SUPPORTED_LANGUAGES).map(([code, label]) => ({ code, label })),
    };
  }

  @Get('game-names')
  async getGameNames(@Query('lang') lang: string) {
    const names = await this.pokeApiService.getVersionNamesForLanguage(lang || 'en');
    return { names };
  }
}
