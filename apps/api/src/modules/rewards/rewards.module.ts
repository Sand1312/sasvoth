import { Module } from '@nestjs/common';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Rewards, RewardsSchema } from './schemas/rewards.schema';

@Module({
      imports: [
        MongooseModule.forFeature([{ name: 'Rewards', schema:RewardsSchema  }]),
      ],
      controllers: [RewardsController],
      providers: [RewardsService],
      exports: [RewardsService],
})
export class RewardsModule {}
