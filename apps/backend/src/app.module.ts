import { Module } from '@nestjs/common';
import { BingoModule } from './bingo/bingo.module';
import { PokeApiModule } from './pokeapi/pokeapi.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [BingoModule, PokeApiModule, MetricsModule],
})
export class AppModule {}
