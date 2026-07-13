import { Test, TestingModule } from '@nestjs/testing';
import { NotDummyEmailConstraints } from './is-email-not-dummy.validator';

describe('NotDummyEmailConstraints', () => {
  let constraint: NotDummyEmailConstraints;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotDummyEmailConstraints],
    }).compile();

    constraint = module.get<NotDummyEmailConstraints>(NotDummyEmailConstraints);
  });

  it('should return false if email is empty', () => {
    expect(constraint.validate('')).toBe(false);
  });

  it('should return false for blocked domains', () => {
    expect(constraint.validate('test@mailinator.com')).toBe(false);
    expect(constraint.validate('test@example.com')).toBe(false);
    expect(constraint.validate('user@test.com')).toBe(false);
  });

  it('should return true for valid domains', () => {
    expect(constraint.validate('test@gmail.com')).toBe(true);
    expect(constraint.validate('user@yahoo.com')).toBe(true);
  });

  it('should have a default message', () => {
    expect(constraint.defaultMessage()).toBe('Email must be a valid');
  });
});
