import { Module } from '@nestjs/common';
import { PokeApiService } from './pokeapi.service';

@Module({
  providers: [PokeApiService],
  exports: [PokeApiService],
})
export class PokeApiModule {}
