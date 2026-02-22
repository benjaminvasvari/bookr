import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { CanActivateFn } from '@angular/router';

/*
    RoleGuard - Ellenőrzi hogy a usernek van-e megfelelő szerepköre
  
    Használat routes-ban:
    {
        path: 'admin',
        component: AdminComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin', 'superadmin'] }  // Ezek közül legalább 1 kell
    }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const router = inject(Router);
  
  // Ellenőrizzük hogy van-e user
  const userString = localStorage.getItem('user') || localStorage.getItem('user_data');
  
  if (!userString) {
    console.warn('RoleGuard: No user found, redirecting to login');
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
  
  try {
    const user = JSON.parse(userString);
    
    // Lekérjük a route-ban megadott szükséges szerepköröket
    const requiredRoles = route.data['roles'] as string[] | undefined;
    
    if (!requiredRoles || requiredRoles.length === 0) {
      // Ha nincs szerepkör megadva, akkor engedélyezzük
      console.warn('RoleGuard: No roles specified in route data, allowing access');
      return true;
    }
    
    // User szerepkörei (lehet string vagy string array a backend-től függően)
    const userRoles = user.roles || [];
    
    // Ha userRoles string (pl. "client, admin"), akkor split-eljük
    const userRolesArray = typeof userRoles === 'string' 
      ? userRoles.split(',').map((r: string) => r.trim().toLowerCase())
      : Array.isArray(userRoles) 
        ? userRoles.map((r: string) => r.toLowerCase())
        : [];
    
    // Ellenőrizzük hogy van-e közös szerepkör
    const hasRequiredRole = requiredRoles.some(role => 
      userRolesArray.includes(role.toLowerCase())
    );
    
    if (hasRequiredRole) {
      return true;
    } else {
      // Nincs megfelelő szerepkör → unauthorized oldal vagy vissza profile-ra
      console.warn('RoleGuard: User does not have required role', {
        required: requiredRoles,
        userHas: userRolesArray
      });
      
      router.navigate(['/unauthorized']); // vagy '/profile' vagy '/'
      return false;
    }
    
  } catch (error) {
    console.error('RoleGuard: Error parsing user data', error);
    router.navigate(['/login']);
    return false;
  }
};