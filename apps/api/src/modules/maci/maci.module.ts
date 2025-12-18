import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaciService } from './maci.service';
import { MaciController } from './maci.controller';
import { PollsModule } from '../polls/polls.module';
import { ResultsMetaModule } from '../results-meta/results-meta.module';
import { SmartNonceService } from './smart-nonce.service';
import { NonceSyncJob } from './nonce-sync.job';
import { SubgraphService } from './subgraph.service';
import { MaciDeploymentsService } from './maci-deployments.service';
import { MaciDeployment, MaciDeploymentSchema } from './schemas/maci-deployment.schema';

import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: MaciDeployment.name, schema: MaciDeploymentSchema },
    ]),
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
  providers: [MaciService, SmartNonceService, NonceSyncJob, SubgraphService, MaciDeploymentsService],
  exports: [MaciService, SmartNonceService, SubgraphService, MaciDeploymentsService],
})
export class MaciModule {}