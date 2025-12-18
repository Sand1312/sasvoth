import { Module } from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { IdeasController } from './ideas.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Ideas, IdeasSchema } from './schemas/ideas.schema';
import { Users, UsersSchema } from '../users/schemas/users.schema';
import { DobGuard } from '@/common/guards/dob';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: Ideas.name, schema: IdeasSchema },
      { name: Users.name, schema: UsersSchema },
    ])
  ],
  controllers: [IdeasController],
  providers: [IdeasService, DobGuard],
  exports: [DobGuard],
})
export class IdeasModule {}

