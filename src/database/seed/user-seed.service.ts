import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../core/user/entities/user.entity';

@Injectable()
export class UserSeedService {
  private readonly logger = new Logger(UserSeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async run() {
    this.logger.log('Seeding Admin User...');
    const adminEmail = 'admin@example.com';
    let admin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!admin) {
      const password = await bcrypt.hash('admin123', 10);
      admin = this.userRepository.create({
        email: adminEmail,
        fullName: 'Admin User',
        password,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });
      await this.userRepository.save(admin);
      this.logger.log('Admin User created.');
    } else {
      this.logger.log('Admin User already exists.');
    }
  }
}
