import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  showDropdown = false;
  hasCompany = false;
  private userSubscription?: Subscription;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.hasCompany = !!(user && user.companyId);

      console.log('Header - Current user:', user);
      console.log('Header - Has company:', this.hasCompany);
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
    this.closeDropdown();
  }

  goToBookings(): void {
    this.router.navigate(['/profile'], { fragment: 'bookings' });
    this.closeDropdown();
  }

  goToFavorites(): void {
    this.router.navigate(['/profile'], { fragment: 'favorites' });
    this.closeDropdown();
  }

  goToSettings(): void {
    this.router.navigate(['/profile'], { fragment: 'settings' });
    this.closeDropdown();
  }

  logout(): void {
    this.authService.logout();
    this.closeDropdown();
  }

  get isStaff(): boolean {
    const user = this.currentUser;
    if (!user) {
      return false;
    }

    return user.roleId === 3 && !!user.companyId;
  }

  /**
   * Dinamikus gomb kattintás kezelése
   */
  handleBusinessButtonClick(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    } else if (this.hasCompany) {
      this.router.navigate(['/owner']);
    } else {
      this.router.navigate(['/register-business']);
    }
  }

  /**
   * Gomb szövege (dinamikus)
   */
  getBusinessButtonText(): string {
    if (!this.currentUser) {
      return 'Cég regisztrálása';
    }

    if (this.hasCompany) {
      return 'Cég vezérlése';
    }

    return 'Cég regisztrálása';
  }

  /**
   * Gomb ikonja (dinamikus)
   */
  getBusinessButtonIcon(): string {
    if (this.hasCompany) {
      return 'fas fa-chart-line';
    }

    return '';
  }
}