import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'themeMode';
  private readonly darkClass = 'dark-mode';
  private readonly darkValue = 'dark';
  private readonly lightValue = 'light';

  private readonly isDarkModeSubject = new BehaviorSubject<boolean>(false);
  readonly isDarkMode$: Observable<boolean> = this.isDarkModeSubject.asObservable();

  initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.storageKey);

    if (savedTheme === this.darkValue || savedTheme === this.lightValue) {
      this.applyTheme(savedTheme === this.darkValue);
      return;
    }

    const prefersDarkMode =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    this.applyTheme(prefersDarkMode);
  }

  isDarkMode(): boolean {
    return this.isDarkModeSubject.value;
  }

  setDarkMode(isDarkMode: boolean): void {
    this.applyTheme(isDarkMode);
    localStorage.setItem(this.storageKey, isDarkMode ? this.darkValue : this.lightValue);
  }

  toggleDarkMode(): void {
    this.setDarkMode(!this.isDarkModeSubject.value);
  }

  private applyTheme(isDarkMode: boolean): void {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    htmlElement.classList.toggle(this.darkClass, isDarkMode);
    bodyElement.classList.toggle(this.darkClass, isDarkMode);

    this.isDarkModeSubject.next(isDarkMode);
  }
}
