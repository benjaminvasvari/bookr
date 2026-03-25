import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { UpdateNotificationSettingsRequest } from '../../../core/models';
import { ThemeMode, ThemeService } from '../../../core/services/theme.service';
import { Subscription } from 'rxjs';
import { TwoFactorSetupModalComponent } from './security/two-factor-setup-modal/two-factor-setup-modal.component';

interface NotificationSettings {
  appointmentConfirmation: boolean;
  appointmentReminder: boolean;
  appointmentCancellation: boolean;
  marketingEmails: boolean;
}

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TwoFactorSetupModalComponent],
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css'],
})
export class ProfileSettingsComponent implements OnInit, OnDestroy {
  passwordForm!: FormGroup;
  deleteAccountForm!: FormGroup;
  disableTwoFactorForm!: FormGroup;
  isDarkMode = false;
  followSystemTheme = false;
  twoFactorEnabled = signal(false);

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
  private hasPendingNotificationSave = false;
  private themeSubscription?: Subscription;

  // Password modal states
  showPasswordModal = false;
  isRequestingReset = false;

  // 2FA modal states
  showTwoFactorModal = false;
  showDisableTwoFactorModal = false;
  isSavingTwoFactor = false;

  // Delete Account modal states
  showDeleteAccountModal = false;
  isDeletingAccount = false;
  deleteAccountError = '';

  // Success/Error messages
  passwordResetSuccess = false;
  passwordResetError = '';
  twoFactorError = '';
  twoFactorSuccess = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadNotificationSettings();
    this.loadTwoFactorSettings();

    this.themeSubscription = this.themeService.isDarkMode$.subscribe((isDarkMode) => {
      this.isDarkMode = isDarkMode;
    });

    this.themeSubscription.add(
      this.themeService.themeMode$.subscribe((mode: ThemeMode) => {
        this.followSystemTheme = mode === 'system';
      })
    );
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();

    // Restore body scroll when component is destroyed
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  onDarkModeChange(): void {
    if (this.followSystemTheme) {
      return;
    }

    this.themeService.setDarkMode(this.isDarkMode);
  }

  onFollowSystemThemeChange(): void {
    if (this.followSystemTheme) {
      this.themeService.setThemeMode('system');
      return;
    }

    this.themeService.setDarkMode(this.isDarkMode);
  }

  initForms(): void {
    // Password Form (csak jelenlegi jelszó)
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(8)]],
    });

    // Delete Account Form
    this.deleteAccountForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    // 2FA kikapcsolás megerősítés
    this.disableTwoFactorForm = this.fb.group({
      password: ['', [Validators.required]],
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
    this.notificationSaveSuccess = false;

    if (this.isSavingNotifications) {
      this.hasPendingNotificationSave = true;
      return;
    }

    this.saveNotificationSettings();
  }

  saveNotificationSettings(): void {
    this.isSavingNotifications = true;
    this.notificationSaveSuccess = false;

    const currentUser = this.authService.getCurrentUser();
    const request: UpdateNotificationSettingsRequest = {
      id: String(currentUser?.id ?? ''),
      confirm: this.notificationSettings.appointmentConfirmation,
      reminder: this.notificationSettings.appointmentReminder,
      cancel: this.notificationSettings.appointmentCancellation,
      marketing: this.notificationSettings.marketingEmails,
    };

    this.userService.updateNotificationSettings(request).subscribe({
      next: () => {
        localStorage.setItem('notificationSettings', JSON.stringify(this.notificationSettings));
        this.originalNotificationSettings = { ...this.notificationSettings };
        this.notificationSettingsChanged = false;
        this.isSavingNotifications = false;

        if (this.hasPendingNotificationSave) {
          this.hasPendingNotificationSave = false;
          this.saveNotificationSettings();
        }
      },
      error: (error) => {
        console.error('Error saving notification settings:', error);
        this.isSavingNotifications = false;

        if (this.hasPendingNotificationSave) {
          this.hasPendingNotificationSave = false;
          this.saveNotificationSettings();
        }
      },
    });
  }

  // ==================== TWO FACTOR AUTHENTICATION ====================

  loadTwoFactorSettings(): void {
    const currentUser = this.authService.getCurrentUser();
    this.twoFactorEnabled.set(this.userService.getTwoFactorEnabled(currentUser?.id));
  }

  onTwoFactorToggleChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    this.twoFactorError = '';
    this.twoFactorSuccess = '';

    if (checked) {
      this.openTwoFactorModal();
      return;
    }

    this.openDisableTwoFactorModal();
  }

  openTwoFactorModal(): void {
    this.showTwoFactorModal = true;
    this.twoFactorError = '';
    this.syncBodyScrollLock();
  }

  closeTwoFactorModal(): void {
    this.showTwoFactorModal = false;
    this.twoFactorError = '';
    this.syncBodyScrollLock();
  }

  handleTwoFactorSetupComplete(): void {
    this.twoFactorEnabled.set(true);
    this.twoFactorSuccess = 'A kétlépcsős azonosítás sikeresen be lett kapcsolva.';
    this.twoFactorError = '';
    this.closeTwoFactorModal();
  }

  openDisableTwoFactorModal(): void {
    this.showDisableTwoFactorModal = true;
    this.disableTwoFactorForm.reset();
    this.twoFactorError = '';
    this.syncBodyScrollLock();
  }

  closeDisableTwoFactorModal(): void {
    this.showDisableTwoFactorModal = false;
    this.disableTwoFactorForm.reset();
    this.twoFactorError = '';
    this.syncBodyScrollLock();
  }

  confirmDisableTwoFactor(): void {
    if (this.disableTwoFactorForm.invalid) {
      this.twoFactorError = 'A kikapcsoláshoz add meg a jelszavadat.';
      return;
    }

    this.updateTwoFactor(false, this.disableTwoFactorForm.get('password')?.value);
  }

  private updateTwoFactor(enabled: boolean, password?: string): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.twoFactorError = 'A 2FA beállításához be kell jelentkezned.';
      return;
    }

    this.isSavingTwoFactor = true;
    this.twoFactorError = '';

    this.userService.updateTwoFactorEnabled(currentUser.id, enabled, password).subscribe({
      next: () => {
        this.twoFactorEnabled.set(enabled);
        this.twoFactorSuccess = enabled
          ? 'A kétlépcsős azonosítás sikeresen be lett kapcsolva.'
          : 'A kétlépcsős azonosítás ki lett kapcsolva.';
        this.isSavingTwoFactor = false;

        this.closeDisableTwoFactorModal();
      },
      error: (error) => {
        console.error('2FA update error:', error);
        this.twoFactorError =
          error instanceof Error
            ? error.message
            : error.error?.message || 'A 2FA beállítás mentése nem sikerült.';
        this.isSavingTwoFactor = false;
      },
    });
  }

  private syncBodyScrollLock(): void {
    const hasOpenModal = this.showPasswordModal || this.showTwoFactorModal || this.showDisableTwoFactorModal || this.showDeleteAccountModal;

    document.documentElement.style.overflow = hasOpenModal ? 'hidden' : '';
    document.body.style.overflow = hasOpenModal ? 'hidden' : '';
  }

  // ==================== PASSWORD RESET ====================

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.passwordForm.reset();
    this.passwordResetSuccess = false;
    this.passwordResetError = '';

    // Disable body scroll
    this.syncBodyScrollLock();
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordForm.reset();
    this.passwordResetSuccess = false;
    this.passwordResetError = '';

    // Enable body scroll
    this.syncBodyScrollLock();
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
    this.syncBodyScrollLock();
  }

  closeDeleteAccountModal(): void {
    this.showDeleteAccountModal = false;
    this.deleteAccountForm.reset();
    this.deleteAccountError = '';

    // Enable body scroll
    this.syncBodyScrollLock();
  }

  deleteAccount(): void {
    if (this.deleteAccountForm.valid) {
      const password = this.deleteAccountForm.get('password')?.value;

      this.isDeletingAccount = true;
      this.deleteAccountError = '';

      this.userService.deleteAccount(password).subscribe({
        next: () => {
          this.isDeletingAccount = false;
          this.closeDeleteAccountModal();

          // Session törlése és redirect
          this.authService.logout();
        },
        error: (error) => {
          console.error('Account deletion error:', error);
          this.deleteAccountError = error.error?.message || 'Hibás jelszó vagy hiba történt.';
          this.isDeletingAccount = false;
        },
      });
    } else {
      this.deleteAccountError = 'A jelszónak legalább 8 karakter hosszúnak kell lennie.';
    }
  }
}