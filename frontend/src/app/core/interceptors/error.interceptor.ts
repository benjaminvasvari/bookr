import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * HTTP Error Interceptor - hibakezelés
 * 
 * Automatikusan kezeli a különböző HTTP hibákat:
 * - 401: Unauthorized -> kijelentkeztetés
 * - 403: Forbidden -> hibaüzenet
 * - 500: Server error -> hibaüzenet
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
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
          case 401:
            errorMessage = 'Nincs jogosultságod a művelethez. Kérlek jelentkezz be újra.';
            // Automatikus kijelentkeztetés
            authService.logout();
            router.navigate(['/login']);
            break;
          case 403:
            errorMessage = 'Nincs hozzáférésed ehhez az erőforráshoz.';
            break;
          case 404:
            errorMessage = error.error?.message || 'A kért erőforrás nem található';
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