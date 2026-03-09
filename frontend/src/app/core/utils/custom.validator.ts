import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  static name(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null; // Ha üres, a Validators.required kezeli
      }

      const errors: ValidationErrors = {};

      // Minimum hossz
      if (value.length < 2) {
        errors['minLength'] = { requiredLength: 2, actualLength: value.length };
      }

      // Maximum hossz
      if (value.length > 50) {
        errors['maxLength'] = { requiredLength: 50, actualLength: value.length };
      }

      // Csak betűk, szóközök, kötőjelek, ékezetes karakterek
      const namePattern = /^[a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\-]+$/;
      if (!namePattern.test(value)) {
        errors['invalidName'] = true;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  // ============================================
  // PHONE VALIDATORS
  // ============================================

  /**
   Magyar telefonszám validátor
   
   Elfogadott formátumok:
   - +36301234567
   - 06 30 123 4567
   - +36 (30) 123-4567
   - 0630-123-4567
   */
  static hungarianPhone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      // Eltávolítjuk a szóközöket, kötőjeleket, zárójeleket
      const cleanedValue = value.replace(/[\s\-\(\)]/g, '');

      const errors: ValidationErrors = {};

      // Magyar mobil formátum ellenőrzés
      // +36 vagy 06 kezdéssel
      const phonePattern = /^(\+36|06)[2-9]\d{8}$/;

      if (!phonePattern.test(cleanedValue)) {
        errors['invalidPhone'] = true;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  /**
   Általános telefonszám validátor (nemzetközi)
   
   Elfogadott karakterek: számok, +, -, (, ), szóköz
   */
  static phone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const errors: ValidationErrors = {};

      // Csak számok, +, -, (, ), szóköz
      const phonePattern = /^[\d\s\+\-\(\)]+$/;

      if (!phonePattern.test(value)) {
        errors['invalidPhone'] = true;
      }

      // Minimum 8 számjegy kell
      const digitCount = value.replace(/\D/g, '').length;
      if (digitCount < 8) {
        errors['minDigits'] = { required: 8, actual: digitCount };
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  // ============================================
  // EMAIL VALIDATORS
  // ============================================

  /**
   Email validátor
   
   Szigorúbb mint a beépített Validators.email
   */
  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const errors: ValidationErrors = {};

      // Kötelező: valami@valami.com vagy valami@valami.hu
      const emailPattern = /^[^\s@]+@[^\s@]+\.(com|hu)$/i;

      if (!emailPattern.test(value)) {
        errors['invalidEmail'] = true;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }
}

/**
 * ============================================
 * ERROR MESSAGE HELPER
 * ============================================
 *
 * Helper függvény hibaüzenetek generálásához
 *
 * Usage:
 * getErrorMessage(control.errors, 'firstName')
 */
export function getValidationErrorMessages(
  errors: ValidationErrors | null,
  fieldName: string = 'mező'
): string[] {
  if (!errors) {
    return [];
  }

  const messages: string[] = [];

  if (errors['required']) {
    messages.push(`A(z) ${fieldName} megadása kötelező`);
  }

  if (errors['minLength']) {
    messages.push(
      `A(z) ${fieldName} legalább ${errors['minLength'].requiredLength} karakter hosszú legyen`
    );
  }

  if (errors['maxLength']) {
    messages.push(
      `A(z) ${fieldName} maximum ${errors['maxLength'].requiredLength} karakter hosszú lehet`
    );
  }

  if (errors['invalidName']) {
    messages.push(`A(z) ${fieldName} csak betűket, szóközöket és kötőjeleket tartalmazhat`);
  }

  if (errors['invalidPhone']) {
    messages.push('Érvénytelen telefonszám formátum');
  }

  if (errors['minDigits']) {
    messages.push(
      `A telefonszámnak legalább ${errors['minDigits'].required} számjegyet kell tartalmaznia`
    );
  }

  if (errors['invalidEmail']) {
    messages.push('Az email formátuma: valami@valami.com vagy valami@valami.hu');
  }

  if (errors['email']) {
    messages.push('Érvénytelen email cím formátum');
  }

  return messages;
}
