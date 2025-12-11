import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  showDropdown: boolean = false;
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
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
    this.router.navigate(['/profile/bookings']);
    this.closeDropdown();
  }

  goToFavorites(): void {
    this.router.navigate(['/profile/favorites']);
    this.closeDropdown();
  }

  goToSettings(): void {
    this.router.navigate(['/profile/settings']);
    this.closeDropdown();
  }

  logout(): void {
    this.authService.logout();
    this.closeDropdown();
  }
}