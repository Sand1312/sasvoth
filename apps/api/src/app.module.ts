import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { IdeasModule } from './modules/ideas/ideas.module';
import { ResultsMetaModule } from './modules/results-meta/results-meta.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { UsersModule } from './modules/users/users.module';
import { VoiceCreditsModule } from './modules/voice-credits/voice-credits.module';
import { VotesModule } from './modules/votes/votes.module';
import { PollsModule } from './modules/polls/polls.module';
import { RedisModule } from "@nestjs-modules/ioredis";
import { JwtModule } from "@nestjs/jwt";
// import { IdeasModule } from './modules/ideas/ideas.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    VoiceCreditsModule,
    PollsModule,
    ResultsMetaModule,
    RewardsModule,
    VotesModule,
    AuthModule,
    IdeasModule,
    // IdeasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
