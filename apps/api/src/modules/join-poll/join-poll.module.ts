import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JoinPollService } from './join-poll.service';
import { JoinPollController } from './join-poll.controller';
import { JoinPoll, JoinPollSchema } from './schemas/join-poll.schema';
import { VoiceCreditsModule } from '../voice-credits/voice-credits.module';

@Module({
    imports:[
        MongooseModule.forFeature([{name: 'JoinPoll', schema: JoinPollSchema}]),
        VoiceCreditsModule
    ],
    controllers: [JoinPollController],
    providers: [JoinPollService],
    exports: [JoinPollService
    ]
})
export class JoinPollModule {}
 