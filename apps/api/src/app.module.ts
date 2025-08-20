import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { VoiceCreditsModule } from './voice-credits/voice-credits.module';
import { VotingEventModule } from './voting-event/voting-event.module';
import { ResultsMetaModule } from './results-meta/results-meta.module';
import { RewardsModule } from './rewards/rewards.module';
import { VotesMetaModule } from './votes-meta/votes-meta.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/voting_system'),
    UsersModule,
    VoiceCreditsModule,
    VotingEventModule,
    ResultsMetaModule,
    RewardsModule,
    VotesMetaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
