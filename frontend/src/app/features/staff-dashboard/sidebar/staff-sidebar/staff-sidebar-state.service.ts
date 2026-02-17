import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StaffSidebarStateService {
  private readonly storageKey = 'staffSidebarPinned';

  getPinned(): boolean {
    return localStorage.getItem(this.storageKey) === 'true';
  }

  setPinned(value: boolean): void {
    localStorage.setItem(this.storageKey, value ? 'true' : 'false');
  }
}
