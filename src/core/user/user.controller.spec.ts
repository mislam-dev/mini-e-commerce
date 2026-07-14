import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUser = { id: 'user-id', fullName: 'Test User' };

  const mockUserService = {
    create: jest.fn().mockResolvedValue(mockUser),
    findAll: jest.fn().mockResolvedValue({ total: 1, limit: 10, offset: 0, results: [mockUser] }),
    findOne: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockResolvedValue({ ...mockUser, fullName: 'Updated Name' }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const dto: CreateUserDto = { fullName: 'Test User', email: 'test@test.com', password: 'password123' };
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should get paginated users', async () => {
      const result = await controller.findAll({ limit: 10, offset: 0 });
      expect(service.findAll).toHaveBeenCalledWith({ limit: 10, offset: 0 });
      expect(result.results).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should get a single user', async () => {
      const result = await controller.findOne('user-id');
      expect(service.findOne).toHaveBeenCalledWith('user-id');
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const dto: UpdateUserDto = { fullName: 'Updated Name' };
      const result = await controller.update('user-id', dto);
      expect(service.update).toHaveBeenCalledWith('user-id', dto);
      expect(result.fullName).toBe('Updated Name');
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const result = await controller.remove('user-id');
      expect(service.remove).toHaveBeenCalledWith('user-id');
      expect(result).toBeUndefined();
    });
  });
});
