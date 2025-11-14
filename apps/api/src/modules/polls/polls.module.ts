import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Polls, PollsSchema } from './schemas/polls.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Polls', schema: PollsSchema }]),
  ],
  controllers: [PollsController],
  providers: [PollsService],
  exports: [PollsService],
})
export class PollsModule {}
