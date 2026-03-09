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
      if (fragment && this.isValidTab(fragment)) {
        this.activeTab = fragment;
      } else if (!fragment) {
        this.updateUrlFragment(this.activeTab, true);
      }
    });

    // Scroll to top
    window.scrollTo(0, 0);
  }

  selectTab(tab: TabType): void {
    if (this.activeTab === tab) {
      return;
    }

    this.activeTab = tab;
    this.updateUrlFragment(tab);
  }

  isActive(tab: TabType): boolean {
    return this.activeTab === tab;
  }

  onLogout(): void {
    this.authService.logout();
  }

  private isValidTab(tab: string): tab is TabType {
    return tab === 'info' || tab === 'bookings' || tab === 'favorites' || tab === 'settings';
  }

  private updateUrlFragment(tab: TabType, replaceUrl = false): void {
    this.router.navigate([], {
      relativeTo: this.route,
      fragment: tab,
      queryParamsHandling: 'preserve',
      replaceUrl,
    });
  }
}