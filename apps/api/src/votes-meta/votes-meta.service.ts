import { Injectable } from '@nestjs/common';
import { CreateVotesMetaDto } from './dto/create-votes-meta.dto';
import { UpdateVotesMetaDto } from './dto/update-votes-meta.dto';

@Injectable()
export class VotesMetaService {
  create(createVotesMetaDto: CreateVotesMetaDto) {
    return 'This action adds a new votesMeta';
  }

  findAll() {
    return `This action returns all votesMeta`;
  }

  findOne(id: number) {
    return `This action returns a #${id} votesMeta`;
  }

  update(id: number, updateVotesMetaDto: UpdateVotesMetaDto) {
    return `This action updates a #${id} votesMeta`;
  }

  remove(id: number) {
    return `This action removes a #${id} votesMeta`;
  }
}
