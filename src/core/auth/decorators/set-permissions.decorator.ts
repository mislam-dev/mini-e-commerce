import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'AUTH_USERS_PERMISSIONS';

export const SetPermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
