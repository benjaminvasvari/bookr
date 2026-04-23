import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RegistrationStepperComponent, Step } from '../registration-stepper/registration-stepper.component';
import { StepOwnerInfoComponent } from '../../company-registration/steps/step-owner-info/step-owner-info.component';
import { StepCompanyInfoComponent } from '../../company-registration/steps/step-company-info/step-company-info.component';
import { StepImageUploadComponent } from '../steps/step-image-upload/step-image-upload.component';
import { StepBusinessDetailsComponent } from '../steps/step-business-details/step-business-details.component';
import { StepOpeningHoursComponent } from '../steps/step-opening-hours/step-opening-hours.component';
import { AuthService } from '../../../core/services/auth.service';
import { CookieService } from '../../../core/services/cookie.service';
import { CompaniesService } from '../../../core/services/companies.service';

@Component({
  selector: 'app-company-registration-container',
  standalone: true,
  imports: [
    CommonModule,
    RegistrationStepperComponent,
    StepOwnerInfoComponent,
    StepCompanyInfoComponent,
    StepImageUploadComponent,
    StepBusinessDetailsComponent,
    StepOpeningHoursComponent,
  ],
  templateUrl: './company-registration-container.component.html',
  styleUrls: ['./company-registration-container.component.css']
})
export class CompanyRegistrationContainerComponent implements OnInit {
  @ViewChild(StepOwnerInfoComponent) stepOwnerInfo!: StepOwnerInfoComponent;
  @ViewChild(StepCompanyInfoComponent) stepCompanyInfo!: StepCompanyInfoComponent;
  @ViewChild(StepImageUploadComponent) stepImageUpload!: StepImageUploadComponent;
  @ViewChild(StepBusinessDetailsComponent) stepBusinessDetails!: StepBusinessDetailsComponent;
  @ViewChild(StepOpeningHoursComponent) stepOpeningHours!: StepOpeningHoursComponent;

  currentStep = 1;
  isCurrentStepValid = false;
  isUserLoggedIn = false;
  currentUser: any = null;
  showSuccessModal = false;
  isSubmitting = false;

  registrationData: any = {
    ownerInfo: null,
    companyInfo: null,
    imageUpload: null,
    businessDetails: null,
    openingHours: null
  };

  steps: Step[] = [
    { number: 1, title: 'Tulajdonos adatok', completed: false, active: true },
    { number: 2, title: 'Cég információk', completed: false, active: false },
    { number: 3, title: 'Képek feltöltése', completed: false, active: false },
    { number: 4, title: 'Üzleti részletek', completed: false, active: false },
    { number: 5, title: 'Nyitvatartás', completed: false, active: false }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private cookieService: CookieService,
    private companyService: CompaniesService
  ) {}

  ngOnInit() {
    // Cookie-ből betöltjük az elmentett adatokat
    this.loadDataFromCookies();

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isUserLoggedIn = !!user;

      if (this.isUserLoggedIn && user) {
        this.registrationData.ownerInfo = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        };

        this.isCurrentStepValid = true;
        this.steps[0].completed = true;
      }
    });
  }

  getCurrentStepTitle(): string {
    return this.steps[this.currentStep - 1]?.title || '';
  }

  nextStep(): void {
    console.log('➡️ nextStep() called');
    console.log('📊 Current step:', this.currentStep);
    console.log('📊 Total steps:', this.steps.length);
    
    this.saveCurrentStepData();

    if (this.currentStep < this.steps.length) {
      console.log('⏭️ Moving to next step');
      this.steps[this.currentStep - 1].completed = true;
      this.steps[this.currentStep - 1].active = false;
      this.currentStep++;
      this.steps[this.currentStep - 1].active = true;
      this.setStepValidityAfterNavigation();
    } else {
      console.log('🎯 Last step reached - calling submitRegistration()');
      this.submitRegistration();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.steps[this.currentStep - 1].active = false;
      this.currentStep--;
      this.steps[this.currentStep - 1].active = true;
      this.steps[this.currentStep - 1].completed = false;
      this.setStepValidityAfterNavigation();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onStepValidityChange(isValid: boolean): void {
    this.isCurrentStepValid = isValid;
  }

  onStepDataChange(data: any): void {
    this.saveStepData(this.currentStep, data);
  }

  private saveCurrentStepData(): void {
    let data;
    switch (this.currentStep) {
      case 1:
        if (!this.isUserLoggedIn) {
          data = this.stepOwnerInfo?.getFormData();
          this.registrationData.ownerInfo = data;
        }
        break;
      case 2:
        data = this.stepCompanyInfo?.getFormData();
        this.registrationData.companyInfo = data;
        this.cookieService.setCookie('bookr_company_info', data);
        break;
      case 3:
        data = this.stepImageUpload?.getFormData();
        this.registrationData.imageUpload = data;
        this.cookieService.setCookie('bookr_image_upload', data);
        break;
      case 4:
        data = this.stepBusinessDetails?.getFormData();
        this.registrationData.businessDetails = data;
        this.cookieService.setCookie('bookr_business_details', data);
        break;
      case 5:
        data = this.stepOpeningHours?.getFormData();
        this.registrationData.openingHours = data;
        this.cookieService.setCookie('bookr_opening_hours', data);
        break;
    }
  }

  private saveStepData(step: number, data: any): void {
    switch (step) {
      case 1:
        if (!this.isUserLoggedIn) {
          this.registrationData.ownerInfo = data;
        }
        break;
      case 2:
        this.registrationData.companyInfo = data;
        this.cookieService.setCookie('bookr_company_info', data);
        break;
      case 3:
        this.registrationData.imageUpload = data;
        this.cookieService.setCookie('bookr_image_upload', data);
        break;
      case 4:
        this.registrationData.businessDetails = data;
        this.cookieService.setCookie('bookr_business_details', data);
        break;
      case 5:
        this.registrationData.openingHours = data;
        this.cookieService.setCookie('bookr_opening_hours', data);
        break;
    }
  }

  private loadDataFromCookies(): void {
    const companyInfo = this.cookieService.getCookie('bookr_company_info');
    const imageUpload = this.cookieService.getCookie('bookr_image_upload');
    const businessDetails = this.cookieService.getCookie('bookr_business_details');
    const openingHours = this.cookieService.getCookie('bookr_opening_hours');

    if (companyInfo) this.registrationData.companyInfo = companyInfo;
    if (imageUpload) this.registrationData.imageUpload = imageUpload;
    if (businessDetails) this.registrationData.businessDetails = businessDetails;
    if (openingHours) this.registrationData.openingHours = openingHours;
  }

  private checkCurrentStepValidity(): void {
    let isValid = false;
    switch (this.currentStep) {
      case 1:
        isValid = this.isUserLoggedIn ? true : (this.stepOwnerInfo?.isFormValid() || false);
        break;
      case 2:
        isValid = this.stepCompanyInfo?.isFormValid() || false;
        break;
      case 3:
        isValid = this.stepImageUpload?.isFormValid() || false;
        break;
      case 4:
        isValid = this.stepBusinessDetails?.isFormValid() || false;
        break;
      case 5:
        isValid = this.stepOpeningHours?.isFormValid() || false;
        break;
    }
    this.isCurrentStepValid = isValid;
  }

  private setStepValidityAfterNavigation(): void {
    if (this.currentStep === 3 || this.currentStep === 5) {
      this.isCurrentStepValid = true;
      return;
    }

    this.checkCurrentStepValidity();
  }

  private submitRegistration(): void {
    console.log('📦 Registration data:', this.registrationData);
    console.log('🔐 Is logged in:', this.isUserLoggedIn);

    this.isSubmitting = true;

    const payload = this.buildRegistrationPayload();
    console.log('📤 Registration payload:', payload);

    this.companyService.registerCompany(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        const companyId =
          response?.companyId ??
          response?.data?.companyId ??
          response?.data?.id ??
          response?.id ??
          null;

        if (companyId) {
          this.authService.updateUserCompany(companyId);
          console.log('✅ User companyId updated in AuthService:', companyId);
        } else {
          console.warn('⚠️ CompanyId not found in response:', response);
        }

        if (this.isUserLoggedIn) {
          this.authService.refreshCurrentUser().subscribe({
            next: () => console.log('✅ User refreshed from /users/me'),
            error: (refreshError) =>
              console.warn('⚠️ Failed to refresh user from /users/me:', refreshError)
          });
        }

        this.showSuccessModal = true;
        this.cookieService.clearRegistrationCookies();

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 3000);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('❌ Hiba a regisztráció során:', error);
        const message = error?.message || 'Hiba történt a regisztráció során. Kérjük próbálja újra!';
        alert(message);
      }
    });
  }

  private buildRegistrationPayload(): any {
    const ownerInfo = this.registrationData?.ownerInfo || {};
    const companyInfo = this.registrationData?.companyInfo || {};
    const businessDetails = this.registrationData?.businessDetails || {};

    const payload: any = {
      name: companyInfo.name || null,
      description: companyInfo.description || null,
      address: companyInfo.address || null,
      city: companyInfo.city || null,
      postalCode: companyInfo.postalCode || null,
      country: companyInfo.country || null,
      phone: companyInfo.phone || null,
      email: companyInfo.email || null,
      website: companyInfo.website || null,
      businessCategoryId: companyInfo.businessCategoryId ?? null,
      bookingAdvanceDays: businessDetails.maxAdvanceBookingDays ?? null,
      cancellationHours: businessDetails.cancellationHours ?? null,
      minimumBookingHoursAhead: this.parseHoursAhead(businessDetails.minBookingHoursSameDay),
      openingHours: this.formatOpeningHours(this.registrationData?.openingHours)
    };

    if (!this.isUserLoggedIn) {
      payload.firstName = ownerInfo.firstName || null;
      payload.lastName = ownerInfo.lastName || null;
      payload.email = ownerInfo.email || payload.email;
      payload.phone = ownerInfo.phone || payload.phone;
      payload.password = ownerInfo.password || null;
    }

    return payload;
  }

  private parseHoursAhead(value: string | boolean | null | undefined): number | null {
    if (value === false || value === null || value === undefined || value === '') {
      return 0;
    }

    if (typeof value === 'string') {
      const parts = value.split(':');
      if (parts.length === 2) {
        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);
        if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
          return hours + minutes / 60;
        }
      }
    }

    return typeof value === 'number' ? value : null;
  }

  private formatOpeningHours(openingHoursData: any): Record<string, string> | null {
    if (!openingHoursData?.days || !Array.isArray(openingHoursData.days)) {
      return null;
    }

    const dayMap: Record<number, string> = {
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
      7: 'sunday'
    };

    const result: Record<string, string> = {
      monday: 'closed',
      tuesday: 'closed',
      wednesday: 'closed',
      thursday: 'closed',
      friday: 'closed',
      saturday: 'closed',
      sunday: 'closed'
    };

    openingHoursData.days.forEach((day: any) => {
      const key = dayMap[day.dayNumber];
      if (!key) return;
      if (!day.isOpen) {
        result[key] = 'closed';
        return;
      }

      const openTime = day.openTime || '00:00';
      const closeTime = day.closeTime || '00:00';
      result[key] = `${openTime}-${closeTime}`;
    });

    return result;
  }

  getButtonText(): string {
    return this.currentStep === this.steps.length ? 'Regisztráció befejezése' : 'Tovább';
  }

  canGoNext(): boolean {
    return this.isCurrentStepValid;
  }

  canGoBack(): boolean {
    return this.currentStep > 1;
  }

  onStepChanged(stepNumber: number): void {
    if (stepNumber < this.currentStep) {
      // Vissza lépés
      this.currentStep = stepNumber;
      this.steps[stepNumber - 1].active = true;
      this.steps[this.currentStep].active = false;
      this.setStepValidityAfterNavigation();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (stepNumber === this.currentStep + 1 && this.isCurrentStepValid) {
      // Előre lépés
      this.nextStep();
    }
  }
}