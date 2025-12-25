import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IdeasService } from './ideas.service';

describe('IdeasService', () => {
  let service: IdeasService;
  let model: Model<any>;

  const mockIdeas = [
    {
      _id: 'idea1',
      title: 'Test Idea 1',
      description: 'Description 1',
      userAddress: '0xUserAddress123',
      imgSrc: 'https://example.com/img1.png',
      createdAt: new Date(),
    },
    {
      _id: 'idea2',
      title: 'Test Idea 2',
      description: 'Description 2',
      userAddress: '0xUserAddress123',
      imgSrc: 'https://example.com/img2.png',
      createdAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdeasService,
        {
          provide: getModelToken('Ideas'),
          useValue: {
            find: jest.fn().mockReturnThis(),
            findById: jest.fn().mockReturnThis(),
            findByIdAndUpdate: jest.fn().mockReturnThis(),
            findByIdAndDelete: jest.fn().mockReturnThis(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IdeasService>(IdeasService);
    model = module.get<Model<any>>(getModelToken('Ideas'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getIdeasByUserAddress', () => {
    it('should return ideas for a given user address', async () => {
      const userAddress = '0xUserAddress123';

      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockIdeas),
      } as any);

      const result = await service.getIdeasByUserAddress(userAddress);

      expect(model.find).toHaveBeenCalledWith({ userAddress });
      expect(result).toEqual(mockIdeas);
      expect(result.length).toBe(2);
    });

    it('should return empty array for unknown user address', async () => {
      const userAddress = '0xUnknownAddress';

      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await service.getIdeasByUserAddress(userAddress);

      expect(model.find).toHaveBeenCalledWith({ userAddress });
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should filter ideas by user address correctly', async () => {
      const userAddress = '0xUserAddress123';
      const differentUserIdeas = [mockIdeas[0]];

      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(differentUserIdeas),
      } as any);

      const result = await service.getIdeasByUserAddress(userAddress);

      expect(result.length).toBe(1);
      expect(result[0].userAddress).toBe(userAddress);
    });
  });

  describe('getAllIdeas', () => {
    it('should return all ideas', async () => {
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockIdeas),
      } as any);

      const result = await service.getAllIdeas();

      expect(model.find).toHaveBeenCalled();
      expect(result).toEqual(mockIdeas);
    });
  });

  describe('getIdeaById', () => {
    it('should return an idea by ID', async () => {
      const ideaId = 'idea1';

      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockIdeas[0]),
      } as any);

      const result = await service.getIdeaById(ideaId);

      expect(model.findById).toHaveBeenCalledWith(ideaId);
      expect(result).toEqual(mockIdeas[0]);
    });

    it('should return null for non-existent ID', async () => {
      const ideaId = 'nonExistentId';

      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await service.getIdeaById(ideaId);

      expect(result).toBeNull();
    });
  });
});
