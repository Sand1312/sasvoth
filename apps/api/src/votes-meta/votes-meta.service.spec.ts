import { Test, TestingModule } from '@nestjs/testing';
import { VotesMetaService } from './votes-meta.service';

describe('VotesMetaService', () => {
  let service: VotesMetaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VotesMetaService],
    }).compile();

    service = module.get<VotesMetaService>(VotesMetaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
