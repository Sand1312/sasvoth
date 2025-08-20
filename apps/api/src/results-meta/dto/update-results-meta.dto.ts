import { PartialType } from '@nestjs/mapped-types';
import { CreateResultsMetaDto } from './create-results-meta.dto';

export class UpdateResultsMetaDto extends PartialType(CreateResultsMetaDto) {}
