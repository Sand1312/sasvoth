import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from './users.service';
import { Users, UsersDocument } from './schemas/users.schema';

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<UsersDocument>;

  const mockUser = {
    _id: 'testUserId123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    walletAddress: '0x1234567890abcdef',
    authType: 'email',
    avatar: null,
    dateOfBirth: null,
    save: jest.fn().mockResolvedValue(true),
  };

  const mockUserModel = {
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(Users.name),
          useValue: {
            findById: jest.fn().mockReturnThis(),
            findOne: jest.fn().mockReturnThis(),
            find: jest.fn().mockReturnThis(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<UsersDocument>>(getModelToken(Users.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should update user avatar successfully', async () => {
      const userId = 'testUserId123';
      const updateData = { avatar: 'https://example.com/avatar.png' };
      const mockUserDoc = {
        ...mockUser,
        save: jest.fn().mockResolvedValue({
          ...mockUser,
          avatar: updateData.avatar,
        }),
      };

      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserDoc),
      } as any);

      const result = await service.updateProfile(userId, updateData);

      expect(model.findById).toHaveBeenCalledWith(userId);
      expect(mockUserDoc.save).toHaveBeenCalled();
      expect(mockUserDoc.avatar).toBe(updateData.avatar);
    });

    it('should update user dateOfBirth successfully', async () => {
      const userId = 'testUserId123';
      const dob = new Date('1990-01-15');
      const updateData = { dateOfBirth: dob };
      const mockUserDoc = {
        ...mockUser,
        save: jest.fn().mockResolvedValue({
          ...mockUser,
          dateOfBirth: dob,
        }),
      };

      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserDoc),
      } as any);

      const result = await service.updateProfile(userId, updateData);

      expect(model.findById).toHaveBeenCalledWith(userId);
      expect(mockUserDoc.save).toHaveBeenCalled();
      expect(mockUserDoc.dateOfBirth).toEqual(dob);
    });

    it('should throw error when user not found', async () => {
      const userId = 'nonExistentUserId';
      const updateData = { avatar: 'https://example.com/avatar.png' };

      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.updateProfile(userId, updateData)).rejects.toThrow(
        'User not found',
      );
    });

    it('should update both avatar and dateOfBirth', async () => {
      const userId = 'testUserId123';
      const dob = new Date('1990-01-15');
      const updateData = {
        avatar: 'https://example.com/avatar.png',
        dateOfBirth: dob,
      };
      const mockUserDoc = {
        ...mockUser,
        save: jest.fn().mockResolvedValue({
          ...mockUser,
          ...updateData,
        }),
      };

      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserDoc),
      } as any);

      const result = await service.updateProfile(userId, updateData);

      expect(mockUserDoc.avatar).toBe(updateData.avatar);
      expect(mockUserDoc.dateOfBirth).toEqual(dob);
    });
  });
});
