import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'app-image-crop-modal',
  standalone: true,
  imports: [CommonModule, ImageCropperComponent],
  templateUrl: './image-crop-modal.component.html',
  styleUrl: './image-crop-modal.component.css',
})
export class ImageCropModalComponent {
  @Input() visible = false;
  @Input() imageFile: File | null = null;
  @Input() title = 'Kép kivágása';
  @Input() aspectRatio = 1;
  @Input() maintainAspectRatio = false;
  @Input() roundCropper = false;

  @Output() cancel = new EventEmitter<void>();
  @Output() apply = new EventEmitter<File>();

  private croppedBlob: Blob | null = null;

  onImageCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob ?? null;
  }

  onCancel(): void {
    this.croppedBlob = null;
    this.cancel.emit();
  }

  onApply(): void {
    if (!this.imageFile || !this.croppedBlob) {
      return;
    }

    const extension = this.imageFile.type === 'image/png'
      ? 'png'
      : this.imageFile.type === 'image/webp'
        ? 'webp'
        : 'jpg';
    const baseName = this.imageFile.name.replace(/\.[^.]+$/, '');
    const croppedFile = new File(
      [this.croppedBlob],
      `${baseName}-cropped.${extension}`,
      { type: this.imageFile.type || this.croppedBlob.type, lastModified: Date.now() }
    );

    this.croppedBlob = null;
    this.apply.emit(croppedFile);
  }
}