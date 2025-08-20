import { Test, TestingModule } from '@nestjs/testing';
import { ResultsMetaService } from './results-meta.service';

describe('ResultsMetaService', () => {
  let service: ResultsMetaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResultsMetaService],
    }).compile();

    service = module.get<ResultsMetaService>(ResultsMetaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
