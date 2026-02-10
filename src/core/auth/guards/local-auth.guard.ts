import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  handleRequest(err, user, info) {
    if (err || !user)
      throw new UnauthorizedException(
        'Your provided credentials are incorrect!',
      );
    console.log(user);
    return user;
  }
}
