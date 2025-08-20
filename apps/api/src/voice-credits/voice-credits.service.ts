import { Injectable } from '@nestjs/common';
import { CreateVoiceCreditDto } from './dto/create-voice-credit.dto';
import { UpdateVoiceCreditDto } from './dto/update-voice-credit.dto';

@Injectable()
export class VoiceCreditsService {
  create(createVoiceCreditDto: CreateVoiceCreditDto) {
    return 'This action adds a new voiceCredit';
  }

  findAll() {
    return `This action returns all voiceCredits`;
  }

  findOne(id: number) {
    return `This action returns a #${id} voiceCredit`;
  }

  update(id: number, updateVoiceCreditDto: UpdateVoiceCreditDto) {
    return `This action updates a #${id} voiceCredit`;
  }

  remove(id: number) {
    return `This action removes a #${id} voiceCredit`;
  }
}
