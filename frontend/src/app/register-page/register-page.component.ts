import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Custom validator for password matching
export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value 
      ? null 
      : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isSubmitting = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\d\s\+\-\(\)]+$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator() });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isSubmitting = true;
      
      // TODO: Implement registration logic with backend service
      const formData = this.registerForm.value;
      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...registrationData } = formData;
      console.log('Registration data:', registrationData);
      
      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;
        // Navigate to login or dashboard after successful registration
        this.router.navigate(['/login']);
      }, 1000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  // Getters for form controls
  get lastName() {
    return this.registerForm.get('lastName')!;
  }

  get firstName() {
    return this.registerForm.get('firstName')!;
  }

  get email() {
    return this.registerForm.get('email')!;
  }

  get phone() {
    return this.registerForm.get('phone')!;
  }

  get password() {
    return this.registerForm.get('password')!;
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword')!;
  }

  // Dynamic error message getters
  get lastNameErrorMessage(): string {
    if (this.lastName.hasError('required') && this.lastName.touched) {
      return 'A vezetéknév megadása kötelező';
    }
    if (this.lastName.hasError('minlength') && this.lastName.touched) {
      return 'A vezetéknévnek legalább 2 karakter hosszúnak kell lennie';
    }
    return '';
  }

  get firstNameErrorMessage(): string {
    if (this.firstName.hasError('required') && this.firstName.touched) {
      return 'A keresztnév megadása kötelező';
    }
    if (this.firstName.hasError('minlength') && this.firstName.touched) {
      return 'A keresztnévnek legalább 2 karakter hosszúnak kell lennie';
    }
    return '';
  }

  get emailErrorMessage(): string {
    if (this.email.hasError('required') && this.email.touched) {
      return 'Az email cím megadása kötelező';
    }
    if (this.email.hasError('email') && this.email.touched) {
      return 'Érvénytelen email formátum';
    }
    return '';
  }

  get phoneErrorMessage(): string {
    if (this.phone.hasError('required') && this.phone.touched) {
      return 'A telefonszám megadása kötelező';
    }
    if (this.phone.hasError('pattern') && this.phone.touched) {
      return 'Érvénytelen telefonszám formátum';
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

  get confirmPasswordErrorMessage(): string {
    if (this.confirmPassword.hasError('required') && this.confirmPassword.touched) {
      return 'A jelszó megerősítése kötelező';
    }
    if (this.registerForm.hasError('passwordMismatch') && this.confirmPassword.touched && !this.confirmPassword.hasError('required')) {
      return 'A két jelszó nem egyezik meg';
    }
    return '';
  }

  // Password visibility toggles
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}