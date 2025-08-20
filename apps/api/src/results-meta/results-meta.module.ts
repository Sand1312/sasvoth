import { Module } from '@nestjs/common';
import { ResultsMetaService } from './results-meta.service';
import { ResultsMetaController } from './results-meta.controller';

@Module({
  controllers: [ResultsMetaController],
  providers: [ResultsMetaService],
})
export class ResultsMetaModule {}
