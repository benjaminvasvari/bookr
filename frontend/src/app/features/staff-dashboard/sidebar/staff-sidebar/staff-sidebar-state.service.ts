import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StaffSidebarStateService {
  private readonly storageKey = 'staffSidebarExpanded';
  private readonly legacyStorageKey = 'staffSidebarPinned';

  getExpanded(): boolean {
    const storedValue = localStorage.getItem(this.storageKey);
    if (storedValue !== null) {
      return storedValue === 'true';
    }

    return localStorage.getItem(this.legacyStorageKey) === 'true';
  }

  setExpanded(value: boolean): void {
    localStorage.setItem(this.storageKey, value ? 'true' : 'false');
    localStorage.removeItem(this.legacyStorageKey);
  }
}
