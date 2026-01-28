import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-company-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-company-info.component.html',
  styleUrls: ['./step-company-info.component.css']
})
export class StepCompanyInfoComponent implements OnInit {
  @Output() formValid = new EventEmitter<boolean>();
  @Output() formData = new EventEmitter<any>();
  @Input() initialData: any;

  companyForm: FormGroup;
  
  // ============================================
  // MOCK BUSINESS CATEGORIES - ideiglenesen!
  // ============================================
  businessCategories = [
    { id: 1, name: 'Szépségszalon', icon: '💅' },
    { id: 2, name: 'Wellness és Spa', icon: '💆' },
    { id: 3, name: 'Fodrászat', icon: '💇' },
    { id: 4, name: 'Körömstúdió', icon: '💅' },
    { id: 5, name: 'Fitness', icon: '💪' },
    { id: 6, name: 'Egészségügy', icon: '🏥' },
    { id: 7, name: 'Fogorvos', icon: '🦷' },
    { id: 8, name: 'Állatorvos', icon: '🐕' },
    { id: 9, name: 'Autószerviz', icon: '🚗' },
    { id: 10, name: 'Oktatás', icon: '📚' }
  ];

  isCategoriesLoading = false; // Mock loading state
  
  imageSlots = [
    { id: 'main', preview: null as string | null, file: null as File | null, isMain: true },
    { id: 'image2', preview: null as string | null, file: null as File | null, isMain: false },
    { id: 'image3', preview: null as string | null, file: null as File | null, isMain: false },
    { id: 'image4', preview: null as string | null, file: null as File | null, isMain: false }
  ];

  draggedSlotId: string | null = null;
  descriptionCharCount = 0;
  maxDescriptionLength = 500;

  constructor(private fb: FormBuilder) {
    this.companyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
      businessCategoryId: [null, [Validators.required]], // ← EZ VOLT NULL, most kötelező!
      address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      country: ['Magyarország', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?36\d{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      website: ['', [Validators.pattern(/^https?:\/\/.+/)]]
    });

    this.companyForm.get('description')?.valueChanges.subscribe(value => {
      this.descriptionCharCount = value?.length || 0;
    });

    this.companyForm.valueChanges.subscribe(() => {
      this.emitFormStatus();
    });
  }

  ngOnInit() {
    // Ha van initial data, töltsd be
    if (this.initialData) {
      this.companyForm.patchValue(this.initialData);
      
      if (this.initialData.images) {
        this.initialData.images.forEach((img: any, index: number) => {
          if (this.imageSlots[index]) {
            this.imageSlots[index].preview = img.preview;
          }
        });
      }
    }

    // Kezdeti validitás kibocsátása
    this.emitFormStatus();
  }

  emitFormStatus() {
    const hasAtLeastOneImage = this.imageSlots.some(slot => slot.preview !== null);
    const isValid = this.companyForm.valid && hasAtLeastOneImage;
    
    this.formValid.emit(isValid);
    
    if (isValid) {
      this.formData.emit({
        ...this.companyForm.value,
        images: this.imageSlots
          .filter(slot => slot.file !== null)
          .map(slot => ({
            file: slot.file,
            isMain: slot.isMain,
            preview: slot.preview
          }))
      });
    }
  }

  // ============================================
  // KÉPFELTÖLTÉS KEZELÉS
  // ============================================

  onImageSelected(event: Event, slotId: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (!file.type.startsWith('image/')) {
        alert('Csak képfájlokat lehet feltölteni!');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('A kép mérete maximum 5MB lehet!');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const slot = this.imageSlots.find(s => s.id === slotId);
        if (slot) {
          slot.preview = e.target?.result as string;
          slot.file = file;
          this.emitFormStatus();
        }
      };
      reader.readAsDataURL(file);
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

  isFieldInvalid(fieldName: string): boolean {
    const field = this.companyForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFormData() {
    return {
      ...this.companyForm.value,
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
    const hasAtLeastOneImage = this.imageSlots.some(slot => slot.preview !== null);
    return this.companyForm.valid && hasAtLeastOneImage;
  }
}