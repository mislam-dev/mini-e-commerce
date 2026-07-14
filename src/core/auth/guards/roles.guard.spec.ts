import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    jest.clearAllMocks();
  });

  const mockExecutionContext = (user?: any) => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
    }),
  } as any);

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if public', () => {
    mockReflector.getAllAndOverride.mockReturnValueOnce(true);
    expect(guard.canActivate(mockExecutionContext())).toBe(true);
  });

  it('should return true if no roles required', () => {
    mockReflector.getAllAndOverride
      .mockReturnValueOnce(false) // Not public
      .mockReturnValueOnce(undefined); // No roles required
    
    expect(guard.canActivate(mockExecutionContext())).toBe(true);
  });

  it('should return false if no user', () => {
    mockReflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['ADMIN']);
    
    expect(guard.canActivate(mockExecutionContext(null))).toBe(false);
  });

  it('should return false if user has no role', () => {
    mockReflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['ADMIN']);
    
    expect(guard.canActivate(mockExecutionContext({ id: 'user-id' }))).toBe(false);
  });

  it('should return true if user has required role', () => {
    mockReflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['ADMIN']);
    
    expect(guard.canActivate(mockExecutionContext({ role: 'ADMIN' }))).toBe(true);
  });

  it('should return false if user does not have required role', () => {
    mockReflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['ADMIN']);
    
    expect(guard.canActivate(mockExecutionContext({ role: 'USER' }))).toBe(false);
  });
});
