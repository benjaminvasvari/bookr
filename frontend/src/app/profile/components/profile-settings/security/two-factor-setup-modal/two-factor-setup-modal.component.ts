import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  QueryList,
  ViewChildren,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../../core/services/auth.service';
import { UserService } from '../../../../../core/services/user.service';

interface AuthenticatorApp {
  name: string;
  shortName: string;
  url: string;
}

interface SetupStep {
  number: number;
  label: string;
}

@Component({
  selector: 'app-two-factor-setup-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './two-factor-setup-modal.component.html',
  styleUrl: './two-factor-setup-modal.component.css',
})
export class TwoFactorSetupModalComponent {
  @Output() setupComplete = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();

  @ViewChildren('codeInput') private codeInputs?: QueryList<ElementRef<HTMLInputElement>>;

  readonly currentStep = signal(1);
  readonly showSecretKey = signal(false);
  readonly verificationDigits = signal<string[]>(Array.from({ length: 6 }, () => ''));
  readonly verificationError = signal('');
  readonly recoveryCodesSaved = signal(false);
  readonly copyFeedback = signal('');
  readonly setupError = signal('');
  readonly isFinishing = signal(false);

  readonly passwordForm = inject(FormBuilder).group({
    currentPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly qrCodeAsset = 'assets/images/mock-2fa-qr.svg';
  readonly secretKey = 'JBSWY3DPEHPK3PXP';
  readonly acceptedVerificationCode = '123456';
  readonly steps: SetupStep[] = [
    { number: 1, label: 'Jelszó' },
    { number: 2, label: 'QR kód' },
    { number: 3, label: 'Kód' },
    { number: 4, label: 'Mentés' },
  ];
  readonly authenticatorApps: AuthenticatorApp[] = [
    {
      name: 'Google Authenticator',
      shortName: 'G',
      url: 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2',
    },
    {
      name: 'Microsoft Authenticator',
      shortName: 'M',
      url: 'https://www.microsoft.com/security/mobile-authenticator-app',
    },
    {
      name: 'Authy',
      shortName: 'A',
      url: 'https://www.authy.com/download/',
    },
  ];
  readonly recoveryCodes: string[] = [
    'A1B2-C3D4',
    'E5F6-G7H8',
    'J9K1-L2M3',
    'N4P5-Q6R7',
    'S8T9-U1V2',
    'W3X4-Y5Z6',
    'B7C8-D9E1',
    'F2G3-H4J5',
  ];

  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  currentTitle(): string {
    switch (this.currentStep()) {
      case 1:
        return 'Kétlépcsős azonosítás bekapcsolása';
      case 2:
        return 'Authenticator app beállítása';
      case 3:
        return 'Erősítsd meg a beállítást';
      case 4:
        return 'Mentsd el a visszaállítási kódokat!';
      default:
        return 'Kétlépcsős azonosítás';
    }
  }

  continueFromPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.setupError.set('A bekapcsoláshoz add meg a jelenlegi jelszavadat.');
      return;
    }

    this.setupError.set('');
    this.currentStep.set(2);
  }

  continueFromQr(): void {
    this.setupError.set('');
    this.currentStep.set(3);
    setTimeout(() => this.focusInput(0));
  }

  toggleSecretKey(): void {
    this.showSecretKey.update((value) => !value);
  }

  onCodeKeyup(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/\D/g, '').slice(-1);
    const nextDigits = [...this.verificationDigits()];

    input.value = sanitizedValue;
    nextDigits[index] = sanitizedValue;
    this.verificationDigits.set(nextDigits);
    this.verificationError.set('');
    this.setupError.set('');

    if (event.key === 'Backspace') {
      if (!sanitizedValue && index > 0) {
        this.focusInput(index - 1);
      }
      return;
    }

    if (sanitizedValue && index < nextDigits.length - 1) {
      this.focusInput(index + 1);
    }
  }

  onCodePaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';
    if (!pasted) {
      return;
    }

    const nextDigits = Array.from({ length: 6 }, (_, index) => pasted[index] ?? '');
    this.verificationDigits.set(nextDigits);
    this.verificationError.set('');

    setTimeout(() => {
      const nextIndex = Math.min(pasted.length, 5);
      this.focusInput(nextIndex);
    });
  }

  verifyCode(): void {
    if (this.verificationDigits().join('') !== this.acceptedVerificationCode) {
      this.verificationError.set('Érvénytelen kód, próbáld újra');
      return;
    }

    this.verificationError.set('');
    this.currentStep.set(4);
  }

  copyRecoveryCodes(): void {
    const content = this.recoveryCodes.join('\n');

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(content).then(() => {
        this.showCopyFeedback();
      });
      return;
    }

    this.showCopyFeedback();
  }

  downloadRecoveryCodes(): void {
    const blob = new Blob([this.recoveryCodes.join('\r\n')], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'bookr-recovery-codes.txt';
    link.click();

    window.URL.revokeObjectURL(url);
  }

  updateRecoveryCodesSaved(event: Event): void {
    this.recoveryCodesSaved.set((event.target as HTMLInputElement).checked);
  }

  finishSetup(): void {
    if (!this.recoveryCodesSaved() || this.isFinishing()) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.setupError.set('A 2FA beállításához be kell jelentkezned.');
      return;
    }

    this.isFinishing.set(true);
    this.setupError.set('');

    this.userService
      .updateTwoFactorEnabled(currentUser.id, true, this.passwordForm.get('currentPassword')?.value ?? '')
      .subscribe({
        next: () => {
          this.isFinishing.set(false);
          this.setupComplete.emit();
        },
        error: (error) => {
          console.error('2FA setup error:', error);
          this.setupError.set(
            error instanceof Error
              ? error.message
              : error.error?.message || 'A 2FA beállítás mentése nem sikerült.'
          );
          this.isFinishing.set(false);
        },
      });
  }

  requestDismiss(): void {
    if (this.isDismissBlocked()) {
      return;
    }

    this.dismissed.emit();
  }

  isDismissBlocked(): boolean {
    return this.isFinishing() || (this.currentStep() === 4 && !this.recoveryCodesSaved());
  }

  isStepCompleted(stepNumber: number): boolean {
    return stepNumber < this.currentStep();
  }

  isStepActive(stepNumber: number): boolean {
    return stepNumber === this.currentStep();
  }

  private focusInput(index: number): void {
    this.codeInputs?.get(index)?.nativeElement.focus();
  }

  private showCopyFeedback(): void {
    this.copyFeedback.set('A recovery kódok a vágólapra kerültek.');
    setTimeout(() => this.copyFeedback.set(''), 2500);
  }
}