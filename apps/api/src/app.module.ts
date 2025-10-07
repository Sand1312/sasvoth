import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { ResultsMetaModule } from './modules/results-meta/results-meta.module';
import { VoiceCreditsModule } from './modules/voice-credits/voice-credits.module';
import { VotesMetaModule } from './modules/votes-meta/votes-meta.module';
import { VotingEventsModule } from './modules/voting-events/voting-events.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("MONGODB_URI"),
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({ isGlobal: true ,
      envFilePath: '.env',
    }),
    UsersModule,
    VoiceCreditsModule,
    VotingEventsModule,
    ResultsMetaModule,
    RewardsModule,
    VotesMetaModule,
    AuthModule,
    VotingEventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
