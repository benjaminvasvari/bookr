import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Error Interceptor - központi hibakezelés minden HTTP kéréshez
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ismeretlen hiba történt';

      if (error.error instanceof ErrorEvent) {
        // Kliens oldali hiba (pl. nincs internet)
        errorMessage = 'Hálózati hiba: Ellenőrizd az internetkapcsolatot';
        console.error('Kliens oldali hiba:', error.error.message);
      } else {
        // Szerver oldali hiba
        switch (error.status) {
          case 400:
            // Bad Request - Validation error
            errorMessage = error.error?.message || 'Hibás adatok';
            console.error('400 - Validation error:', error.error);
            // TODO: Form-hoz validation erroröket továbbítani
            break;

          case 401:
            // Unauthorized - ezt az auth interceptor kezeli
            // Itt már csak logolunk
            console.warn('401 - Unauthorized');
            break;

          case 403:
            // Forbidden - Nincs jogosultság
            errorMessage = 'Nincs jogosultságod ehhez a művelethez';
            console.error('403 - Forbidden:', error.url);
            // TODO: Toast notification megjelenítése
            break;

          case 404:
            // Not Found
            errorMessage = 'A kért erőforrás nem található';
            console.error('404 - Not Found:', error.url);
            // TODO: 404 oldalra irányítás vagy toast
            break;

          case 500:
          case 502:
          case 503:
            // Server Error
            errorMessage = 'Szerverhiba történt. Próbáld újra később!';
            console.error(`${error.status} - Server Error:`, error);
            // TODO: Toast notification megjelenítése
            break;

          default:
            errorMessage = `Hiba történt (${error.status})`;
            console.error('HTTP Error:', error);
        }
      }

      // Error objektum visszaadása további feldolgozáshoz
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        originalError: error
      }));
    })
  );
};