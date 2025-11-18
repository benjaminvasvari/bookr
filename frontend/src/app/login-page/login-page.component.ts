import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../feautures/auth/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  loginForm: FormGroup;
  hidePassword = true;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Getter-ek az error message-ekhez és validációhoz
  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  // Dinamikus error message getter-ek
  get emailErrorMessage(): string {
    if (this.email.hasError('required') && this.email.touched) {
      return 'Az email cím megadása kötelező';
    }
    if (this.email.hasError('email') && this.email.touched) {
      return 'Érvénytelen email formátum';
    }
    return '';
  }

  get passwordErrorMessage(): string {
    if (this.password.hasError('required') && this.password.touched) {
      return 'A jelszó megadása kötelező';
    }
    if (this.password.hasError('minlength') && this.password.touched) {
      return 'A jelszó nem megfelelő';
    }
    return '';
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(credentials).subscribe({
        next: () => {
          // AuthService automatikusan átirányít főoldalra
          console.log('Login successful');
        },
        error: (error) => {
          this.isSubmitting = false;
          
          // Error handling
          if (error.status === 401) {
            this.errorMessage = 'Hibás email vagy jelszó';
          } else if (error.status === 0) {
            this.errorMessage = 'Nincs kapcsolat a szerverrel';
          } else {
            this.errorMessage = error.message || 'Hiba történt a bejelentkezés során';
          }
          
          console.error('Login failed:', error);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      this.loginForm.markAllAsTouched();
    }
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}