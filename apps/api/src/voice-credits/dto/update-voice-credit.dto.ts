import { PartialType } from '@nestjs/mapped-types';
import { CreateVoiceCreditDto } from './create-voice-credit.dto';

export class UpdateVoiceCreditDto extends PartialType(CreateVoiceCreditDto) {}
