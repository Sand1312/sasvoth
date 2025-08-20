import { Module } from '@nestjs/common';
import { VoiceCreditsService } from './voice-credits.service';
import { VoiceCreditsController } from './voice-credits.controller';

@Module({
  controllers: [VoiceCreditsController],
  providers: [VoiceCreditsService],
})
export class VoiceCreditsModule {}
