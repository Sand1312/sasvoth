import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VotingEventService } from './voting-event.service';
import { CreateVotingEventDto } from './dto/create-voting-event.dto';
import { UpdateVotingEventDto } from './dto/update-voting-event.dto';

@Controller('voting-event')
export class VotingEventController {
  constructor(private readonly votingEventService: VotingEventService) {}

  @Post()
  create(@Body() createVotingEventDto: CreateVotingEventDto) {
    return this.votingEventService.create(createVotingEventDto);
  }

  @Get()
  findAll() {
    return this.votingEventService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.votingEventService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVotingEventDto: UpdateVotingEventDto) {
    return this.votingEventService.update(+id, updateVotingEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.votingEventService.remove(+id);
  }
}
