import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Password Validation Requirements:
 * - Minimum 8 karakter
 * - Legalább 1 nagybetű
 * - Legalább 1 kisbetű
 * - Legalább 1 szám
 * - Legalább 1 speciális karakter
 */

/**
 * Univerzális jelszó validator
 * 
 * Használat formokban:
 * this.form = this.fb.group({
 *   password: ['', [Validators.required, passwordValidator()]],
 *   confirmPassword: ['']
 * }, { validators: passwordMatchValidator() });
 */
export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      // Ha üres, akkor a Validators.required fogja kezelni
      return null;
    }

    const errors: ValidationErrors = {};

    // 1. Min 8 karakter
    if (value.length < 8) {
      errors['minLength'] = { requiredLength: 8, actualLength: value.length };
    }

    // 2. Legalább 1 nagybetű
    if (!/[A-Z]/.test(value)) {
      errors['uppercase'] = true;
    }

    // 3. Legalább 1 kisbetű
    if (!/[a-z]/.test(value)) {
      errors['lowercase'] = true;
    }

    // 4. Legalább 1 szám
    if (!/[0-9]/.test(value)) {
      errors['number'] = true;
    }

    // 5. Legalább 1 speciális karakter
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(value)) {
      errors['specialChar'] = true;
    }

    // Ha van bármilyen hiba, akkor visszaadjuk az errors objektumot
    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Password match validator (form group szinten)
 * 
 * Ellenőrzi hogy a 'password' és 'confirmPassword' mezők egyeznek-e
 * 
 * Használat:
 * this.form = this.fb.group({
 *   password: ['', [Validators.required, passwordValidator()]],
 *   confirmPassword: ['', Validators.required]
 * }, { validators: passwordMatchValidator() });
 */
export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    // Ha még nem érintették a confirmPassword mezőt, ne validáljunk
    if (!confirmPassword.value) {
      return null;
    }

    // Ha nem egyeznek
    if (password.value !== confirmPassword.value) {
      // Az errort a confirmPassword control-ra rakjuk
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Ha egyeznek, töröljük a passwordMismatch errort
      // DE megtartjuk az esetleges más errorokat
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
      return null;
    }
  };
}

/**
 * Password validator alternatív használat (custom form controlhoz)
 * 
 * Használat:
 * this.form = this.fb.group({
 *   password: ['', [Validators.required, passwordValidator()]],
 *   confirmPassword: ['', [Validators.required, matchPasswordValidator('password')]]
 * });
 */
export function matchPasswordValidator(passwordControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) {
      return null;
    }

    const password = control.parent.get(passwordControlName);
    const confirmPassword = control;

    if (!password || !confirmPassword) {
      return null;
    }

    if (confirmPassword.value === '') {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  };
}

/**
 * Helper: Password strength calculator
 * 
 * Visszaad egy 0-4 közötti számot (weak, fair, good, strong, very strong)
 */
export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;

  let strength = 0;

  // 1 pont: minimum hossz
  if (password.length >= 8) strength++;

  // 1 pont: van nagybetű ÉS kisbetű
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;

  // 1 pont: van szám
  if (/[0-9]/.test(password)) strength++;

  // 1 pont: van speciális karakter
  if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(password)) strength++;

  // Bónusz pont: 12+ karakter
  if (password.length >= 12) strength++;

  return Math.min(strength, 4); // Max 4
}

/**
 * Helper: Password strength label
 */
export function getPasswordStrengthLabel(strength: number): string {
  const labels = ['Nagyon gyenge', 'Gyenge', 'Közepes', 'Erős', 'Nagyon erős'];
  return labels[strength] || labels[0];
}

/**
 * Helper: Password strength color
 */
export function getPasswordStrengthColor(strength: number): string {
  const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997'];
  return colors[strength] || colors[0];
}

/**
 * Helper: Get readable error messages
 */
export function getPasswordErrorMessages(errors: ValidationErrors | null): string[] {
  if (!errors) return [];

  const messages: string[] = [];

  if (errors['minLength']) {
    messages.push('Minimum 8 karakter szükséges');
  }
  if (errors['uppercase']) {
    messages.push('Legalább 1 nagybetű szükséges');
  }
  if (errors['lowercase']) {
    messages.push('Legalább 1 kisbetű szükséges');
  }
  if (errors['number']) {
    messages.push('Legalább 1 szám szükséges');
  }
  if (errors['specialChar']) {
    messages.push('Legalább 1 speciális karakter szükséges (!@#$%^&*...)');
  }
  if (errors['passwordMismatch']) {
    messages.push('A két jelszó nem egyezik');
  }

  return messages;
}