import { Module } from '@nestjs/common';
import { VotesMetaService } from './votes-meta.service';
import { VotesMetaController } from './votes-meta.controller';

@Module({
  controllers: [VotesMetaController],
  providers: [VotesMetaService],
})
export class VotesMetaModule {}
