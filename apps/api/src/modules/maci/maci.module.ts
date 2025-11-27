import { Module } from '@nestjs/common';
import { MaciService } from './maci.service';
import { MaciController } from './maci.controller';
import { PollsModule } from '../polls/polls.module';
import { JoinPollModule } from '../join-poll/join-poll.module';

@Module({
  imports: [
    PollsModule,
    JoinPollModule,
  ],
  controllers: [MaciController],
  providers: [MaciService],
  exports: [MaciService],
})
export class MaciModule {}