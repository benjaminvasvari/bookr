import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CompaniesService } from '../../../../core/services/companies.service';
import { BusinessCategory } from '../../../../core/models/business-category.model';

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
  isCategoriesLoading = false;

  descriptionCharCount = 0;
  maxDescriptionLength = 500;

  constructor(
    private fb: FormBuilder,
    private companiesService: CompaniesService
  ) {
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
    this.loadBusinessCategories();

    // Ha van initial data, töltsd be
    if (this.initialData) {
      this.companyForm.patchValue(this.initialData);
    }

    // Kezdeti validitás kibocsátása
    this.emitFormStatus();
  }

  private loadBusinessCategories(): void {
    this.isCategoriesLoading = true;

    this.companiesService.getBusinessCategories().subscribe({
      next: (categories) => {
        this.businessCategories = categories;
        this.isCategoriesLoading = false;
      },
      error: () => {
        this.businessCategories = [];
        this.isCategoriesLoading = false;
      }
    });
  }

  emitFormStatus() {
    const isValid = this.companyForm.valid;
    
    this.formValid.emit(isValid);
    
    if (isValid) {
      this.formData.emit(this.companyForm.value);
    }
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
}