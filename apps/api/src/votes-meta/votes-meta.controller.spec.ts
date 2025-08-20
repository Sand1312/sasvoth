import { Test, TestingModule } from '@nestjs/testing';
import { VotesMetaController } from './votes-meta.controller';
import { VotesMetaService } from './votes-meta.service';

describe('VotesMetaController', () => {
  let controller: VotesMetaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotesMetaController],
      providers: [VotesMetaService],
    }).compile();

    controller = module.get<VotesMetaController>(VotesMetaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
