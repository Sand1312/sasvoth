import { PartialType } from '@nestjs/mapped-types';
import { CreateVotingEventDto } from './create-voting-event.dto';

export class UpdateVotingEventDto extends PartialType(CreateVotingEventDto) {}
