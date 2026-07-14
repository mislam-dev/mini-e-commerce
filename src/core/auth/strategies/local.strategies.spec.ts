import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategies } from './local.strategies';
import { AuthService } from '../auth.service';

describe('LocalStrategies', () => {
  let strategy: LocalStrategies;

  const mockAuthService = {
    validateUser: jest.fn().mockResolvedValue({ id: 'user-id' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategies,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    strategy = module.get<LocalStrategies>(LocalStrategies);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate user', async () => {
      const result = await strategy.validate('test@test.com', 'password');
      expect(mockAuthService.validateUser).toHaveBeenCalledWith('test@test.com', 'password');
      expect(result).toEqual({ id: 'user-id' });
    });
  });
});
