import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ImageCropperComponent, ImageCroppedEvent, ImageTransform, LoadedImage } from 'ngx-image-cropper';

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
  @Input() containWithinAspectRatio = false;
  @Input() cropperMaxWidth?: number;
  @Input() cropperMaxHeight?: number;
  @Input() autoFitCropper = false;

  @Output() cancel = new EventEmitter<void>();
  @Output() apply = new EventEmitter<File>();

  private croppedBlob: Blob | null = null;
  computedCropperStaticWidth?: number;
  computedCropperStaticHeight?: number;
  cropperPosition?: { x1: number; y1: number; x2: number; y2: number };
  imageTransform: ImageTransform = { scale: 1, translateH: 0, translateV: 0, translateUnit: 'px' };

  readonly minZoom = 0.5;
  readonly maxZoom = 3;
  readonly zoomStep = 0.1;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageFile'] || changes['visible']) {
      this.resetEditorState();
    }
  }

  onImageCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob ?? null;
  }

  onCancel(): void {
    this.croppedBlob = null;
    this.resetEditorState();
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
    this.resetEditorState();
    this.apply.emit(croppedFile);
  }

  onTransformChange(transform: ImageTransform): void {
    this.imageTransform = {
      ...this.imageTransform,
      ...transform,
      translateUnit: 'px',
      scale: this.clampZoom(transform.scale ?? this.imageTransform.scale ?? 1),
    };
  }

  get zoomPercent(): number {
    return Math.round((this.imageTransform.scale ?? 1) * 100);
  }

  onWheelZoom(event: WheelEvent): void {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    this.applyScale((this.imageTransform.scale ?? 1) + direction * this.zoomStep);
  }

  onZoomSliderInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (!target) {
      return;
    }
    this.applyScale(Number(target.value));
  }

  zoomIn(): void {
    this.applyScale((this.imageTransform.scale ?? 1) + this.zoomStep);
  }

  zoomOut(): void {
    this.applyScale((this.imageTransform.scale ?? 1) - this.zoomStep);
  }

  resetZoom(): void {
    this.imageTransform = {
      ...this.imageTransform,
      scale: 1,
      translateH: 0,
      translateV: 0,
      translateUnit: 'px',
    };
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
    const viewportLimit = Math.min(window.innerWidth * 0.48, window.innerHeight * 0.48);
    const preferred = minImageSide * 0.52;
    const clamped = Math.max(140, Math.min(preferred, viewportLimit, 360));
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

  private applyScale(nextScale: number): void {
    this.imageTransform = {
      ...this.imageTransform,
      scale: this.clampZoom(nextScale),
      translateUnit: 'px',
    };
  }

  private clampZoom(scale: number): number {
    return Math.max(this.minZoom, Math.min(this.maxZoom, Number.isFinite(scale) ? scale : 1));
  }

  private resetEditorState(): void {
    this.computedCropperStaticWidth = undefined;
    this.computedCropperStaticHeight = undefined;
    this.cropperPosition = undefined;
    this.imageTransform = { scale: 1, translateH: 0, translateV: 0, translateUnit: 'px' };
  }
}