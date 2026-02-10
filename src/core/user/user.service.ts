import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const password = await hash(createUserDto.password, 10);
    const user = this.repository.create({ ...createUserDto, password });
    return await this.repository.save(user);
  }

  async findAll({ limit, offset }: { limit: number; offset: number }) {
    const [results, total] = await this.repository.findAndCount({
      skip: offset,
      take: limit,
      order: { createdAt: 'desc' },
    });

    return {
      total,
      limit,
      offset,
      results,
    };
  }

  async findOne(id: string) {
    const user = await this.repository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found!');
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.repository.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found!');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);

    return this.repository.save(user);
  }

  async remove(id: string) {
    const result = await this.repository.delete(id);
    if (!result.affected) throw new NotFoundException('User not found!');
  }
}
