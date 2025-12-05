import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * HTTP Interceptor - JWT token automatikus hozzáadása
 * 
 * Minden kimenő HTTP kéréshez hozzáadja az Authorization headert
 * ha a felhasználó be van jelentkezve
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  // Ha van token, hozzáadjuk a kéréshez
  if (token) {
    // Klónozzuk a kérést és hozzáadjuk az Authorization headert
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return next(clonedReq);
  }
  
  // Ha nincs token, eredeti kérés megy tovább
  return next(req);
};