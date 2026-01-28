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
}