import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
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
  isMobileWizard = false;
  currentStep = 0;
  readonly totalSteps = 4;

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

    this.updateMobileWizardMode();
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateMobileWizardMode();
  }

  get stepProgress(): number {
    if (this.totalSteps <= 1) {
      return 0;
    }

    return (this.currentStep / (this.totalSteps - 1)) * 100;
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  nextStep(): void {
    if (!this.canProceedStep()) {
      this.markCurrentStepTouched();
      return;
    }

    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      return;
    }

    this.onSubmit();
  }

  canProceedStep(): boolean {
    const stepControlMap = [
      ['lastName', 'firstName'],
      ['email'],
      ['phone'],
    ] as const;

    if (this.currentStep < stepControlMap.length) {
      const controls = stepControlMap[this.currentStep];
      return controls.every((controlName) => {
        const control = this.registerForm.get(controlName);
        return !!control && control.valid;
      });
    }

    const passwordControl = this.registerForm.get('password');
    const confirmControl = this.registerForm.get('confirmPassword');
    return !!passwordControl && !!confirmControl && passwordControl.valid && confirmControl.valid && !this.registerForm.hasError('passwordMismatch');
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

  private markCurrentStepTouched(): void {
    const stepControlMap = [
      ['lastName', 'firstName'],
      ['email'],
      ['phone'],
    ] as const;

    if (this.currentStep < stepControlMap.length) {
      stepControlMap[this.currentStep].forEach((controlName) => {
        this.registerForm.get(controlName)?.markAsTouched();
      });
      return;
    }

    this.registerForm.get('password')?.markAsTouched();
    this.registerForm.get('confirmPassword')?.markAsTouched();
  }

  private updateMobileWizardMode(): void {
    if (typeof window === 'undefined') {
      this.isMobileWizard = false;
      return;
    }

    this.isMobileWizard = window.innerWidth <= 768;
  }
}