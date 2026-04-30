import { Injectable } from '@angular/core';

export interface ProcessedImageUpload {
  file: File;
  previewUrl: string;
  wasResized: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ImageUploadService {
  readonly maxUploadSizeBytes = 5 * 1024 * 1024;
  readonly maxUploadSizeMb = 5;
  readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  async prepareImage(file: File): Promise<ProcessedImageUpload> {
    this.validateImageType(file);

    if (file.size <= this.maxUploadSizeBytes) {
      return {
        file,
        previewUrl: await this.readFileAsDataUrl(file),
        wasResized: false,
      };
    }

    const resizedFile = await this.resizeToMaxSize(file);

    if (resizedFile.size > this.maxUploadSizeBytes) {
      throw new Error(`A kep merete a kicsinyites utan is legfeljebb ${this.maxUploadSizeMb}MB lehet.`);
    }

    return {
      file: resizedFile,
      previewUrl: await this.readFileAsDataUrl(resizedFile),
      wasResized: true,
    };
  }

  validateImageType(file: File): void {
    if (!this.allowedMimeTypes.includes(file.type)) {
      throw new Error('Csak JPG, PNG vagy WEBP formatum engedelyezett.');
    }
  }

  private async resizeToMaxSize(file: File): Promise<File> {
    const image = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('A bongeszo nem tamogatja a kepatmeretezest.');
    }

    const outputType = file.type === 'image/png' ? 'image/webp' : file.type;
    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;
    let quality = outputType === 'image/png' ? undefined : 0.9;
    let bestBlob: Blob | null = null;

    for (let attempt = 0; attempt < 10; attempt++) {
      canvas.width = Math.max(1, Math.round(width));
      canvas.height = Math.max(1, Math.round(height));

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const blob = await this.canvasToBlob(canvas, outputType, quality);
      bestBlob = blob;

      if (blob.size <= this.maxUploadSizeBytes) {
        return this.createFileFromBlob(file.name, blob, outputType);
      }

      if (quality && quality > 0.55) {
        quality = Math.max(0.55, quality - 0.1);
      } else {
        width *= 0.85;
        height *= 0.85;
      }
    }

    if (!bestBlob) {
      throw new Error('Nem sikerult a kep feldolgozasa.');
    }

    return this.createFileFromBlob(file.name, bestBlob, outputType);
  }

  private createFileFromBlob(originalName: string, blob: Blob, mimeType: string): File {
    const fileName = this.buildOutputFileName(originalName, mimeType);
    return new File([blob], fileName, { type: mimeType, lastModified: Date.now() });
  }

  private buildOutputFileName(originalName: string, mimeType: string): string {
    const baseName = originalName.replace(/\.[^.]+$/, '');
    const extension = mimeType === 'image/png'
      ? 'png'
      : mimeType === 'image/webp'
        ? 'webp'
        : 'jpg';

    return `${baseName}.${extension}`;
  }

  private canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Nem sikerult a kep mentese.'));
            return;
          }

          resolve(blob);
        },
        mimeType,
        quality
      );
    });
  }

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('A kep nem toltheto be.'));
      };

      image.src = objectUrl;
    });
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(new Error('Nem sikerult az elonezet letrehozasa.'));
      reader.readAsDataURL(file);
    });
  }
}