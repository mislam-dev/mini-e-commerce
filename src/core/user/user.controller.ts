import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { SetRoles } from 'src/core/auth/decorators/set-roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './entities/user.entity';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @SetRoles(UserRole.ADMIN)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @SetRoles(UserRole.ADMIN)
  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.userService.findAll({
      limit: pagination.limit || 10,
      offset: pagination.offset || 0,
    });
  }

  @SetRoles(UserRole.ADMIN, UserRole.CUSTOMER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @SetRoles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @SetRoles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
