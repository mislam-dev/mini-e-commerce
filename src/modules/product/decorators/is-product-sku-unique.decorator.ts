import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsProductSkuUniqueConstraint } from '../validators/is-product-sku-unique.constraint';

export function IsProductSkuUnique(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsProductSkuUniqueConstraint,
    });
  };
}
