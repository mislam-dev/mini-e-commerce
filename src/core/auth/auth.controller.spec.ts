import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({ access_token: 'token123' }),
    register: jest.fn().mockResolvedValue(undefined),
    profile: jest
      .fn()
      .mockResolvedValue({ id: 'user-id', email: 'test@test.com' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token', async () => {
      const req = { user: { email: 'test@test.com', id: 'user-id' } };
      const result = await controller.login(req);
      expect(service.login).toHaveBeenCalledWith(req.user);
      expect(result).toEqual({ access_token: 'token123' });
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto: CreateUserDto = {
        fullName: 'Test User',
        email: 'test@test.com',
        password: 'password123',
      };
      const result = await controller.register(dto);
      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'User registered successfully' });
    });
  });

  describe('profile', () => {
    it('should return user profile', async () => {
      const user = { sub: 'user-id' };

      const result = await controller.profile(user as any);
      expect(service.profile).toHaveBeenCalledWith('user-id');
      expect(result).toEqual({ id: 'user-id', email: 'test@test.com' });
    });
  });
});
