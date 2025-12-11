import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { User } from '../core/models';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet  // ← FONTOS! Router outlet kell
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  activeTab: string = 'info';

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      // Ha nincs bejelentkezve, redirect login-ra
      if (!user) {
        this.router.navigate(['/login']);
      }
    });

    // Detect active route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const childRoute = this.activatedRoute.firstChild;
        if (childRoute) {
          childRoute.url.subscribe(segments => {
            if (segments.length > 0) {
              this.activeTab = segments[0].path;
            }
          });
        }
      });

    // Set initial active tab
    const childRoute = this.activatedRoute.firstChild;
    if (childRoute) {
      childRoute.url.subscribe(segments => {
        if (segments.length > 0) {
          this.activeTab = segments[0].path;
        }
      });
    }

    // Scroll to top
    window.scrollTo(0, 0);
  }

  selectTab(tab: string): void {
    this.router.navigate(['/profile', tab]);
  }

  isActive(tab: string): boolean {
    return this.activeTab === tab;
  }
}