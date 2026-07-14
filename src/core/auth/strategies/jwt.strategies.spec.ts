import { Test, TestingModule } from '@nestjs/testing';
import { JWTStrategies } from './jwt.strategies';
import { ConfigService } from '@nestjs/config';

describe('JWTStrategies', () => {
  let strategy: JWTStrategies;

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JWTStrategies,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JWTStrategies>(JWTStrategies);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return payload', () => {
      const payload = { sub: 'user-id', role: 'user' };
      expect(strategy.validate(payload)).toEqual(payload);
    });
  });
});
