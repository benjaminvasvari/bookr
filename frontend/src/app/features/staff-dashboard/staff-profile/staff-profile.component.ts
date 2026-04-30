import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-staff-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-profile.component.html',
  styleUrl: './staff-profile.component.css',
})
export class StaffProfileComponent implements OnInit {
  currentUser: User | null = null;
  displayName = 'Staff Profil';
  isEditing = false;
  emailTouched = false;
  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.(com|hu)$/i;

  profileDraft = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.resetDraftFromCurrentUser();

    if (this.currentUser?.firstName || this.currentUser?.lastName) {
      const firstName = this.currentUser.firstName || '';
      const lastName = this.currentUser.lastName || '';
      this.displayName = `${lastName} ${firstName}`.trim();
    }
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    this.emailTouched = false;

    if (this.isEditing) {
      this.resetDraftFromCurrentUser();
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.emailTouched = false;
    this.resetDraftFromCurrentUser();
  }

  saveProfile(): void {
    this.emailTouched = true;

    if (!this.isValidEmailFormat) {
      return;
    }

    if (this.currentUser) {
      this.currentUser = {
        ...this.currentUser,
        firstName: this.profileDraft.firstName,
        lastName: this.profileDraft.lastName,
        email: this.profileDraft.email,
        phone: this.profileDraft.phone,
      };
      this.displayName = `${this.profileDraft.lastName} ${this.profileDraft.firstName}`.trim();
    }

    this.isEditing = false;
    this.emailTouched = false;
  }

  onEmailBlur(): void {
    this.emailTouched = true;
  }

  get isValidEmailFormat(): boolean {
    return this.emailPattern.test((this.profileDraft.email || '').trim());
  }

  private resetDraftFromCurrentUser(): void {
    this.profileDraft = {
      firstName: this.currentUser?.firstName || '',
      lastName: this.currentUser?.lastName || '',
      email: this.currentUser?.email || '',
      phone: this.currentUser?.phone || '',
    };
  }
}
