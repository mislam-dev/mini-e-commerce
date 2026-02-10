/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLE_PERMISSIONS_KEY } from '../decorators/set-roles-permissions.decorator';

@Injectable()
export class RolePermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const values = this.reflector.getAllAndOverride<string[]>(
      ROLE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!values) return true;
    const [requiredRoles, requiredPermissions] = values;
    if (!requiredPermissions && !requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    let roleAccess = false;
    if (!requiredRoles || requiredRoles.length === 0) roleAccess = true;

    if (requiredRoles.length > 0) {
      const usersRoles: string[] =
        user[`${this.config.get<string>('auth0.audience')}/roles`] || [];

      roleAccess = (requiredRoles as unknown as string[]).some((role) =>
        usersRoles.includes(role),
      );
    }

    let permissionsAccess = false;

    if (!requiredPermissions) permissionsAccess = true;

    const userPermissions: string[] = user?.permissions || [];

    permissionsAccess = (requiredPermissions as unknown as string[]).every(
      (p) => userPermissions.includes(p),
    );

    return roleAccess && permissionsAccess;
  }
}
