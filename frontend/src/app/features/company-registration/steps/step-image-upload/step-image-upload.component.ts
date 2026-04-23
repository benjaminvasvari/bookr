import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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

  imageForm: FormGroup;

  imageSlots = [
    { id: 'main', preview: null as string | null, file: null as File | null, isMain: true },
    { id: 'image2', preview: null as string | null, file: null as File | null, isMain: false },
    { id: 'image3', preview: null as string | null, file: null as File | null, isMain: false },
    { id: 'image4', preview: null as string | null, file: null as File | null, isMain: false }
  ];

  draggedSlotId: string | null = null;
  cropSourceFile: File | null = null;
  cropTargetSlotId: string | null = null;
  showCropModal = false;

  constructor(private fb: FormBuilder, private imageUploadService: ImageUploadService) {
    // Az image upload opcionális - nincs kötelező validáció
    this.imageForm = this.fb.group({
      // Üres form, csak az optional képek miatt
    });
  }

  ngOnInit() {
    // Ha van initial data (visszatérés az előző oldalról vagy cookie-ból)
    if (this.initialData) {
      if (this.initialData.images && Array.isArray(this.initialData.images)) {
        this.initialData.images.forEach((img: any, index: number) => {
          if (this.imageSlots[index] && img.preview) {
            this.imageSlots[index].preview = img.preview;
            // File objektum nem lehet cookie-ba, így csak a preview kerül ott el
          }
        });
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
      images: this.imageSlots
        .filter(slot => slot.file !== null)
        .map(slot => ({
          file: slot.file,
          isMain: slot.isMain,
          preview: slot.preview
        }))
    });
  }

  // ============================================
  // KÉPFELTÖLTÉS KEZELÉS
  // ============================================

  onImageSelected(event: Event, slotId: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      this.imageUploadService.validateImageType(file);
      this.cropSourceFile = file;
      this.cropTargetSlotId = slotId;
      this.showCropModal = true;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'A kep feldolgozasa sikertelen.');
    } finally {
      input.value = '';
    }
  }

  closeCropModal(): void {
    this.cropSourceFile = null;
    this.cropTargetSlotId = null;
    this.showCropModal = false;
  }

  async applyCrop(file: File): Promise<void> {
    if (!this.cropTargetSlotId) {
      this.closeCropModal();
      return;
    }

    try {
      const processedImage = await this.imageUploadService.prepareImage(file);
      const slot = this.imageSlots.find(s => s.id === this.cropTargetSlotId);

      if (slot) {
        slot.preview = processedImage.previewUrl;
        slot.file = processedImage.file;
        this.emitFormStatus();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'A kep feldolgozasa sikertelen.');
    } finally {
      this.closeCropModal();
    }
  }

  triggerFileInput(slotId: string) {
    const inputId = `file-input-${slotId}`;
    const input = document.getElementById(inputId) as HTMLInputElement;
    input?.click();
  }

  deleteImage(slotId: string) {
    const slot = this.imageSlots.find(s => s.id === slotId);
    if (slot) {
      slot.preview = null;
      slot.file = null;
      this.emitFormStatus();
    }
  }

  onDragStart(event: DragEvent, slotId: string) {
    this.draggedSlotId = slotId;
    event.dataTransfer!.effectAllowed = 'move';
    (event.target as HTMLElement).classList.add('dragstart');
  }

  onDragEnd(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('dragstart');
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDrop(event: DragEvent, targetSlotId: string) {
    event.preventDefault();
    
    if (this.draggedSlotId && this.draggedSlotId !== targetSlotId) {
      const draggedSlot = this.imageSlots.find(s => s.id === this.draggedSlotId);
      const targetSlot = this.imageSlots.find(s => s.id === targetSlotId);
      
      if (draggedSlot && targetSlot) {
        const tempPreview = draggedSlot.preview;
        const tempFile = draggedSlot.file;
        
        draggedSlot.preview = targetSlot.preview;
        draggedSlot.file = targetSlot.file;
        
        targetSlot.preview = tempPreview;
        targetSlot.file = tempFile;
        
        this.emitFormStatus();
      }
    }
    
    this.draggedSlotId = null;
  }

  getFormData() {
    return {
      images: this.imageSlots
        .filter(slot => slot.file !== null)
        .map(slot => ({
          file: slot.file,
          isMain: slot.isMain,
          preview: slot.preview
        }))
    };
  }

  isFormValid(): boolean {
    // Az image upload opcionális
    return true;
  }
}
