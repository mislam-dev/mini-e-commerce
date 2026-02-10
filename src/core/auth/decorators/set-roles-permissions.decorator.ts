import { SetMetadata } from '@nestjs/common';

export const ROLE_PERMISSIONS_KEY = 'AUTH_USERS_ROLE_PERMISSIONS';

export const SetRolePermissions = (roles: string[], permissions: string[]) => {
  return SetMetadata(ROLE_PERMISSIONS_KEY, [roles, permissions]);
};
