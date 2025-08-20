import { Module } from '@nestjs/common';
import { VotingEventService } from './voting-event.service';
import { VotingEventController } from './voting-event.controller';

@Module({
  controllers: [VotingEventController],
  providers: [VotingEventService],
})
export class VotingEventModule {}
