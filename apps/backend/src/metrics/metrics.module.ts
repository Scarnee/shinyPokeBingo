import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { collectDefaultMetrics } from 'prom-client';

// Collect Node.js default metrics (heap, event loop, CPU, etc.)
collectDefaultMetrics({ prefix: 'pokemon_bingo_' });

@Module({
  controllers: [MetricsController],
})
export class MetricsModule {}
