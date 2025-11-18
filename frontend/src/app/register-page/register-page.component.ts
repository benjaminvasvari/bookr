import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { passwordStrengthValidator, namePatternValidator, hungarianPhoneValidator, passwordMatchValidator } from '../validators/custom-validators';
import { AuthService } from '../feautures/auth/services/auth.service';

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
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      lastName: ['', [Validators.required, Validators.minLength(2), namePatternValidator()]],
      firstName: ['', [Validators.required, Validators.minLength(2), namePatternValidator()]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, hungarianPhoneValidator()]],
      password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator()]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator() });
  }

  onSubmit(): void {
    if (this.registerForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.errorMessage = '';

      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...registrationData } = this.registerForm.value;

      this.authService.register(registrationData).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          // AuthService automatikusan átirányít login oldalra
        },
        error: (error) => {
          this.isSubmitting = false;
          
          // Error handling
          if (error.status === 400) {
            this.errorMessage = error.message || 'Hibás adatok';
          } else if (error.status === 409) {
            this.errorMessage = 'Ez az email cím már regisztrálva van';
          } else if (error.status === 0) {
            this.errorMessage = 'Nincs kapcsolat a szerverrel';
          } else {
            this.errorMessage = error.message || 'Hiba történt a regisztráció során';
          }
          
          console.error('Registration failed:', error);
        }
      });
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
    if (this.lastName.hasError('invalidNamePattern') && this.lastName.touched) {
      return 'Csak betűk, szóköz és kötőjel engedélyezett';
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
    if (this.firstName.hasError('invalidNamePattern') && this.firstName.touched) {
      return 'Csak betűk, szóköz és kötőjel engedélyezett';
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
    if (this.phone.hasError('invalidHungarianPhone') && this.phone.touched) {
      return 'Érvénytelen magyar telefonszám (pl. +36 20 123 4567)';
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
    
    // Password strength hibák összegyűjtése
    const missingRequirements: string[] = [];
    
    if (this.password.hasError('missingLowercase') && this.password.touched) {
      missingRequirements.push('kisbetű');
    }
    if (this.password.hasError('missingUppercase') && this.password.touched) {
      missingRequirements.push('nagybetű');
    }
    if (this.password.hasError('missingNumber') && this.password.touched) {
      missingRequirements.push('szám');
    }
    if (this.password.hasError('missingSpecialChar') && this.password.touched) {
      missingRequirements.push('speciális karakter');
    }
    
    if (missingRequirements.length > 0) {
      return `A jelszó nem megfelelő`;
    }
    
    return '';
  }

  get confirmPasswordErrorMessage(): string {
    // Először a PASSWORD mező hibáit ellenőrizzük
    if (this.password.invalid && this.password.touched) {
      // Password strength hibák
      const missingRequirements: string[] = [];
      
      if (this.password.hasError('required')) {
        return 'A jelszó megadása kötelező';
      }
      if (this.password.hasError('minlength')) {
        return 'A jelszó nem megfelelő';
      }
      if (this.password.hasError('missingLowercase')) {
        missingRequirements.push('kisbetű');
      }
      if (this.password.hasError('missingUppercase')) {
        missingRequirements.push('nagybetű');
      }
      if (this.password.hasError('missingNumber')) {
        missingRequirements.push('szám');
      }
      if (this.password.hasError('missingSpecialChar')) {
        missingRequirements.push('speciális karakter');
      }
      
      if (missingRequirements.length > 0) {
        return `A jelszó nem megfelelő`;
      }
    }
    
    // Ha a password OK, akkor confirmPassword hibáit ellenőrizzük
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