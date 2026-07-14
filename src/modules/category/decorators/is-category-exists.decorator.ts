import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsCategoryExistsConstraint } from '../validators/is-category-exists.constraint';

export function IsCategoryExists(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCategoryExistsConstraint,
    });
  };
}
