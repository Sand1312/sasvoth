import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ResultsMetaService } from './results-meta.service';
import { CreateResultsMetaDto } from './dto/create-results-meta.dto';
import { UpdateResultsMetaDto } from './dto/update-results-meta.dto';

@Controller('results-meta')
export class ResultsMetaController {
  constructor(private readonly resultsMetaService: ResultsMetaService) {}

  @Post()
  create(@Body() createResultsMetaDto: CreateResultsMetaDto) {
    return this.resultsMetaService.create(createResultsMetaDto);
  }

  @Get()
  findAll() {
    return this.resultsMetaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resultsMetaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateResultsMetaDto: UpdateResultsMetaDto) {
    return this.resultsMetaService.update(+id, updateResultsMetaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resultsMetaService.remove(+id);
  }
}
