import { Injectable } from '@nestjs/common';
import { CreateVotingEventDto } from './dto/create-voting-event.dto';
import { UpdateVotingEventDto } from './dto/update-voting-event.dto';

@Injectable()
export class VotingEventService {
  create(createVotingEventDto: CreateVotingEventDto) {
    return 'This action adds a new votingEvent';
  }

  findAll() {
    return `This action returns all votingEvent`;
  }

  findOne(id: number) {
    return `This action returns a #${id} votingEvent`;
  }

  update(id: number, updateVotingEventDto: UpdateVotingEventDto) {
    return `This action updates a #${id} votingEvent`;
  }

  remove(id: number) {
    return `This action removes a #${id} votingEvent`;
  }
}
