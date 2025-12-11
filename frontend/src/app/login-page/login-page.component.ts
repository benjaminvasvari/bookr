import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  isLoading = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  // Getter-ek az error message-ekhez és validációhoz
  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  // Új flag, ami jelzi hogy volt-e submit kísérlet
  isSubmitted = false;

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
      return 'A jelszónak legalább 6 karakter hosszúnak kell lennie';
    }
    return '';
  }

  onSubmit(): void {
    // Submit megjelölése
    this.isSubmitted = true;

    // Ha invalid form, return (NEM küldi el)
    if (this.loginForm.invalid) {
      return; 
    }

    // Loading state bekapcsolása
    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    // Backend hívás
    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isLoading = false;
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

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}
