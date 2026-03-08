import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'themeMode';
  private readonly darkClass = 'dark-mode';
  private readonly darkValue = 'dark';
  private readonly lightValue = 'light';
  private readonly systemValue = 'system';
  private mediaQueryList?: MediaQueryList;
  private readonly handleSystemThemeChange = (event: MediaQueryListEvent): void => {
    if (this.themeModeSubject.value === this.systemValue) {
      this.applyTheme(event.matches);
    }
  };

  private readonly isDarkModeSubject = new BehaviorSubject<boolean>(false);
  readonly isDarkMode$: Observable<boolean> = this.isDarkModeSubject.asObservable();
  private readonly themeModeSubject = new BehaviorSubject<ThemeMode>(this.systemValue);
  readonly themeMode$: Observable<ThemeMode> = this.themeModeSubject.asObservable();

  initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.storageKey);

    if (
      savedTheme === this.darkValue ||
      savedTheme === this.lightValue ||
      savedTheme === this.systemValue
    ) {
      this.setThemeMode(savedTheme as ThemeMode, false);
      return;
    }

    this.setThemeMode(this.systemValue, false);
  }

  isDarkMode(): boolean {
    return this.isDarkModeSubject.value;
  }

  getThemeMode(): ThemeMode {
    return this.themeModeSubject.value;
  }

  setThemeMode(mode: ThemeMode, persist = true): void {
    this.themeModeSubject.next(mode);

    if (mode === this.systemValue) {
      this.startSystemThemeListener();
      this.applyTheme(this.getSystemPrefersDarkMode());
    } else {
      this.stopSystemThemeListener();
      this.applyTheme(mode === this.darkValue);
    }

    if (persist) {
      localStorage.setItem(this.storageKey, mode);
    }
  }

  setDarkMode(isDarkMode: boolean): void {
    this.setThemeMode(isDarkMode ? this.darkValue : this.lightValue);
  }

  toggleDarkMode(): void {
    this.setDarkMode(!this.isDarkModeSubject.value);
  }

  private getSystemPrefersDarkMode(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }

  private startSystemThemeListener(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    if (!this.mediaQueryList) {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    }

    if (typeof this.mediaQueryList.addEventListener === 'function') {
      this.mediaQueryList.addEventListener('change', this.handleSystemThemeChange);
    } else {
      this.mediaQueryList.addListener(this.handleSystemThemeChange);
    }
  }

  private stopSystemThemeListener(): void {
    if (!this.mediaQueryList) {
      return;
    }

    if (typeof this.mediaQueryList.removeEventListener === 'function') {
      this.mediaQueryList.removeEventListener('change', this.handleSystemThemeChange);
    } else {
      this.mediaQueryList.removeListener(this.handleSystemThemeChange);
    }
  }

  private applyTheme(isDarkMode: boolean): void {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    htmlElement.classList.toggle(this.darkClass, isDarkMode);
    bodyElement.classList.toggle(this.darkClass, isDarkMode);

    this.isDarkModeSubject.next(isDarkMode);
  }
}
