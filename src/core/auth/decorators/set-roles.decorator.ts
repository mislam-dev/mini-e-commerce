import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'AUTH_USERS_ROLES';

export const SetRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
