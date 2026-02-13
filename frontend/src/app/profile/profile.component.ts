import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { User } from '../core/models';

// Child components
import { ProfileInfoComponent } from './components/profile-info/profile-info.component';
import { ProfileBookingsComponent } from './components/profile-bookings/profile-bookings.component';
import { ProfileFavoritesComponent } from './components/profile-favorites/profile-favorites.component';
import { ProfileSettingsComponent } from './components/profile-settings/profile-settings.component';

type TabType = 'info' | 'bookings' | 'favorites' | 'settings';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ProfileInfoComponent,
    ProfileBookingsComponent,
    ProfileFavoritesComponent,
    ProfileSettingsComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  activeTab: TabType = 'info';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
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

    // Check for fragment to set active tab
    this.route.fragment.subscribe(fragment => {
      if (fragment && (fragment === 'info' || fragment === 'bookings' || fragment === 'favorites' || fragment === 'settings')) {
        this.activeTab = fragment as TabType;
      }
    });

    // Scroll to top
    window.scrollTo(0, 0);
  }

  selectTab(tab: TabType): void {
    this.activeTab = tab;
  }

  isActive(tab: TabType): boolean {
    return this.activeTab === tab;
  }

  onLogout(): void {
    this.authService.logout();
  }
}