import { PartialType } from '@nestjs/mapped-types';
import { CreateVotesMetaDto } from './create-votes-meta.dto';

export class UpdateVotesMetaDto extends PartialType(CreateVotesMetaDto) {}
