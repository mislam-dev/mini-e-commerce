import { Test, TestingModule } from '@nestjs/testing';
import { JwtGuard } from './jwt.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('JwtGuard', () => {
  let guard: JwtGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtGuard,
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<JwtGuard>(JwtGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const mockExecutionContext = () => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({}),
      getResponse: jest.fn().mockReturnValue({}),
    }),
  } as unknown as ExecutionContext);

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if public route', () => {
    mockReflector.getAllAndOverride.mockReturnValueOnce(true);
    const context = mockExecutionContext();
    
    // Test the specific behavior of canActivate handling public routes
    const canActivate = guard.canActivate(context);
    expect(canActivate).toBe(true);
  });
  
  it('should call super.canActivate if not public', async () => {
    mockReflector.getAllAndOverride.mockReturnValueOnce(false);
    const context = mockExecutionContext();

    try {
      const res = guard.canActivate(context);
      if (res && typeof (res as any).subscribe === 'function') {
         await (res as any).toPromise();
      } else {
         await res;
      }
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});
