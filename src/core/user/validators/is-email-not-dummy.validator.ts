import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidatorOptions,
} from 'class-validator';

@ValidatorConstraint()
@Injectable()
export class NotDummyEmailConstraints implements ValidatorConstraintInterface {
  validate(email: string): Promise<boolean> | boolean {
    if (!email) return false;

    const blockedDomain = [
      '@mailinator.com',
      '@example.com',
      '@test.com',
      '@demo.com',
      '@dummy.com',
      '@sample.com',
      '@fakemail.net',
      '@tempmail.com',
      '@testing.io',
      '@mockemail.org',
    ];

    for (const item of blockedDomain) {
      if (email.includes(item)) return false;
    }

    return true;
  }
  defaultMessage?(): string {
    return 'Email must be a valid';
  }
}

export function IsEmailNotDummy(options?: ValidatorOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      validator: NotDummyEmailConstraints,
      constraints: [],
      options,
    });
  };
}
