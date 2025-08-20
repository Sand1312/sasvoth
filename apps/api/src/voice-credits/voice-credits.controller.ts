import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VoiceCreditsService } from './voice-credits.service';
import { CreateVoiceCreditDto } from './dto/create-voice-credit.dto';
import { UpdateVoiceCreditDto } from './dto/update-voice-credit.dto';

@Controller('voice-credits')
export class VoiceCreditsController {
  constructor(private readonly voiceCreditsService: VoiceCreditsService) {}

  @Post()
  create(@Body() createVoiceCreditDto: CreateVoiceCreditDto) {
    return this.voiceCreditsService.create(createVoiceCreditDto);
  }

  @Get()
  findAll() {
    return this.voiceCreditsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.voiceCreditsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVoiceCreditDto: UpdateVoiceCreditDto) {
    return this.voiceCreditsService.update(+id, updateVoiceCreditDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.voiceCreditsService.remove(+id);
  }
}
