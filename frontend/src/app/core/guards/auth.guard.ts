import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';

/**
 * AuthGuard - Ellenőrzi hogy a user be van-e jelentkezve
 * 
 * Használat routes-ban:
 * { path: 'profile', component: ProfileComponent, canActivate: [authGuard] }
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Ellenőrizzük hogy van-e user localStorage-ban
  const userString = localStorage.getItem('user_data');
  const accessToken = localStorage.getItem('access_token');
  
  if (userString && accessToken) {
    // Van user és token → engedélyezzük
    return true;
  } else {
    // Nincs user vagy token → redirect login-ra
    console.warn('AuthGuard: No user or token found, redirecting to login');
    
    // Mentjük az eredeti URL-t, hogy login után visszairányítsuk
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    
    return false;
  }
};