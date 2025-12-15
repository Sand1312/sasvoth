import { Module, forwardRef } from '@nestjs/common';
import { MaciService } from './maci.service';
import { MaciController } from './maci.controller';
import { PollsModule } from '../polls/polls.module';
import { ResultsMetaModule } from '../results-meta/results-meta.module';

import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => PollsModule),
    forwardRef(() => ResultsMetaModule),
  ],
  controllers: [MaciController],
  providers: [MaciService],
  exports: [MaciService],
})
export class MaciModule {}