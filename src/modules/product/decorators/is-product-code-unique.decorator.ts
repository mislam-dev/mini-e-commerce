import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsProductCodeUniqueConstraint } from '../validators/is-product-code-unique.constraint';

export function IsProductCodeUnique(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsProductCodeUniqueConstraint,
    });
  };
}
