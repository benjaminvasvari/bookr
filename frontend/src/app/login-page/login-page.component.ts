import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginTwoFactorRequiredResponse } from '../core/models';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
})
export class LoginPageComponent {
  loginForm: FormGroup;
  hidePassword = true;
  hideVerificationCode = false;
  isLoading = false;
  errorMessage = '';
  twoFactorPendingToken = '';
  isTwoFactorStep = false;
  isSubmitted = false;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      verificationCode: [''],
    });
  }

  // Getter-ek az error message-ekhez és validációhoz
  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  get verificationCode() {
    return this.loginForm.get('verificationCode')!;
  }

  get emailErrorMessage(): string {
    if (!this.isSubmitted) return '';

    if (this.email.hasError('required')) {
      return 'Az email cím megadása kötelező';
    }
    if (this.email.hasError('email')) {
      return 'Érvénytelen email formátum';
    }
    return '';
  }

  get passwordErrorMessage(): string {
    if (!this.isSubmitted) return '';

    if (this.password.hasError('required')) {
      return 'A jelszó megadása kötelező';
    }
    if (this.password.hasError('minlength')) {
      return 'A jelszónak legalább 8 karakter hosszúnak kell lennie';
    }
    return '';
  }

  get verificationCodeErrorMessage(): string {
    if (!this.isSubmitted || !this.isTwoFactorStep) return '';

    if (this.verificationCode.hasError('required')) {
      return 'A hitelesítő kód megadása kötelező';
    }

    if (this.verificationCode.hasError('pattern')) {
      return 'A kódnak pontosan 6 számjegyből kell állnia';
    }

    return '';
  }

  onSubmit(): void {
    this.isSubmitted = true;

    if (this.isTwoFactorStep) {
      this.submitTwoFactorVerification();
      return;
    }

    if (this.email.invalid || this.password.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.status === '2faRequired') {
          this.beginTwoFactorStep(response);
          return;
        }

        if (response.status === 'success') {
          this.router.navigate(['/']);
        } else {
          this.errorMessage = 'Rossz email cím vagy jelszó.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Rossz email cím vagy jelszó.';
        console.error('Login error:', error);
      },
    });
  }

  backToPasswordLogin(): void {
    this.isTwoFactorStep = false;
    this.twoFactorPendingToken = '';
    this.errorMessage = '';
    this.isSubmitted = false;
    this.hideVerificationCode = false;

    this.verificationCode.reset('');
    this.verificationCode.clearValidators();
    this.verificationCode.updateValueAndValidity();

    this.email.enable({ emitEvent: false });
    this.password.enable({ emitEvent: false });
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleVerificationCodeVisibility(): void {
    this.hideVerificationCode = !this.hideVerificationCode;
  }

  private beginTwoFactorStep(response: LoginTwoFactorRequiredResponse): void {
    this.isTwoFactorStep = true;
    this.twoFactorPendingToken = response.pendingToken;
    this.errorMessage = '';
    this.isSubmitted = false;

    this.verificationCode.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
    this.verificationCode.reset('');
    this.verificationCode.updateValueAndValidity();

    this.email.disable({ emitEvent: false });
    this.password.disable({ emitEvent: false });
  }

  private submitTwoFactorVerification(): void {
    if (this.verificationCode.invalid || !this.twoFactorPendingToken) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService
      .verifyTwoFactorLogin(this.twoFactorPendingToken, Number(this.verificationCode.value))
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          if (response.status === 'success') {
            this.router.navigate(['/']);
            return;
          }

          this.errorMessage = 'A hitelesítő kód ellenőrzése nem sikerült.';
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Érvénytelen vagy lejárt hitelesítő kód.';
          console.error('2FA verify error:', error);
        },
      });
  }
}
