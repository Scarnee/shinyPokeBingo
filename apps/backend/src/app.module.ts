import { Module } from '@nestjs/common';
import { BingoModule } from './bingo/bingo.module';
import { PokeApiModule } from './pokeapi/pokeapi.module';

@Module({
  imports: [BingoModule, PokeApiModule],
})
export class AppModule {}
