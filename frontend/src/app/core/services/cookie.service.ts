import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  
  constructor() {}

  /**
   * Cookie beállítása
   */
  setCookie(name: string, value: any, days: number = 30): void {
    try {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = `expires=${date.toUTCString()}`;
      document.cookie = `${name}=${jsonValue};${expires};path=/;SameSite=Strict`;
    } catch (error) {
      console.error('Cookie beállítása sikertelen:', error);
    }
  }

  /**
   * Cookie lekérése
   */
  getCookie(name: string): any {
    try {
      const nameEQ = `${name}=`;
      const cookies = document.cookie.split(';');
      
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(nameEQ)) {
          const value = cookie.substring(nameEQ.length);
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Cookie lekérése sikertelen:', error);
      return null;
    }
  }

  /**
   * Cookie törlése
   */
  removeCookie(name: string): void {
    try {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    } catch (error) {
      console.error('Cookie törlése sikertelen:', error);
    }
  }

  /**
   * Összes céges regisztrációs cookie törlése
   */
  clearRegistrationCookies(): void {
    const cookieNames = [
      'bookr_owner_info',
      'bookr_company_info',
      'bookr_business_details',
      'bookr_opening_hours'
    ];
    
    cookieNames.forEach(name => this.removeCookie(name));
  }
}
