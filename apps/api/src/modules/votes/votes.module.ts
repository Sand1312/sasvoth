import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { Votes, VotesSchema } from './schemas/votes.schema';
import { VoiceCreditsModule } from '../voice-credits/voice-credits.module';

@Module({
    imports:[
        MongooseModule.forFeature([{name: 'Votes', schema: VotesSchema}]),
        VoiceCreditsModule
    ],
    controllers: [VotesController],
    providers: [VotesService],
    exports: [VotesService
    ]
})
export class VotesModule {}
