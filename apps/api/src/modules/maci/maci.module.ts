import { Module } from '@nestjs/common';
import { MaciService } from './maci.service';
import { MaciController } from './maci.controller';
import { PollsModule } from '../polls/polls.module';
import { VotesModule } from '../votes/votes.module';

@Module({
  imports: [
    PollsModule,
    VotesModule,
  ],
  controllers: [MaciController],
  providers: [MaciService],
  exports: [MaciService],
})
export class MaciModule {}