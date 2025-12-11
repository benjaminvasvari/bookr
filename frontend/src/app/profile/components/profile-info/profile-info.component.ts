import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { User } from '../../../core/models';

@Component({
  selector: 'app-profile-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.css']
})
export class ProfileInfoComponent implements OnInit {
  @Input() currentUser: User | null = null;

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  isEditingProfile: boolean = false;
  isChangingPassword: boolean = false;
  
  profileSaveSuccess: boolean = false;
  profileSaveError: string = '';
  
  passwordSaveSuccess: boolean = false;
  passwordSaveError: string = '';

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForms();
  }

  initForms(): void {
    // Profile Form
    this.profileForm = this.fb.group({
      firstName: [this.currentUser?.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [this.currentUser?.lastName || '', [Validators.required, Validators.minLength(2)]],
      email: [this.currentUser?.email || '', [Validators.required, Validators.email]],
      phone: [this.currentUser?.phone || '', [Validators.required, Validators.pattern(/^\+36[0-9]{9}$/)]]
    });

    // Password Form
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  enableProfileEdit(): void {
    this.isEditingProfile = true;
    this.profileSaveSuccess = false;
    this.profileSaveError = '';
  }

  cancelProfileEdit(): void {
    this.isEditingProfile = false;
    this.profileForm.reset({
      firstName: this.currentUser?.firstName,
      lastName: this.currentUser?.lastName,
      email: this.currentUser?.email,
      phone: this.currentUser?.phone
    });
    this.profileSaveSuccess = false;
    this.profileSaveError = '';
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      // TODO: API call to update profile
      console.log('Saving profile:', this.profileForm.value);
      
      // Mock success
      setTimeout(() => {
        this.profileSaveSuccess = true;
        this.isEditingProfile = false;
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          this.profileSaveSuccess = false;
        }, 3000);
      }, 500);
    } else {
      this.profileSaveError = 'Kérjük, töltsd ki helyesen az összes mezőt.';
    }
  }

  togglePasswordChange(): void {
    this.isChangingPassword = !this.isChangingPassword;
    if (!this.isChangingPassword) {
      this.passwordForm.reset();
      this.passwordSaveSuccess = false;
      this.passwordSaveError = '';
    }
  }

  savePassword(): void {
    if (this.passwordForm.valid) {
      // TODO: API call to change password
      console.log('Changing password');
      
      // Mock success
      setTimeout(() => {
        this.passwordSaveSuccess = true;
        this.passwordForm.reset();
        this.isChangingPassword = false;
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          this.passwordSaveSuccess = false;
        }, 3000);
      }, 500);
    } else {
      if (this.passwordForm.hasError('passwordMismatch')) {
        this.passwordSaveError = 'A jelszavak nem egyeznek.';
      } else {
        this.passwordSaveError = 'Kérjük, töltsd ki helyesen az összes mezőt.';
      }
    }
  }
}