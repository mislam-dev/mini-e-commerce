import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { JwtGuard } from './guards/jwt.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('/register')
  async register(@Body() createUserDto: CreateUserDto) {
    await this.authService.register(createUserDto);
    return { message: 'User registered successfully' };
  }

  @UseGuards(JwtGuard)
  @Get('/profile')
  profile(@Request() req) {
    return this.authService.profile(req.user.sub);
  }
}
