import { Test, TestingModule } from '@nestjs/testing';
import { UniqueEmailConstraints } from './is-unique-email.validator';
import { UserService } from '../user.service';

describe('UniqueEmailConstraints', () => {
  let constraint: UniqueEmailConstraints;
  let userService: UserService;

  const mockUserService = {
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniqueEmailConstraints,
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    constraint = module.get<UniqueEmailConstraints>(UniqueEmailConstraints);
    userService = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  it('should return false if email is empty', async () => {
    const result = await constraint.validate('');
    expect(result).toBe(false);
  });

  it('should return false if user with email already exists', async () => {
    mockUserService.findByEmail.mockResolvedValue({ id: 'user-id' });
    const result = await constraint.validate('test@test.com');
    expect(result).toBe(false);
  });

  it('should return true if user with email does not exist', async () => {
    mockUserService.findByEmail.mockRejectedValue(new Error('NotFoundException'));
    const result = await constraint.validate('new@test.com');
    expect(result).toBe(true);
  });

  it('should have a default message', () => {
    expect(constraint.defaultMessage()).toBe('Email is already exist!');
  });
});
