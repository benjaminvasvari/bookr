import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

  constructor(
    private fb: FormBuilder,
    private router: Router
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
      return 'A jelszónak legalább 8 karakter hosszúnak kell lennie';
    }
    return '';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      // TODO: Implement authentication logic
      console.log('Login attempt:', { email, password });
      // Navigate to dashboard after successful login
      // this.router.navigate(['/dashboard']);
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