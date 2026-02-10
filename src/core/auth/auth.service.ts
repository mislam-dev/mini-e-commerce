import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  async profile(id: string) {
    const user = await this.userService.findOne(id);
    if (!user) throw new NotFoundException('User not found!');
    const { password, updatedAt, ...rest } = user;
    return rest;
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ id: string; email: string; role: string }> {
    try {
      const user = await this.userService.findByEmail(email);
      const isPasswordMatch: boolean = await compare(password, user.password);
      if (!isPasswordMatch)
        throw new UnauthorizedException('Invalid user credentials!');
      return { id: user.id, email: user.email, role: user.role };
    } catch (error) {
      throw new UnauthorizedException('Invalid user credentials!');
    }
  }

  login(data: { id: string; email: string; role: string }) {
    return {
      access_token: this.jwtService.sign({
        sub: data.id,
        email: data.email,
        role: data.role,
      }),
    };
  }
}
