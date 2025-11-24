import { Module } from '@nestjs/common';
import { MaciService } from './maci.service';
import { MaciController } from './maci.controller';

@Module({
  controllers: [MaciController],
  providers: [MaciService],
  exports: [MaciService],
})
export class MaciModule {}