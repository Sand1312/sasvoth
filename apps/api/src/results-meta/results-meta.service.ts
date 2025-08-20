import { Injectable } from '@nestjs/common';
import { CreateResultsMetaDto } from './dto/create-results-meta.dto';
import { UpdateResultsMetaDto } from './dto/update-results-meta.dto';

@Injectable()
export class ResultsMetaService {
  create(createResultsMetaDto: CreateResultsMetaDto) {
    return 'This action adds a new resultsMeta';
  }

  findAll() {
    return `This action returns all resultsMeta`;
  }

  findOne(id: number) {
    return `This action returns a #${id} resultsMeta`;
  }

  update(id: number, updateResultsMetaDto: UpdateResultsMetaDto) {
    return `This action updates a #${id} resultsMeta`;
  }

  remove(id: number) {
    return `This action removes a #${id} resultsMeta`;
  }
}
