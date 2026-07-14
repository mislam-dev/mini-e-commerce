import { Test, TestingModule } from '@nestjs/testing';
import { LocalAuthGuard } from './local-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalAuthGuard],
    }).compile();

    guard = module.get<LocalAuthGuard>(LocalAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('handleRequest', () => {
    it('should throw UnauthorizedException if error exists', () => {
      expect(() => guard.handleRequest(new Error('err'), null, null)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if no user', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(UnauthorizedException);
    });

    it('should return user if exists', () => {
      const user = { id: 'user-id' };
      expect(guard.handleRequest(null, user, null)).toEqual(user);
    });
  });
});
