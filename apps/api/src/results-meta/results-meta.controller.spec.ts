import { Test, TestingModule } from '@nestjs/testing';
import { ResultsMetaController } from './results-meta.controller';
import { ResultsMetaService } from './results-meta.service';

describe('ResultsMetaController', () => {
  let controller: ResultsMetaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResultsMetaController],
      providers: [ResultsMetaService],
    }).compile();

    controller = module.get<ResultsMetaController>(ResultsMetaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
