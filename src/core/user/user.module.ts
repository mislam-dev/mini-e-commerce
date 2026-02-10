import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { NotDummyEmailConstraints } from './validators/is-email-not-dummy.validator';
import { UniqueEmailConstraints } from './validators/is-unique-email.validator';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService, UniqueEmailConstraints, NotDummyEmailConstraints],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
