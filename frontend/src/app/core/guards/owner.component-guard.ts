import { CanActivateFn } from '@angular/router';

export const ownerComponentGuard: CanActivateFn = (route, state) => {
  return true;
};
