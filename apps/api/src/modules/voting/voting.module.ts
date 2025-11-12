import { Module } from '@nestjs/common'
import { ProofGeneratorService } from './services/proof-generator.service'
import { VotingController } from './controllers/voting.controller'

@Module({
  imports: [],
  providers: [ProofGeneratorService],
  controllers: [VotingController],
  exports: [ProofGeneratorService],
})
export class VotingModule {}