import { Module } from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { IdeasController } from './ideas.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Ideas, IdeasSchema } from './schemas/ideas.schema';

@Module({
  imports:[
    MongooseModule.forFeature([{ name: Ideas.name, schema: IdeasSchema }])
  ],
  controllers: [IdeasController],
  providers: [IdeasService],
})
export class IdeasModule {}
