import { Module } from '@nestjs/common';
import { VotingEventsController } from './voting-events.controller';
import { VotingEventsService } from './voting-events.service';
import { MongooseModule } from '@nestjs/mongoose';
import {VotingEvents, VotingEventsSchema} from './schemas/voting-events.schema';

@Module({
  
  imports: [
    MongooseModule.forFeature([{name: 'VotingEvents', schema: VotingEventsSchema  }])
  ],
  controllers: [VotingEventsController],
  providers: [VotingEventsService],
  exports: [VotingEventsService]
})
export class VotingEventsModule {}
