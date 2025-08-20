import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VotesMetaService } from './votes-meta.service';
import { CreateVotesMetaDto } from './dto/create-votes-meta.dto';
import { UpdateVotesMetaDto } from './dto/update-votes-meta.dto';

@Controller('votes-meta')
export class VotesMetaController {
  constructor(private readonly votesMetaService: VotesMetaService) {}

  @Post()
  create(@Body() createVotesMetaDto: CreateVotesMetaDto) {
    return this.votesMetaService.create(createVotesMetaDto);
  }

  @Get()
  findAll() {
    return this.votesMetaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.votesMetaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVotesMetaDto: UpdateVotesMetaDto) {
    return this.votesMetaService.update(+id, updateVotesMetaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.votesMetaService.remove(+id);
  }
}
