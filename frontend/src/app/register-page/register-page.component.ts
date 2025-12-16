import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

// Custom validator for password matching
export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.css'],
})

export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  errorMessage = '';
  successMessage = '';

  // Snapshot a form hibáiról submit pillanatában
  public submittedFormSnapshot: any = null;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.registerForm = this.fb.group(
      {
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^[\d\s\+\-\(\)]+$/)]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator() }
    );
  }

  onSubmit(): void {
    // Snapshot készítése a jelenlegi form hibáiról
    this.submittedFormSnapshot = {
      lastName: this.lastName.errors,
      firstName: this.firstName.errors,
      email: this.email.errors,
      phone: this.phone.errors,
      password: this.password.errors,
      confirmPassword: this.confirmPassword.errors,
      passwordMismatch: this.registerForm.hasError('passwordMismatch'),
    };

    // Ha invalid form, return (NEM küldi el)
    if (this.registerForm.invalid) {
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

  // EGYETLEN validációs hibaüzenet getter - a SNAPSHOT alapján
  get validationErrorMessage(): string {
    if (!this.submittedFormSnapshot) return '';

    const snap = this.submittedFormSnapshot;
    let errorCount = 0;

    // Számoljuk meg hány hiba van
    if (snap.lastName) errorCount++;
    if (snap.firstName) errorCount++;
    if (snap.email) errorCount++;
    if (snap.phone) errorCount++;
    if (snap.password) errorCount++;
    if (snap.confirmPassword) errorCount++;
    if (snap.passwordMismatch) errorCount++;

    // Ha több mint 1 hiba → általános üzenet
    if (errorCount > 1) {
      return 'Kérlek töltsd ki az összes kötelező mezőt';
    }

    // Ha csak 1 hiba → specifikus üzenet
    if (snap.lastName?.required) {
      return 'Kérlek add meg a vezetékneved';
    }
    if (snap.lastName?.minlength) {
      return 'A vezetéknév legalább 2 karakter hosszú legyen';
    }
    if (snap.firstName?.required) {
      return 'Kérlek add meg a keresztneved';
    }
    if (snap.firstName?.minlength) {
      return 'A keresztnév legalább 2 karakter hosszú legyen';
    }
    if (snap.email?.required) {
      return 'Kérlek add meg az email címed';
    }
    if (snap.email?.email) {
      return 'Érvénytelen email formátum';
    }
    if (snap.phone?.required) {
      return 'Kérlek add meg a telefonszámod';
    }
    if (snap.phone?.pattern) {
      return 'Érvénytelen telefonszám formátum';
    }
    if (snap.password?.required) {
      return 'Kérlek add meg a jelszavad';
    }
    if (snap.password?.minlength) {
      return 'A jelszó legalább 8 karakter hosszú legyen';
    }
    if (snap.confirmPassword?.required) {
      return 'Kérlek erősítsd meg a jelszavad';
    }
    if (snap.passwordMismatch) {
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
