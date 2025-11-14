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
import { VotesModule } from './modules/votes/votes.module';
import { VotingEventsModule } from "./modules/voting-events/voting-events.module"
import { RedisModule } from "@nestjs-modules/ioredis";
import { JwtModule } from "@nestjs/jwt";
import { IdeasModule } from './ideas/ideas.module';

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
    // RedisModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: async (configService: ConfigService) => ({
    //     type: 'single',
    //     url: configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
    //   }),
    //   inject: [ConfigService],
    // }),
    // JwtModule.registerAsync({
    //   imports: [ConfigModule],
    //   useFactory: async (configService: ConfigService) => ({
    //     secret: configService.get('JWT_SECRET'),
    //     signOptions: { expiresIn: configService.get('1h') },
    //   }),
    //   inject: [ConfigService],
    // }),
    UsersModule,
    VoiceCreditsModule,
    VotingEventsModule,
    ResultsMetaModule,
    RewardsModule,
    VotesModule,
    AuthModule,
    VotingEventsModule,
    IdeasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
