import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { filter } from 'rxjs/operators';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'bookr-frontend';
  showFooter = true;
  showHeader = true;

  constructor(
    private router: Router,
    private themeService: ThemeService
  ) {
    this.showFooter = this.shouldShowFooterForUrl(this.router.url);
    this.showHeader = this.shouldShowHeaderForUrl(this.router.url);

    this.themeService.initializeTheme();

    // Resolve layout visibility immediately on app init to avoid first-load flicker.
    this.updateLayoutVisibility(this.router.routerState.snapshot.root);

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.updateLayoutVisibility(this.router.routerState.snapshot.root);
      });
  }

  private updateLayoutVisibility(rootSnapshot: ActivatedRouteSnapshot): void {
    const data = this.collectMergedRouteData(rootSnapshot);
    const hasShowFooter = Object.prototype.hasOwnProperty.call(data, 'showFooter');
    const hasShowHeader = Object.prototype.hasOwnProperty.call(data, 'showHeader');

    this.showFooter = hasShowFooter
      ? data['showFooter'] !== false
      : this.shouldShowFooterForUrl(this.router.url);

    this.showHeader = hasShowHeader
      ? data['showHeader'] !== false
      : this.shouldShowHeaderForUrl(this.router.url);
  }

  private collectMergedRouteData(rootSnapshot: ActivatedRouteSnapshot): Record<string, unknown> {
    const mergedData: Record<string, unknown> = {};
    let current: ActivatedRouteSnapshot | null = rootSnapshot;

    while (current) {
      Object.assign(mergedData, current.data);
      current = current.firstChild;
    }

    return mergedData;
  }

  private shouldShowHeaderForUrl(url: string): boolean {
    const path = this.normalizePath(url);
    return !this.startsWithAny(path, ['/staff', '/owner', '/superadmin']);
  }

  private shouldShowFooterForUrl(url: string): boolean {
    const path = this.normalizePath(url);

    return !this.startsWithAny(path, [
      '/login',
      '/register',
      '/verify-email',
      '/profile',
      '/appointment/',
      '/appointment-payment/',
      '/reset-password',
      '/register-business',
      '/staff',
      '/owner',
      '/superadmin',
    ]);
  }

  private normalizePath(url: string): string {
    const [path] = (url || '/').split(/[?#]/);
    return path || '/';
  }

  private startsWithAny(path: string, prefixes: string[]): boolean {
    return prefixes.some(prefix => path === prefix || path.startsWith(prefix));
  }
}