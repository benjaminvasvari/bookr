import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Password Strength Validator
 * Követelmények:
 * - Minimum 8 karakter
 * - Legalább 1 kisbetű
 * - Legalább 1 nagybetű
 * - Legalább 1 szám
 * - Legalább 1 speciális karakter
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Ha üres, a required validator kezeli
    }

    const errors: ValidationErrors = {};

    // Kisbetű ellenőrzés
    if (!/[a-z]/.test(value)) {
      errors['missingLowercase'] = true;
    }

    // Nagybetű ellenőrzés
    if (!/[A-Z]/.test(value)) {
      errors['missingUppercase'] = true;
    }

    // Szám ellenőrzés
    if (!/[0-9]/.test(value)) {
      errors['missingNumber'] = true;
    }

    // Speciális karakter ellenőrzés
    if (!/[@#$%^&*!?_\-]/.test(value)) {
      errors['missingSpecialChar'] = true;
    }

    // Ha van bármelyik hiba, visszaadjuk az összes hibát
    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Name Pattern Validator
 * Csak betűk (magyar ékezetekkel), szóköz és kötőjel engedélyezett
 */
export function namePatternValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Ha üres, a required validator kezeli
    }

    // Magyar ékezetes betűk, szóköz, kötőjel
    const namePattern = /^[a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\-]+$/;

    if (!namePattern.test(value)) {
      return { invalidNamePattern: true };
    }

    return null;
  };
}

/**
 * Hungarian Phone Number Validator
 * Elfogadott formátumok:
 * - +36 20 123 4567
 * - 06 20 123 4567
 * - +36201234567
 * - 06201234567
 * - 20 123 4567 (lokális)
 * 
 * Elfogadott előhívók: 20, 30, 70 (mobil), 1 (Budapest vezetékes)
 */
export function hungarianPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Ha üres, a required validator kezeli
    }

    // Eltávolítjuk a szóközöket és kötőjeleket a validáláshoz
    const cleanedValue = value.replace(/[\s\-]/g, '');

    // Magyar telefonszám pattern-ek
    const patterns = [
      /^\+36(20|30|70|1)\d{7}$/,     // +36201234567
      /^06(20|30|70|1)\d{7}$/,        // 06201234567
      /^(20|30|70|1)\d{7}$/           // 201234567 (lokális)
    ];

    const isValid = patterns.some(pattern => pattern.test(cleanedValue));

    if (!isValid) {
      return { invalidHungarianPhone: true };
    }

    return null;
  };
}

/**
 * Password Match Validator (form group validator)
 * Ellenőrzi hogy a password és confirmPassword mezők egyeznek-e
 */
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