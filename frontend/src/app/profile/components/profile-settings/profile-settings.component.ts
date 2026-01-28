import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

interface NotificationSettings {
  appointmentConfirmation: boolean;
  appointmentReminder: boolean;
  appointmentCancellation: boolean;
  marketingEmails: boolean;
}

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css'],
})
export class ProfileSettingsComponent implements OnInit, OnDestroy {
  passwordForm!: FormGroup;
  deleteAccountForm!: FormGroup;

  // Notification Settings
  notificationSettings: NotificationSettings = {
    appointmentConfirmation: true,
    appointmentReminder: true,
    appointmentCancellation: true,
    marketingEmails: false,
  };

  originalNotificationSettings: NotificationSettings = { ...this.notificationSettings };
  notificationSettingsChanged = false;
  isSavingNotifications = false;
  notificationSaveSuccess = false;

  // Password modal states
  showPasswordModal = false;
  isRequestingReset = false;

  // Delete Account modal states
  showDeleteAccountModal = false;
  isDeletingAccount = false;
  deleteAccountError = '';

  // Success/Error messages
  passwordResetSuccess = false;
  passwordResetError = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadNotificationSettings();
  }

  ngOnDestroy(): void {
    // Restore body scroll when component is destroyed
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  initForms(): void {
    // Password Form (csak jelenlegi jelszó)
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(8)]],
    });

    // Delete Account Form
    this.deleteAccountForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmDelete: [false, [Validators.requiredTrue]],
    });
  }

  // ==================== NOTIFICATION SETTINGS ====================

  loadNotificationSettings(): void {
    // TODO: Backend endpoint lesz később
    // Egyelőre localStorage-ból töltsük be
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      this.notificationSettings = JSON.parse(saved);
      this.originalNotificationSettings = { ...this.notificationSettings };
    }
  }

  onNotificationChange(): void {
    // Ellenőrizzük, hogy változott-e valami
    this.notificationSettingsChanged =
      JSON.stringify(this.notificationSettings) !==
      JSON.stringify(this.originalNotificationSettings);

    // Sikeres mentés üzenet eltűntetése
    if (this.notificationSettingsChanged) {
      this.notificationSaveSuccess = false;
    }
  }

  saveNotificationSettings(): void {
    this.isSavingNotifications = true;
    this.notificationSaveSuccess = false;

    // TODO: Backend API hívás lesz később
    // Egyelőre localStorage-ba mentjük
    setTimeout(() => {
      localStorage.setItem('notificationSettings', JSON.stringify(this.notificationSettings));
      this.originalNotificationSettings = { ...this.notificationSettings };
      this.notificationSettingsChanged = false;
      this.isSavingNotifications = false;
      this.notificationSaveSuccess = true;

      console.log('Notification settings saved:', this.notificationSettings);

      // Sikeres mentés üzenet eltűntetése 3 mp után
      setTimeout(() => {
        this.notificationSaveSuccess = false;
      }, 3000);
    }, 500);

    // Később így fog kinézni:
    /*
    this.userService.updateNotificationSettings(this.notificationSettings).subscribe({
      next: () => {
        this.originalNotificationSettings = { ...this.notificationSettings };
        this.notificationSettingsChanged = false;
        this.isSavingNotifications = false;
        this.notificationSaveSuccess = true;

        setTimeout(() => {
          this.notificationSaveSuccess = false;
        }, 3000);
      },
      error: (error) => {
        console.error('Error saving notification settings:', error);
        this.isSavingNotifications = false;
      },
    });
    */
  }

  // ==================== PASSWORD RESET ====================

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.passwordForm.reset();
    this.passwordResetSuccess = false;
    this.passwordResetError = '';

    // Disable body scroll
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordForm.reset();
    this.passwordResetSuccess = false;
    this.passwordResetError = '';

    // Enable body scroll
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  requestPasswordReset(): void {
    if (this.passwordForm.valid) {
      const currentPassword = this.passwordForm.get('currentPassword')?.value;

      this.isRequestingReset = true;
      this.passwordResetError = '';

      this.userService.requestPasswordReset(currentPassword).subscribe({
        next: () => {
          this.passwordResetSuccess = true;
          this.isRequestingReset = false;

          // Modal bezárása 2 másodperc után
          setTimeout(() => {
            this.closePasswordModal();
          }, 2000);
        },
        error: (error) => {
          console.error('Password reset request error:', error);
          this.passwordResetError = error.error?.message || 'Hibás jelszó vagy hiba történt.';
          this.isRequestingReset = false;
          this.passwordResetSuccess = false;
        },
      });
    } else {
      this.passwordResetError = 'Kérjük, add meg a jelenlegi jelszavadat.';
    }
  }

  // ==================== DELETE ACCOUNT ====================

  openDeleteAccountModal(): void {
    this.showDeleteAccountModal = true;
    this.deleteAccountForm.reset();
    this.deleteAccountError = '';

    // Disable body scroll
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  closeDeleteAccountModal(): void {
    this.showDeleteAccountModal = false;
    this.deleteAccountForm.reset();
    this.deleteAccountError = '';

    // Enable body scroll
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  deleteAccount(): void {
    if (this.deleteAccountForm.valid) {
      const password = this.deleteAccountForm.get('password')?.value;

      this.isDeletingAccount = true;
      this.deleteAccountError = '';

      // TODO: Backend endpoint lesz később
      // Egyelőre csak console.log
      setTimeout(() => {
        console.log('Account deletion requested with password:', password);
        console.log('Confirmation checkbox:', this.deleteAccountForm.get('confirmDelete')?.value);

        // Sikeres törlés után logout és átirányítás
        this.isDeletingAccount = false;
        this.closeDeleteAccountModal();

        alert('Fiók törlése sikeres! (Demo mód - backend endpoint szükséges)');

        // Logout és redirect
        // this.authService.logout();
        // this.router.navigate(['/']);
      }, 1000);

      // Később így fog kinézni:
      /*
      this.userService.deleteAccount(password).subscribe({
        next: () => {
          this.isDeletingAccount = false;
          this.closeDeleteAccountModal();

          // Logout és redirect
          this.authService.logout();
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Account deletion error:', error);
          this.deleteAccountError = error.error?.message || 'Hibás jelszó vagy hiba történt.';
          this.isDeletingAccount = false;
        },
      });
      */
    } else {
      this.deleteAccountError = 'Kérjük, töltsd ki az összes mezőt és erősítsd meg a törlést.';
    }
  }
}