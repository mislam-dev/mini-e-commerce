import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { IsEmailNotDummy } from '../validators/is-email-not-dummy.validator';
import { IsEmailUnique } from '../validators/is-unique-email.validator';

export class CreateUserDto {
  @IsEmail()
  @IsEmailNotDummy()
  @IsEmailUnique()
  email: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @MinLength(6)
  password: string;
}
