import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import QRCode from 'qrcode';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationSettingsResponse, UpdateNotificationSettingsRequest } from '../../../core/models';
import { ThemeMode, ThemeService } from '../../../core/services/theme.service';
import { Subscription, finalize } from 'rxjs';

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
  twoFactorForm!: FormGroup;
  isDarkMode = false;
  followSystemTheme = false;
  twoFactorEnabled = false;

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
  isSavingTwoFactor = false;
  isLoadingTwoFactorSetup = false;
  twoFactorMode: 'enable' | 'disable' = 'enable';
  twoFactorSetupSecret = '';
  twoFactorSetupQrUrl = '';
  twoFactorQrCodeDataUrl = '';
  recoveryCodes: string[] = [];

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

    // 2FA bekapcsolás megerősítés
    this.twoFactorForm = this.fb.group({
      verificationCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  // ==================== NOTIFICATION SETTINGS ====================

  loadNotificationSettings(): void {
    this.userService.getNotificationSettings().subscribe({
      next: (response: NotificationSettingsResponse) => {
        const settings = response.result;

        this.notificationSettings = {
          appointmentConfirmation: settings.confirm,
          appointmentReminder: settings.reminder,
          appointmentCancellation: settings.cancel,
          marketingEmails: settings.marketing,
        };
        this.originalNotificationSettings = { ...this.notificationSettings };
      },
      error: (error) => {
        console.error('Error loading notification settings:', error);
      },
    });
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
    this.userService.getTwoFactorStatus().subscribe({
      next: (response) => {
        this.twoFactorEnabled = response.twoFactorEnabled;
      },
      error: (error) => {
        console.error('2FA status load error:', error);
        const currentUser = this.authService.getCurrentUser();
        this.twoFactorEnabled = Boolean(
          currentUser?.twoFactorEnabled ?? currentUser?.isTwoFactorEnabled
        );
      },
    });
  }

  onTwoFactorToggleChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    this.twoFactorError = '';
    this.twoFactorSuccess = '';

    if (checked) {
      this.openTwoFactorModal('enable');
      return;
    }

    this.openTwoFactorModal('disable');
  }

  openTwoFactorModal(mode: 'enable' | 'disable'): void {
    this.twoFactorMode = mode;
    this.showTwoFactorModal = true;
    this.resetTwoFactorModalState();

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    if (mode === 'enable') {
      this.requestTwoFactorSetup();
    }
  }

  closeTwoFactorModal(force = false): void {
    if (!force && (this.isSavingTwoFactor || this.isLoadingTwoFactorSetup)) {
      return;
    }

    this.showTwoFactorModal = false;
    this.resetTwoFactorModalState();

    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  confirmEnableTwoFactor(): void {
    if (this.twoFactorForm.invalid) {
      this.twoFactorError = 'Add meg az authenticator alkalmazás 6 jegyű kódját.';
      return;
    }

    if (!this.twoFactorSetupSecret) {
      this.twoFactorError = 'A 2FA setup még nem töltődött be. Próbáld újra.';
      return;
    }

    const code = Number(this.twoFactorForm.get('verificationCode')?.value);
    this.isSavingTwoFactor = true;
    this.twoFactorError = '';
    this.twoFactorSuccess = '';

    this.userService
      .confirmTwoFactor(this.twoFactorSetupSecret, code)
      .pipe(finalize(() => (this.isSavingTwoFactor = false)))
      .subscribe({
        next: (response) => {
          this.twoFactorEnabled = true;
          this.recoveryCodes = response.recoveryCodes ?? [];
          this.twoFactorSuccess = response.message || 'A kétlépcsős azonosítás sikeresen be lett kapcsolva.';
          this.twoFactorForm.reset();
        },
        error: (error) => {
          console.error('2FA confirm error:', error);
          this.twoFactorError = error.error?.message || 'A 2FA megerősítése nem sikerült.';
        },
      });
  }

  confirmDisableTwoFactor(): void {
    if (this.twoFactorForm.invalid) {
      this.twoFactorError = 'A kikapcsoláshoz add meg az authenticator alkalmazás 6 jegyű kódját.';
      return;
    }

    const code = Number(this.twoFactorForm.get('verificationCode')?.value);
    this.isSavingTwoFactor = true;
    this.twoFactorError = '';
    this.twoFactorSuccess = '';

    this.userService
      .disableTwoFactor(code)
      .pipe(finalize(() => (this.isSavingTwoFactor = false)))
      .subscribe({
        next: (response) => {
          this.twoFactorEnabled = false;
          this.twoFactorSuccess = response.message || 'A kétlépcsős azonosítás ki lett kapcsolva.';
          this.closeTwoFactorModal(true);
        },
        error: (error) => {
          console.error('2FA disable error:', error);
          this.twoFactorError = error.error?.message || 'A 2FA kikapcsolása nem sikerült.';
        },
      });
  }

  downloadRecoveryCodes(): void {
    if (!this.recoveryCodes.length) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const issuedAt = new Date().toLocaleString('hu-HU');
    const fileContent = [
      'BookR 2FA helyreallitasi kodok',
      '',
      `Felhasznalo: ${currentUser?.email ?? 'ismeretlen'}`,
      `Generalva: ${issuedAt}`,
      '',
      'Fontos: tarold ezeket a kodokat biztonsagos helyen.',
      'Mindegyik kod egyszer hasznalhato fel.',
      '',
      ...this.recoveryCodes,
      '',
    ].join('\n');

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeEmail = (currentUser?.email ?? 'user').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();

    link.href = url;
    link.download = `bookr-2fa-recovery-codes-${safeEmail}.txt`;
    link.click();

    URL.revokeObjectURL(url);
  }

  private requestTwoFactorSetup(): void {
    this.isLoadingTwoFactorSetup = true;
    this.twoFactorError = '';

    this.userService
      .setupTwoFactor()
      .pipe(finalize(() => (this.isLoadingTwoFactorSetup = false)))
      .subscribe({
        next: (response) => {
          this.twoFactorSetupSecret = response.secret;
          this.twoFactorSetupQrUrl = response.qrUrl;
          this.generateTwoFactorQrCode(response.qrUrl).catch((error) => {
            console.error('QR generation error:', error);
            this.twoFactorError = 'A QR-kód generálása nem sikerült, de a secret még használható.';
          });
        },
        error: (error) => {
          console.error('2FA setup error:', error);

          if (error?.status === 409 && error?.error?.status === 'twoFactorAlreadyEnabled') {
            this.twoFactorEnabled = true;
            this.closeTwoFactorModal(true);
            this.twoFactorSuccess = 'A kétlépcsős azonosítás ennél a fióknál már be van kapcsolva.';
            return;
          }

          this.twoFactorError = this.getTwoFactorErrorMessage(
            error,
            'A 2FA setup betöltése nem sikerült.'
          );
        },
      });
  }

  private async generateTwoFactorQrCode(qrUrl: string): Promise<void> {
    this.twoFactorQrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 220,
      margin: 1,
      color: {
        dark: '#1f2937',
        light: '#FFFFFFFF',
      },
    });
  }

  private resetTwoFactorModalState(): void {
    this.twoFactorForm.reset();
    this.twoFactorError = '';
    this.twoFactorSetupSecret = '';
    this.twoFactorSetupQrUrl = '';
    this.twoFactorQrCodeDataUrl = '';
    this.recoveryCodes = [];
    this.isLoadingTwoFactorSetup = false;
  }

  private getTwoFactorErrorMessage(error: unknown, fallbackMessage: string): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: { message?: string } }).error?.message === 'string'
    ) {
      return (error as { error: { message: string } }).error.message;
    }

    return fallbackMessage;
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