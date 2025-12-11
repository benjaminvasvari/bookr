import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, filter, take, throwError, BehaviorSubject, Observable } from 'rxjs';

/**
 * HTTP Interceptor - JWT token automatikus hozzáadása + token refresh kezelés
 * 
 * Funkciók:
 * 1. Automatikusan hozzáadja az access tokent minden kéréshez
 * 2. 401 error esetén automatikus token refresh
 * 3. Refresh sikeres → eredeti kérés újrapróbálása új tokennel
 * 4. Refresh sikertelen → automatikus logout
 * 5. Többszörös refresh védelem (ha egyszerre több kérés kap 401-et)
 */

// Token refresh folyamat kezelése (többszörös hívás elkerülésére)
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Mely endpoint-ok NE kapjanak tokent
  const excludedUrls = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh'
  ];
  
  // Ha az URL kizárt, akkor nem adunk hozzá tokent
  const isExcluded = excludedUrls.some(url => req.url.includes(url));
  
  // Token hozzáadása a kéréshez (ha van és nem kizárt URL)
  const token = authService.getToken();
  const clonedReq = !isExcluded && token 
    ? addTokenToRequest(req, token)
    : req;
  
  // Kérés elküldése + error handling
  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ha 401 error és NEM a refresh endpoint
      if (error.status === 401 && !req.url.includes('/api/auth/refresh')) {
        return handle401Error(req, next, authService, router);
      }
      
      // Más hibák esetén tovább dobjuk
      return throwError(() => error);
    })
  );
};

/**
 * Token hozzáadása a request-hez
 */
function addTokenToRequest(req: any, token: string) {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * 401 error kezelése - automatikus token refresh
 */
function handle401Error(
  req: any, 
  next: any, 
  authService: AuthService, 
  router: Router
): Observable<any> {
  
  // Ha már folyamatban van egy refresh, várakozunk rá
  if (isRefreshing) {
    return waitForTokenRefresh(req, next);
  }
  
  // Refresh folyamat indítása
  isRefreshing = true;
  refreshTokenSubject.next(null);
  
  return authService.refreshToken().pipe(
    switchMap((response) => {
      // Refresh sikeres
      isRefreshing = false;
      refreshTokenSubject.next(response.accessToken);
      
      // Eredeti kérés újrapróbálása az ÚJ tokennel
      return next(addTokenToRequest(req, response.accessToken));
    }),
    catchError((refreshError) => {
      // Refresh sikertelen → logout
      isRefreshing = false;
      refreshTokenSubject.next(null);
      
      console.error('Token refresh failed, logging out...', refreshError);
      
      // Automatikus logout
      authService.logout();
      router.navigate(['/login']);
      
      return throwError(() => refreshError);
    })
  );
}

/**
 * Várakozás a folyamatban lévő token refresh-re
 * (Ha több kérés egyszerre kap 401-et)
 */
function waitForTokenRefresh(req: any, next: any): Observable<any> {
  return refreshTokenSubject.pipe(
    filter(token => token !== null), // Várunk, amíg van új token
    take(1), // Csak az első értéket vesszük
    switchMap(token => {
      // Eredeti kérés újrapróbálása az új tokennel
      return next(addTokenToRequest(req, token));
    })
  );
}