import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { filter, map } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { FavoritesService } from './core/services/favorites.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'bookr-frontend';
  showFooter = true;
  showHeader = true;
  private userSubscription?: Subscription;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private favoritesService: FavoritesService,
    private authService: AuthService
  ) {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map(route => {
          const routes: ActivatedRoute[] = [];
          while (route.firstChild) {
            routes.push(route);
            route = route.firstChild;
          }
          routes.push(route);
          return routes;
        })
      )
      .subscribe(routes => {
        // Összegyűjtjük a route data-kat (parent + child)
        const data = routes.reduce((acc, r) => ({ ...acc, ...r.snapshot.data }), {} as any);

        // Olvassuk ki a route data-ból a showFooter értéket
        const showFooter = data['showFooter'];
        this.showFooter = showFooter !== false; // Ha nincs megadva, alapértelmezetten true

        // Olvassuk ki a route data-ból a showHeader értéket
        const showHeader = data['showHeader'];
        this.showHeader = showHeader !== false; // Ha nincs megadva, alapértelmezetten true
      });
  }

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(() => {
      this.favoritesService.refreshFavorites();
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }
}