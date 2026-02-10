/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type UserPayload = {
  iss: string; // Issuer
  sub: string; // Subject (User ID)
  aud: string[]; // Audience
  iat: number; // Issued At timestamp
  exp: number; // Expiration timestamp
  scope: string;
  azp: string; // Authorized Party
  permissions: string[];
  userId: string;

  [key: string]: string[] | string | number;
};

export const User = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserPayload;

    if (data && user) return user[data];

    return user;
  },
);
