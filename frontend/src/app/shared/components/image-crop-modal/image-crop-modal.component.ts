import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ImageCropperComponent, ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';

@Component({
  selector: 'app-image-crop-modal',
  standalone: true,
  imports: [CommonModule, ImageCropperComponent],
  templateUrl: './image-crop-modal.component.html',
  styleUrl: './image-crop-modal.component.css',
})
export class ImageCropModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() imageFile: File | null = null;
  @Input() title = 'Kép kivágása';
  @Input() aspectRatio = 1;
  @Input() maintainAspectRatio = false;
  @Input() roundCropper = false;
  @Input() containWithinAspectRatio = true;
  @Input() cropperMaxWidth?: number;
  @Input() cropperMaxHeight?: number;
  @Input() autoFitCropper = false;

  @Output() cancel = new EventEmitter<void>();
  @Output() apply = new EventEmitter<File>();

  private croppedBlob: Blob | null = null;
  computedCropperStaticWidth?: number;
  computedCropperStaticHeight?: number;
  cropperPosition?: { x1: number; y1: number; x2: number; y2: number };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageFile'] || changes['visible']) {
      this.computedCropperStaticWidth = undefined;
      this.computedCropperStaticHeight = undefined;
      this.cropperPosition = undefined;
    }
  }

  onImageCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob ?? null;
  }

  onCancel(): void {
    this.croppedBlob = null;
    this.computedCropperStaticWidth = undefined;
    this.computedCropperStaticHeight = undefined;
    this.cropperPosition = undefined;
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
    this.computedCropperStaticWidth = undefined;
    this.computedCropperStaticHeight = undefined;
    this.cropperPosition = undefined;
    this.apply.emit(croppedFile);
  }

  onImageLoaded(loaded: LoadedImage): void {
    if (!this.autoFitCropper) {
      return;
    }

    const imageWidth = loaded?.transformed?.size?.width ?? 0;
    const imageHeight = loaded?.transformed?.size?.height ?? 0;

    if (imageWidth <= 0 || imageHeight <= 0) {
      return;
    }

    const minImageSide = Math.min(imageWidth, imageHeight);
    const viewportLimit = Math.min(window.innerWidth * 0.55, window.innerHeight * 0.55);
    const preferred = minImageSide * 0.72;
    const clamped = Math.max(220, Math.min(preferred, viewportLimit, 420));
    const staticSize = Math.floor(clamped);
    const boundedSide = Math.max(120, Math.min(staticSize, minImageSide - 2));
    const x1 = Math.floor((imageWidth - boundedSide) / 2);
    const y1 = Math.floor((imageHeight - boundedSide) / 2);

    this.computedCropperStaticWidth = boundedSide;
    this.computedCropperStaticHeight = boundedSide;
    this.cropperPosition = {
      x1,
      y1,
      x2: x1 + boundedSide,
      y2: y1 + boundedSide,
    };
  }
}