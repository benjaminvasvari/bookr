import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { User, UpdateProfileRequest } from '../../../core/models';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ImageUploadService } from '../../../core/services/image-upload.service';
import { ImageCropModalComponent } from '../../../shared/components/image-crop-modal/image-crop-modal.component';

@Component({
  selector: 'app-profile-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageCropModalComponent],
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.css'],
})
export class ProfileInfoComponent implements OnInit, OnDestroy {
  @Input() currentUser: User | null = null;
  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.(com|hu)$/i;

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  // Edit states
  isEditingProfile = false;

  // Avatar states
  selectedFile: File | null = null;
  avatarCropFile: File | null = null;
  avatarPreview: string | null = null;
  showAvatarPreview = false;
  showAvatarCropper = false;
  isUploadingAvatar = false;
  isDeletingAvatar = false;
  showDeleteConfirm = false;

  // Password modal states
  showPasswordModal = false;
  isRequestingReset = false;

  // Success/Error messages
  profileSaveSuccess = false;
  profileSaveError = '';

  avatarUploadSuccess = false;
  avatarUploadError = '';

  avatarDeleteSuccess = false;
  avatarDeleteError = '';

  passwordResetSuccess = false;
  passwordResetError = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private imageUploadService: ImageUploadService
  ) {}

  ngOnInit(): void {
    this.initForms();
  }

  ngOnDestroy(): void {
    // Restore body scroll when component is destroyed
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  initForms(): void {
    // Profile Form
    this.profileForm = this.fb.group({
      id: [this.currentUser?.id],
      firstName: [
        this.currentUser?.firstName || '',
        [Validators.required, Validators.minLength(2)],
      ],
      lastName: [this.currentUser?.lastName || '', [Validators.required, Validators.minLength(2)]],
      email: [
        this.currentUser?.email || '',
        [Validators.required, Validators.email, Validators.pattern(this.emailPattern)],
      ],
      phone: [
        this.currentUser?.phone || '',
        [Validators.required, Validators.pattern(/^\+36[0-9]{9}$/)],
      ],
    });

    // Password Form (csak jelenlegi jelszó)
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.setProfileEditState(false);
  }

  // ==================== PROFILE EDIT ====================

  enableProfileEdit(): void {
    this.setProfileEditState(true);
    this.profileSaveSuccess = false;
    this.profileSaveError = '';
  }

  cancelProfileEdit(): void {
    this.setProfileEditState(false);
    this.profileForm.reset({
      firstName: this.currentUser?.firstName,
      lastName: this.currentUser?.lastName,
      email: this.currentUser?.email,
      phone: this.currentUser?.phone,
    });
    this.profileSaveSuccess = false;
    this.profileSaveError = '';
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      const updateData: UpdateProfileRequest = this.profileForm.value;

      this.userService.updateProfile(updateData).subscribe({
        next: (updatedUser) => {
          this.currentUser = updatedUser;
          this.profileSaveSuccess = true;
          this.setProfileEditState(false);
          this.profileSaveError = '';

          // Success message hide after 3 seconds
          setTimeout(() => {
            this.profileSaveSuccess = false;
          }, 3000);

          // Frissítjük az AuthService currentUser$-t is
          // (localStorage már frissült a userService-ben)
          this.authService.updateCurrentUser(updatedUser);
        },
        error: (error) => {
          console.error('Profile update error:', error);
          this.profileSaveError = error.error?.message || 'Hiba történt a profil mentése során.';
          this.profileSaveSuccess = false;
        },
      });
    } else {
      this.profileSaveError = 'Kérjük, töltsd ki helyesen az összes mezőt.';
    }
  }

  // ==================== AVATAR UPLOAD ====================

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      this.imageUploadService.validateImageType(file);
      this.avatarCropFile = file;
      this.showAvatarCropper = true;
      this.avatarUploadError = '';
      this.syncModalScrollLock();
    } catch (error) {
      this.avatarUploadError = error instanceof Error
        ? error.message
        : `A fajl merete maximum ${this.imageUploadService.maxUploadSizeMb}MB lehet.`;
    } finally {
      input.value = '';
    }
  }

  closeAvatarCropper(): void {
    this.avatarCropFile = null;
    this.showAvatarCropper = false;
    this.syncModalScrollLock();
  }

  async applyAvatarCrop(file: File): Promise<void> {
    try {
      const processedImage = await this.imageUploadService.prepareImage(file);
      this.selectedFile = processedImage.file;
      this.avatarPreview = processedImage.previewUrl;
      this.showAvatarPreview = true;
      this.avatarUploadError = '';
    } catch (error) {
      this.avatarUploadError = error instanceof Error
        ? error.message
        : 'Hiba tortent a kep feldolgozasa soran.';
    } finally {
      this.avatarCropFile = null;
      this.showAvatarCropper = false;
      this.syncModalScrollLock();
    }
  }

  closeAvatarPreview(): void {
    this.showAvatarPreview = false;
    this.selectedFile = null;
    this.avatarPreview = null;
    this.avatarUploadError = '';
    this.syncModalScrollLock();
  }

  uploadAvatar(): void {
    if (!this.selectedFile) {
      return;
    }

    this.isUploadingAvatar = true;
    this.avatarUploadError = '';

    this.userService
      .uploadAvatar(this.selectedFile)
      .pipe(
        switchMap(() => this.authService.refreshCurrentUser()),
        finalize(() => {
          this.isUploadingAvatar = false;
        })
      )
      .subscribe({
        next: (refreshedUser) => {
          this.currentUser = refreshedUser;
          this.avatarUploadSuccess = true;
          this.closeAvatarPreview();

          // Success message hide after 3 seconds
          setTimeout(() => {
            this.avatarUploadSuccess = false;
          }, 3000);
        },
        error: (error) => {
          console.error('Avatar upload error:', error);
          this.avatarUploadError = error.error?.message || 'Hiba történt a kép feltöltése során.';
          this.avatarUploadSuccess = false;
        },
      });
  }

  // ==================== AVATAR DELETE ====================

  showDeleteConfirmModal(): void {
    this.showDeleteConfirm = true;
    this.syncModalScrollLock();
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirm = false;
    this.syncModalScrollLock();
  }

  confirmDeleteAvatar(): void {
    this.isDeletingAvatar = true;
    this.avatarDeleteError = '';

    this.userService
      .deleteAvatar()
      .pipe(
        switchMap(() => this.authService.refreshCurrentUser()),
        finalize(() => {
          this.isDeletingAvatar = false;
        })
      )
      .subscribe({
        next: (refreshedUser) => {
          this.currentUser = refreshedUser;
          this.avatarDeleteSuccess = true;
          this.closeDeleteConfirmModal();

          setTimeout(() => {
            this.avatarDeleteSuccess = false;
          }, 3000);
        },
        error: (error) => {
          console.error('Avatar delete error:', error);
          this.avatarDeleteError = error.error?.message || 'Hiba történt a kép törlése során.';
          this.avatarDeleteSuccess = false;
          this.closeDeleteConfirmModal();
        },
      });
  }

  private syncModalScrollLock(): void {
    const shouldLock = this.showAvatarPreview || this.showAvatarCropper || this.showDeleteConfirm || this.showPasswordModal;
    document.documentElement.style.overflow = shouldLock ? 'hidden' : '';
    document.body.style.overflow = shouldLock ? 'hidden' : '';
  }

  // ==================== PASSWORD RESET ====================

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.passwordForm.reset();
    this.passwordResetSuccess = false;
    this.passwordResetError = '';
    this.syncModalScrollLock();
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordForm.reset();
    this.passwordResetSuccess = false;
    this.passwordResetError = '';
    this.syncModalScrollLock();
  }

  requestPasswordReset(): void {
    if (this.passwordForm.valid) {
      const currentPassword = this.passwordForm.get('currentPassword')?.value;

      this.isRequestingReset = true;
      this.passwordResetError = '';

      this.userService.requestPasswordReset(currentPassword).subscribe({
        next: () => {
          this.passwordResetSuccess = true;
          this.isRequestingReset = false;

          // Modal bezárása 2 másodperc után
          setTimeout(() => {
            this.closePasswordModal();
          }, 2000);
        },
        error: (error) => {
          console.error('Password reset request error:', error);
          this.passwordResetError = error.error?.message || 'Hibás jelszó vagy hiba történt.';
          this.isRequestingReset = false;
          this.passwordResetSuccess = false;
        },
      });
    } else {
      this.passwordResetError = 'Kérjük, add meg a jelenlegi jelszavadat.';
    }
  }

  // ==================== HELPER ====================

  triggerFileInput(): void {
    const fileInput = document.getElementById('avatarFileInput') as HTMLInputElement;
    fileInput?.click();
  }

  private setProfileEditState(isEditing: boolean): void {
    this.isEditingProfile = isEditing;

    if (isEditing) {
      this.profileForm.enable({ emitEvent: false });
      return;
    }

    this.profileForm.disable({ emitEvent: false });
  }
}
