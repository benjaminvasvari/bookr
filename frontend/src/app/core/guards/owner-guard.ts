import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

/**
 * Owner Guard - Ellenőrzi hogy a usernek van-e cége
 * 
 * Ha nincs cég → redirect /register-business-re
 * Ha nincs bejelentkezve → redirect /login-ra (ezt az authGuard már kezeli)
 * 
 * Használat routes-ban:
 * { 
 *   path: 'owner', 
 *   component: OwnerDashboardComponent, 
 *   canActivate: [authGuard, ownerGuard] 
 * }
 */
export const ownerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    map(user => {
      // 1. Ellenőrzi, hogy be van-e jelentkezve (biztonsági extra ellenőrzés)
      if (!user) {
        console.warn('OwnerGuard: No user found, redirecting to login');
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }

      // 2. Ellenőrzi, hogy van-e cége
      if (user.companyId) {
        console.log('✅ OwnerGuard: User has company, access granted');
        return true;
      }

      // 3. Ha nincs cég, irányítjuk a cég regisztrációhoz
      console.warn('OwnerGuard: User has no company, redirecting to register-business');
      router.navigate(['/register-business']);
      return false;
    })
  );
};