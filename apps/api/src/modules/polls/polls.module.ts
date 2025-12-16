import { Module, forwardRef } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { MongooseModule } from '@nestjs/mongoose';
import {Polls, PollsSchema} from './schemas/polls';
import { ResultsMetaModule } from '../results-meta/results-meta.module';

@Module({
  
  imports: [
    MongooseModule.forFeature([{name: 'Polls', schema: PollsSchema  }]),
    forwardRef(() => ResultsMetaModule),
  ],
  controllers: [PollsController],
  providers: [PollsService],
  exports: [PollsService]
})
export class PollsModule {}
