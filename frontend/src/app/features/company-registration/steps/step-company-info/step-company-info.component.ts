import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CompaniesService } from '../../../../core/services/companies.service';  // ✅ FIX
import { BusinessCategory } from '../../../../core/models/business-category.model';  // ✅ FIX

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
  businessCategories: BusinessCategory[] = [];
  isLoadingCategories = true;

  // Képkezeléshez
  images: { file: File; preview: string; isMain: boolean }[] = [];
  maxImages = 4;

  constructor(
    private fb: FormBuilder,
    private companiesService: CompaniesService
  ) {
    this.companyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]],
      country: ['Magyarország', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\+36[0-9]{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      website: [''],
      businessCategoryId: ['', [Validators.required]]
    });

    this.companyForm.valueChanges.subscribe(() => {
      this.formValid.emit(this.companyForm.valid);
      if (this.companyForm.valid) {
        this.formData.emit(this.companyForm.value);
      }
    });
  }

  ngOnInit() {
    this.loadBusinessCategories();

    if (this.initialData) {
      this.companyForm.patchValue(this.initialData);
    }
  }

  loadBusinessCategories(): void {
    this.isLoadingCategories = true;
    this.companiesService.getBusinessCategories().subscribe({
      next: (categories) => {
        this.businessCategories = categories;
        this.isLoadingCategories = false;
      },
      error: (error) => {
        console.error('Error loading business categories:', error);
        this.isLoadingCategories = false;
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.companyForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFormData() {
    return this.companyForm.value;
  }

  isFormValid(): boolean {
    return this.companyForm.valid;
  }

  onCategoryChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const categoryId = selectElement.value;
    this.companyForm.patchValue({ businessCategoryId: categoryId ? +categoryId : '' });
  }

  /**
   * Fájl kiválasztás kezelése a képfeltöltéshez
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      // Max 4 kép korlátozás
      if (this.images.length >= this.maxImages) {
        alert(`Maximum ${this.maxImages} kép tölthető fel`);
        break;
      }

      const file = files[i];

      // Validálás: csak képformátumok
      if (!file.type.startsWith('image/')) {
        alert('Kérem, csak képfájlokat válasszon!');
        continue;
      }

      // Fájl méret validálás (max 5MB)
      const maxSizeInMB = 5;
      if (file.size > maxSizeInMB * 1024 * 1024) {
        alert(`A fájl mérete nem haladhatja meg az ${maxSizeInMB}MB-ot`);
        continue;
      }

      // FileReader a preview-hoz
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        
        // Az első kép automatikusan main kép lesz
        const isMain = this.images.length === 0;
        
        this.images.push({
          file,
          preview,
          isMain
        });
      };
      reader.readAsDataURL(file);
    }

    // Input manuális törlése
    input.value = '';
  }

  /**
   * Kép eltávolítása a listából
   */
  removeImage(index: number): void {
    const wasMainImage = this.images[index].isMain;
    this.images.splice(index, 1);

    // Ha az eltávolított kép main volt, az első marad main
    if (wasMainImage && this.images.length > 0) {
      this.images[0].isMain = true;
    }
  }

  /**
   * Main kép kiválasztása
   */
  setMainImage(index: number): void {
    // Összes kép main státuszát false-ra állítjuk
    this.images.forEach((img, i) => {
      img.isMain = i === index;
    });
  }

  /**
   * Képek lekérése az adatok közül
   */
  getImages(): { file: File; preview: string; isMain: boolean }[] {
    return this.images;
  }

  /**
   * Teljes form adatok lekérése a képekkel
   */
  getFormDataWithImages(): any {
    return {
      ...this.companyForm.value,
      images: this.images
    };
  }
} 