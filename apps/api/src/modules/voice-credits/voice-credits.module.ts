import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VoiceCreditsService } from './voice-credits.service';
import { VoiceCreditsController } from './voice-credits.controller';
import { VoiceCredits, VoiceCreditsSchema } from './schemas/voice-credis.schema';

// @Module({
//      imports: [
//         MongooseModule.forFeature([{name: 'Voice_Credits', schema: VoiceCreditsSchema}]) 
//     ],
//     controllers: [VoiceCreditsController],
//     providers: [VoiceCreditsService],
//     exports: [VoiceCreditsService]
// })

export class VoiceCreditsModule {}
