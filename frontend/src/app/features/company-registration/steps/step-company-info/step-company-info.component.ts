import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CompaniesService } from '../../../../core/services/companies.service';
import { AuthService } from '../../../../core/services/auth.service';
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
  private lastAutofilledCity: string | null = null;
  private readonly postalCodeCityHints: Record<string, string> = {
    '1052': 'Budapest',
    '3525': 'Miskolc',
    '4024': 'Debrecen',
    '4400': 'Nyíregyháza',
    '5000': 'Szolnok',
    '6000': 'Kecskemét',
    '6720': 'Szeged',
    '7621': 'Pécs',
    '7628': 'Pécs',
    '8000': 'Székesfehérvár',
    '9021': 'Győr',
  };

  constructor(
    private fb: FormBuilder,
    private companiesService: CompaniesService,
    private authService: AuthService
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

    this.companyForm.get('postalCode')?.valueChanges.subscribe((value) => {
      this.onPostalCodeChanged(value);
    });

    this.companyForm.valueChanges.subscribe(() => {
      this.emitFormStatus();
    });
  }

  ngOnInit() {
    this.loadBusinessCategories();

    this.prefillContactFieldsFromCurrentUser();

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

  private prefillContactFieldsFromCurrentUser(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return;
    }

    const nextPatch: Record<string, string> = {};
    const currentEmail = this.companyForm.get('email')?.value;
    const currentPhone = this.companyForm.get('phone')?.value;

    if ((!currentEmail || String(currentEmail).trim() === '') && currentUser.email) {
      nextPatch['email'] = currentUser.email;
    }

    if ((!currentPhone || String(currentPhone).trim() === '') && currentUser.phone) {
      nextPatch['phone'] = currentUser.phone;
    }

    if (Object.keys(nextPatch).length > 0) {
      this.companyForm.patchValue(nextPatch);
    }
  }

  private onPostalCodeChanged(value: unknown): void {
    const postalCode = this.normalizePostalCode(value);
    const postalCodeControl = this.companyForm.get('postalCode');

    if (!postalCodeControl) {
      return;
    }

    if (postalCodeControl.value !== postalCode) {
      postalCodeControl.setValue(postalCode, { emitEvent: false });
    }

    const hintedCity = this.resolveCityFromPostalCode(postalCode);
    if (!hintedCity) {
      const cityControl = this.companyForm.get('city');
      if (this.lastAutofilledCity && cityControl?.value === this.lastAutofilledCity) {
        cityControl.setValue('');
      }

      this.lastAutofilledCity = null;
      return;
    }

    this.companyForm.get('city')?.setValue(hintedCity);
    this.lastAutofilledCity = hintedCity;
  }

  private normalizePostalCode(value: unknown): string {
    const asText = typeof value === 'string' ? value : String(value ?? '');
    return asText.replace(/\D/g, '').slice(0, 4);
  }

  private resolveCityFromPostalCode(postalCode: string): string | null {
    if (!postalCode || postalCode.length !== 4) {
      return null;
    }

    if (postalCode.startsWith('1')) {
      return 'Budapest';
    }

    if (postalCode.startsWith('76')) {
      return 'Pécs';
    }

    return this.postalCodeCityHints[postalCode] ?? null;
  }
}