import { Module } from '@nestjs/common';
import { BingoController } from './bingo.controller';
import { BingoService } from './bingo.service';
import { PokeApiModule } from '../pokeapi/pokeapi.module';

@Module({
  imports: [PokeApiModule],
  controllers: [BingoController],
  providers: [BingoService],
})
export class BingoModule {}
