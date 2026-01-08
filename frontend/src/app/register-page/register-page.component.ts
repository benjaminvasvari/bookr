import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { 
  passwordValidator, 
  passwordMatchValidator,
  getPasswordErrorMessages,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor
} from '../core/utils/password.validator';
import { CustomValidators, getValidationErrorMessages } from '../core/utils/custom.validator';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.css'],
})

export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Password visibility toggles
  showPassword = false;
  showConfirmPassword = false;
  
  // Password strength
  passwordStrength = 0;
  passwordStrengthLabel = '';
  passwordStrengthColor = '';

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Form inicializálás
    this.registerForm = this.fb.group(
      {
        lastName: ['', [Validators.required, CustomValidators.name()]],
        firstName: ['', [Validators.required, CustomValidators.name()]],
        email: ['', [Validators.required, CustomValidators.email()]],
        phone: ['', [Validators.required, CustomValidators.phone()]],
        password: ['', [Validators.required, passwordValidator()]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator() }
    );
    
    // Password strength tracking
    this.registerForm.get('password')?.valueChanges.subscribe(value => {
      this.passwordStrength = calculatePasswordStrength(value);
      this.passwordStrengthLabel = getPasswordStrengthLabel(this.passwordStrength);
      this.passwordStrengthColor = getPasswordStrengthColor(this.passwordStrength);
    });
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordErrors(): string[] {
    const passwordControl = this.registerForm.get('password');
    if (passwordControl?.errors && passwordControl.touched) {
      return getPasswordErrorMessages(passwordControl.errors);
    }
    return [];
  }

  getConfirmPasswordErrors(): string[] {
    const confirmControl = this.registerForm.get('confirmPassword');
    if (confirmControl?.errors && confirmControl.touched) {
      return getPasswordErrorMessages(confirmControl.errors);
    }
    return [];
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.errorMessage = 'Kérjük, javítsd ki a hibákat a folytatáshoz.';
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Loading state bekapcsolása
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Backend adatok előkészítése
    const { confirmPassword, ...registrationData } = this.registerForm.value;

    // Backend hívás
    this.authService.register(registrationData).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.status === 'success') {
          // Sikeres regisztráció
          this.successMessage =
            'Sikeres regisztráció! Ellenőrizd az email fiókodat a megerősítéshez.';

          // 3 másodperc után navigálás a login oldalra
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        } else {
          this.errorMessage = 'Sikertelen regisztráció. Kérlek próbáld újra.';
        }
      },
      error: (error) => {
        this.isLoading = false;

        // Hibaüzenet beállítása
        if (error.message && error.message.includes('email')) {
          this.errorMessage = 'Ez az email cím már regisztrálva van.';
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Sikertelen regisztráció. Kérlek próbáld újra későb';
        }

        console.error('Registration error:', error);
      },
    });
  }
}