import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user details on valid credentials', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'user',
      };
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');
      expect(result).toEqual({ id: 'user1', email: 'test@example.com', role: 'user' });
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'user',
      };
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('test@example.com', 'wrong_password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(userService, 'findByEmail').mockRejectedValue(new Error('Not found'));

      await expect(service.validateUser('nonexistent@example.com', 'password')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return an access token', () => {
      const payload = { id: 'user1', email: 'test@example.com', role: 'user' };
      jest.spyOn(jwtService, 'sign').mockReturnValue('mocked_jwt_token');

      const result = service.login(payload);
      
      expect(result).toEqual({ access_token: 'mocked_jwt_token' });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user1',
        email: 'test@example.com',
        role: 'user',
      });
    });
  });
});
