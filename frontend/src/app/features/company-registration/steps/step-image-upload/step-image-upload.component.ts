import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ImageUploadService } from '../../../../core/services/image-upload.service';
import { ImageCropModalComponent } from '../../../../shared/components/image-crop-modal/image-crop-modal.component';

@Component({
  selector: 'app-step-image-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageCropModalComponent],
  templateUrl: './step-image-upload.component.html',
  styleUrls: ['./step-image-upload.component.css']
})
export class StepImageUploadComponent implements OnInit {
  @Output() formValid = new EventEmitter<boolean>();
  @Output() formData = new EventEmitter<any>();
  @Input() initialData: any;

  mainImagePreview: string | null = null;
  mainImageFile: File | null = null;
  cropSourceFile: File | null = null;
  showCropModal = false;

  constructor(private imageUploadService: ImageUploadService) {}

  ngOnInit() {
    // Ha van initial data (visszatérés az előző oldalról vagy cookie-ból)
    if (this.initialData) {
      if (typeof this.initialData.mainImagePreview === 'string') {
        this.mainImagePreview = this.initialData.mainImagePreview;
      } else if (
        Array.isArray(this.initialData.images) &&
        this.initialData.images[0] &&
        typeof this.initialData.images[0].preview === 'string'
      ) {
        this.mainImagePreview = this.initialData.images[0].preview;
      }
    }

    // Kezdeti validitás kibocsátása (mindig valid, mert opcionális)
    this.emitFormStatus();
  }

  emitFormStatus() {
    // Az image upload opcionális, így mindig valid
    this.formValid.emit(true);

    // Kibocsátja az adatokat
    this.formData.emit({
      mainImageFile: this.mainImageFile,
      mainImagePreview: this.mainImagePreview
    });
  }

  // ============================================
  // KÉPFELTÖLTÉS KEZELÉS
  // ============================================

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      this.imageUploadService.validateImageType(file);
      this.cropSourceFile = file;
      this.showCropModal = true;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'A kep feldolgozasa sikertelen.');
    } finally {
      input.value = '';
    }
  }

  closeCropModal(): void {
    this.cropSourceFile = null;
    this.showCropModal = false;
  }

  async applyCrop(file: File): Promise<void> {
    try {
      const processedImage = await this.imageUploadService.prepareImage(file);
      this.mainImagePreview = processedImage.previewUrl;
      this.mainImageFile = processedImage.file;
      this.emitFormStatus();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'A kep feldolgozasa sikertelen.');
    } finally {
      this.closeCropModal();
    }
  }

  triggerFileInput() {
    const inputId = 'file-input-main';
    const input = document.getElementById(inputId) as HTMLInputElement;
    input?.click();
  }

  deleteImage() {
    this.mainImagePreview = null;
    this.mainImageFile = null;
    this.emitFormStatus();
  }

  getFormData() {
    return {
      mainImageFile: this.mainImageFile,
      mainImagePreview: this.mainImagePreview
    };
  }

  isFormValid(): boolean {
    // Az image upload opcionális
    return true;
  }
}
