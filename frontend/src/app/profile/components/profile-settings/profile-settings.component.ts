import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css']
})
export class ProfileSettingsComponent implements OnInit {
  // Notification Settings
  emailNotifications: boolean = true;
  smsNotifications: boolean = false;
  pushNotifications: boolean = true;
  marketingEmails: boolean = false;

  // Privacy Settings
  profileVisibility: boolean = true;
  showBookingHistory: boolean = false;

  // UI Settings
  language: string = 'hu';
  theme: string = 'light';

  // Delete Account
  showDeleteModal: boolean = false;
  deleteConfirmText: string = '';

  // Save Status
  saveSuccess: boolean = false;
  saveError: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    // TODO: Load settings from API
    // Mock: Settings already initialized above
    console.log('Settings loaded');
  }

  saveSettings(): void {
    // TODO: API call to save settings
    console.log('Saving settings:', {
      emailNotifications: this.emailNotifications,
      smsNotifications: this.smsNotifications,
      pushNotifications: this.pushNotifications,
      marketingEmails: this.marketingEmails,
      profileVisibility: this.profileVisibility,
      showBookingHistory: this.showBookingHistory,
      language: this.language,
      theme: this.theme
    });

    // Mock success
    this.saveSuccess = true;
    this.saveError = '';

    // Hide success message after 3 seconds
    setTimeout(() => {
      this.saveSuccess = false;
    }, 3000);
  }

  onNotificationToggle(): void {
    // Auto-save on toggle
    this.saveSettings();
  }

  openDeleteModal(): void {
    this.showDeleteModal = true;
    this.deleteConfirmText = '';
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteConfirmText = '';
  }

  confirmDelete(): void {
    if (this.deleteConfirmText.toLowerCase() === 'törlés') {
      // TODO: API call to delete account
      console.log('Deleting account...');
      
      // Mock: Logout and redirect
      this.authService.logout();
      this.router.navigate(['/']);
    }
  }

  isDeleteEnabled(): boolean {
    return this.deleteConfirmText.toLowerCase() === 'törlés';
  }
}