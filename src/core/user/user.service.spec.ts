import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  const mockUser = {
    id: 'user-id',
    fullName: 'Test User',
    email: 'test@test.com',
    password: 'hashed-password',
    status: UserStatus.ACTIVE,
    role: UserRole.CUSTOMER,
  };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockUser),
    save: jest.fn().mockResolvedValue(mockUser),
    findAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should hash password and create a user', async () => {
      const createUserDto = { fullName: 'Test User', email: 'test@test.com', password: 'password123' };
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(repository.create).toHaveBeenCalledWith({ ...createUserDto, password: 'hashed-password' });
      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const result = await service.findAll({ limit: 10, offset: 0 });
      expect(repository.findAndCount).toHaveBeenCalledWith({ skip: 0, take: 10, order: { createdAt: 'desc' } });
      expect(result).toEqual({ total: 1, limit: 10, offset: 0, results: [mockUser] });
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.findOne('user-id');
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'user-id' } });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('user-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.findByEmail('test@test.com');
      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findByEmail('test@test.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockUser });
      mockRepository.save.mockResolvedValue({ ...mockUser, fullName: 'Updated Name' });

      const result = await service.update('user-id', { fullName: 'Updated Name' });
      expect(repository.save).toHaveBeenCalled();
      expect(result.fullName).toBe('Updated Name');
    });
  });

  describe('updateStatus', () => {
    it('should update user status', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockUser });
      mockRepository.save.mockResolvedValue({ ...mockUser, status: UserStatus.INACTIVE });

      const result = await service.updateStatus('user-id', UserStatus.INACTIVE);
      expect(repository.save).toHaveBeenCalled();
      expect(result.status).toBe(UserStatus.INACTIVE);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      await service.remove('user-id');
      expect(repository.delete).toHaveBeenCalledWith('user-id');
    });

    it('should throw NotFoundException if user not found for deletion', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove('user-id')).rejects.toThrow(NotFoundException);
    });
  });
});
