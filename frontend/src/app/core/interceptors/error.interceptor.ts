import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP Error Interceptor - hibakezelés
 * 
 * Automatikusan kezeli a különböző HTTP hibákat:
 * - 400: Bad Request
 * - 403: Forbidden -> hibaüzenet
 * - 404: Not Found
 * - 500: Server error -> hibaüzenet
 * 
 * FONTOS: 401 hibát NEM kezeli, azt az authInterceptor kezeli (token refresh)
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Az authInterceptor kezeli (automatic token refresh)
      if (error.status === 401) {
        return throwError(() => error); // Továbbdobjuk az authInterceptor-nak!
      }
      
      let errorMessage = 'Ismeretlen hiba történt';
      
      if (error.error instanceof ErrorEvent) {
        // Kliens oldali hiba
        errorMessage = `Hiba: ${error.error.message}`;
      } else {
        // Szerver oldali hiba
        switch (error.status) {
          case 0:
            errorMessage = 'Nem sikerült kapcsolódni a szerverhez. Ellenőrizd az internetkapcsolatot.';
            break;
          case 400:
            errorMessage = error.error?.message || 'Hibás kérés';
            break;
          case 403:
            errorMessage = 'Nincs hozzáférésed ehhez az erőforráshoz.';
            break;
          case 404:
            errorMessage = error.error?.message || 'A kért erőforrás nem található';
            break;
          case 409:
            errorMessage = error.error?.message || 'Az email már hitelesítve van.';
            break;
          case 500:
            errorMessage = 'Szerverhiba történt. Kérlek próbáld újra később.';
            break;
          default:
            errorMessage = error.error?.message || `Hiba történt: ${error.status}`;
        }
      }
      
      // Log a console-ba development módban
      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        error: error.error
      });
      
      // TODO: Megjeleníthetsz egy toast notification-t itt
      // pl: toastService.error(errorMessage);
      
      return throwError(() => new Error(errorMessage));
    })
  );
};