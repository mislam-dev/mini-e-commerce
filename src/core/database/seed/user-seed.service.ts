import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import {
  User,
  UserRole,
  UserStatus,
} from '../../../core/user/entities/user.entity';

@Injectable()
export class UserSeedService {
  private readonly logger = new Logger(UserSeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async run() {
    this.logger.log('Seeding users User...');
    for (const user of USERS) {
      let findUser = await this.userRepository.findOne({
        where: { email: user.email },
      });

      if (!findUser) {
        const password = await bcrypt.hash(user.password, 10);
        findUser = this.userRepository.create({
          ...user,
          password,
        });
        await this.userRepository.save(findUser);
        this.logger.log(`${user.fullName} User created.`);
      } else {
        this.logger.log(`${user.fullName} User already exists..`);
      }
    }
  }
}

const USERS = [
  {
    email: 'admin@example.com',
    fullName: 'Admin User',
    password: 'admin123',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  },
  {
    email: 'user1@example.com',
    fullName: 'User 1',
    password: 'user123',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
  },
  {
    email: 'user2@example.com',
    fullName: 'User 2',
    password: 'user123',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
  },
  {
    email: 'user3@example.com',
    fullName: 'User 3',
    password: 'user123',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
  },
  {
    email: 'user4@example.com',
    fullName: 'User 4',
    password: 'user123',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
  },
  {
    email: 'user5@example.com',
    fullName: 'User 5',
    password: 'user123',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
  },
];
