import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { 
  passwordValidator, 
  passwordMatchValidator,
  getPasswordErrorMessages,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor
} from '../core/utils/password.validator';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetForm!: FormGroup;
  
  resetToken: string | null = null;
  
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  
  // Password visibility toggles
  showPassword = false;
  showConfirmPassword = false;
  
  // Password strength
  passwordStrength = 0;
  passwordStrengthLabel = '';
  passwordStrengthColor = '';
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Token lekérése URL-ből
    this.route.queryParams.subscribe(params => {
      this.resetToken = params['token'];
      
      if (!this.resetToken) {
        this.errorMessage = 'Érvénytelen link. Kérj új jelszó változtatási emailt.';
      }
    });
    
    // Form inicializálás
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, passwordValidator()]],
      confirmPassword: ['', Validators.required]
    }, { 
      validators: passwordMatchValidator() 
    });
    
    // Password strength tracking
    this.resetForm.get('password')?.valueChanges.subscribe(value => {
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
    const passwordControl = this.resetForm.get('password');
    if (passwordControl?.errors && passwordControl.touched) {
      return getPasswordErrorMessages(passwordControl.errors);
    }
    return [];
  }

  getConfirmPasswordErrors(): string[] {
    const confirmControl = this.resetForm.get('confirmPassword');
    if (confirmControl?.errors && confirmControl.touched) {
      return getPasswordErrorMessages(confirmControl.errors);
    }
    return [];
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.resetToken) {
      this.errorMessage = 'Kérjük, javítsd ki a hibákat a folytatáshoz.';
      Object.keys(this.resetForm.controls).forEach(key => {
        this.resetForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const newPassword = this.resetForm.get('password')?.value;

    // API hívás
    this.authService.resetPassword(this.resetToken, newPassword).subscribe({
      next: () => {
        this.successMessage = 'Jelszó sikeresen megváltoztatva!';
        this.isSubmitting = false;
        
        // 2 másodperc múlva redirect profile-ra
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 2000);
      },
      error: (error) => {
        console.error('Password reset error:', error);
        this.isSubmitting = false;
        
        // Error message backend-től
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 400) {
          this.errorMessage = 'A link lejárt vagy érvénytelen. Kérj új jelszó változtatási emailt.';
        } else {
          this.errorMessage = 'Hiba történt a jelszó változtatása során. Próbáld újra később.';
        }
      }
    });
  }
}