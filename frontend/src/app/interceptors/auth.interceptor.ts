import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Auth Interceptor - automatikusan hozzáadja a JWT tokent minden kéréshez
 * és kezeli a refresh token flow-t
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Exclude endpointok - ezekhez nem kell token
  const excludedUrls = ['/auth/login', '/auth/register'];
  const isExcluded = excludedUrls.some(url => req.url.includes(url));

  // Ha excluded endpoint vagy refresh endpoint, továbbengedjük változatlanul
  if (isExcluded || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  // Token kiolvasása LocalStorage-ból
  const accessToken = localStorage.getItem(environment.accessTokenKey);

  // Ha nincs token, továbbítjuk a kérést (publikus endpoint lehet)
  if (!accessToken) {
    return next(req);
  }

  // Authorization header hozzáadása
  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  // Kérés végrehajtása és 401 error kezelése
  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ha 401 (Unauthorized) és van refresh token
      if (error.status === 401) {
        const refreshToken = localStorage.getItem(environment.refreshTokenKey);

        if (refreshToken) {
          // Refresh token flow - új access token kérése
          return refreshAccessToken(refreshToken).pipe(
            switchMap((newAccessToken: string) => {
              // Új tokennel újrapróbáljuk az eredeti kérést
              const retryRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newAccessToken}`
                }
              });
              return next(retryRequest);
            }),
            catchError((refreshError) => {
              // Refresh token is invalid -> logout
              handleLogout(router);
              return throwError(() => refreshError);
            })
          );
        } else {
          // Nincs refresh token -> logout
          handleLogout(router);
        }
      }

      return throwError(() => error);
    })
  );
};

/**
 * Refresh token flow - új access token kérése
 */
function refreshAccessToken(refreshToken: string) {
  return new Observable<string>((observer) => {
    fetch(`${environment.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Refresh failed');
        }
        return response.json();
      })
      .then(data => {
        // Új tokenek mentése
        localStorage.setItem(environment.accessTokenKey, data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem(environment.refreshTokenKey, data.refreshToken);
        }
        observer.next(data.accessToken);
        observer.complete();
      })
      .catch(error => {
        observer.error(error);
      });
  });
}

/**
 * Logout - tokenek törlése és átirányítás login oldalra
 */
function handleLogout(router: Router): void {
  localStorage.removeItem(environment.accessTokenKey);
  localStorage.removeItem(environment.refreshTokenKey);
  router.navigate(['/login']);
}