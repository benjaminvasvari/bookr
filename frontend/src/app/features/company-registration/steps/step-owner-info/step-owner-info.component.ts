import { Component, EventEmitter, Output, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-step-owner-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-owner-info.component.html',
  styleUrls: ['./step-owner-info.component.css']
})
export class StepOwnerInfoComponent implements OnInit, OnChanges {
  @Output() formValid = new EventEmitter<boolean>();
  @Output() formData = new EventEmitter<any>();
  @Input() initialData: any;
  @Input() isUserLoggedIn = false;  // ✅ ADD

  ownerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;

  constructor(private fb: FormBuilder) {
    this.ownerForm = this.createForm();
  }

  ngOnInit() {
    this.updateFormBasedOnLoginStatus();
    
    if (this.initialData) {
      this.ownerForm.patchValue(this.initialData);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isUserLoggedIn']) {
      this.updateFormBasedOnLoginStatus();
    }
    
    if (changes['initialData'] && this.initialData) {
      this.ownerForm.patchValue(this.initialData);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+36[0-9]{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private updateFormBasedOnLoginStatus(): void {
    if (this.isUserLoggedIn) {
      // ✅ Ha be van jelentkezve, jelszó mezők nem kellenek
      this.ownerForm.get('password')?.clearValidators();
      this.ownerForm.get('password')?.updateValueAndValidity();
      this.ownerForm.get('confirmPassword')?.clearValidators();
      this.ownerForm.get('confirmPassword')?.updateValueAndValidity();

      // ✅ Mezők readonly-vá tétele
      this.ownerForm.get('firstName')?.disable();
      this.ownerForm.get('lastName')?.disable();
      this.ownerForm.get('email')?.disable();
      this.ownerForm.get('phone')?.disable();

      // ✅ Emit validity
      this.formValid.emit(true);
      this.formData.emit(this.ownerForm.getRawValue());
    } else {
      // ✅ Ha nincs bejelentkezve, jelszó kötelező
      this.ownerForm.get('password')?.setValidators([Validators.required, Validators.minLength(8), this.passwordStrengthValidator]);
      this.ownerForm.get('password')?.updateValueAndValidity();
      this.ownerForm.get('confirmPassword')?.setValidators([Validators.required]);
      this.ownerForm.get('confirmPassword')?.updateValueAndValidity();

      // ✅ Mezők engedélyezése
      this.ownerForm.get('firstName')?.enable();
      this.ownerForm.get('lastName')?.enable();
      this.ownerForm.get('email')?.enable();
      this.ownerForm.get('phone')?.enable();
    }

    // ✅ Re-subscribe to changes
    this.ownerForm.valueChanges.subscribe(() => {
      this.formValid.emit(this.ownerForm.valid);
      if (this.ownerForm.valid) {
        this.formData.emit(this.ownerForm.getRawValue());
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.ownerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;

    return !passwordValid ? { passwordStrength: true } : null;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) return null;

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  getPasswordStrengthClass(): string {
    const password = this.ownerForm.get('password')?.value || '';
    const strength = this.calculatePasswordStrength(password);

    if (strength < 3) return 'weak';
    if (strength < 5) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const password = this.ownerForm.get('password')?.value || '';
    const strength = this.calculatePasswordStrength(password);

    if (strength < 3) return 'Gyenge jelszó';
    if (strength < 5) return 'Közepes jelszó';
    return 'Erős jelszó';
  }

  private calculatePasswordStrength(password: string): number {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  }

  getFormData() {
    return this.ownerForm.getRawValue();  // ✅ getRawValue() gets disabled fields too
  }

  isFormValid(): boolean {
    return this.ownerForm.valid;
  }
}