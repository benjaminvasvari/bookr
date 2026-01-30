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

  constructor(private authService: AuthService, private router: Router, private cookieService: CookieService) {}

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
      this.isCurrentStepValid = false;
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
      this.checkCurrentStepValidity();
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

private submitRegistration(): void {
    console.log('📦 Registration data:', this.registrationData);
    console.log('🔐 Is logged in:', this.isUserLoggedIn);
    
    this.isSubmitting = true;
    
    // TODO: API hívás helyett most MOCK-oljuk
    // Szimuláljuk, hogy a backend visszaadja a company ID-t
    setTimeout(() => {
      this.isSubmitting = false;
      
      // ✅ MOCK - Backend response szimuláció
      const mockCompanyId = Math.floor(Math.random() * 1000) + 1;
      console.log('🏢 Mock Company ID created:', mockCompanyId);

      // ✅ Ha nincs bejelentkezve, hozzunk létre mock session-t
      if (!this.isUserLoggedIn && this.registrationData?.ownerInfo) {
        this.authService.setMockSession({
          id: Date.now(),
          email: this.registrationData.ownerInfo.email,
          phone: this.registrationData.ownerInfo.phone,
          firstName: this.registrationData.ownerInfo.firstName,
          lastName: this.registrationData.ownerInfo.lastName,
          roles: 'owner',
          companyId: mockCompanyId,
          avatarUrl: null,
          roleId: null,
        });
        this.isUserLoggedIn = true;
      }
      
      // ✅ User companyId frissítése az AuthService-ben
      this.authService.updateUserCompany(mockCompanyId);
      console.log('✅ User companyId updated in AuthService');
      
      // ✅ Success modal megjelenítése
      this.showSuccessModal = true;
      
      // ✅ Cookie-k törlése sikeres regisztráció után
      this.cookieService.clearRegistrationCookies();
      console.log('🗑️ Registration cookies cleared');
      
      // ✅ 3 másodperc után átirányítás a FŐOLDAL-ra
      setTimeout(() => {
        this.router.navigate(['/']);
        console.log('🚀 Redirected to / (main page)');
      }, 3000);
      
    }, 1500);
    
    /* 
    ═══════════════════════════════════════════════════════════
    TODO: ÉLES API HÍVÁS (amikor backend kész)
    ═══════════════════════════════════════════════════════════
    
    this.companyService.registerCompany(this.registrationData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        
        // Backend response-ból kinyerjük a company ID-t
        const companyId = response.companyId;
        
        // User companyId frissítése
        this.authService.updateUserCompany(companyId);
        
        // Success modal
        this.showSuccessModal = true;
        
        // Cookie-k törlése
        this.cookieService.clearRegistrationCookies();
        
        // Redirect főoldalra
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 3000);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('❌ Hiba a regisztráció során:', error);
        alert('Hiba történt a regisztráció során. Kérjük próbálja újra!');
      }
    });
    */
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
      this.checkCurrentStepValidity();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (stepNumber === this.currentStep + 1 && this.isCurrentStepValid) {
      // Előre lépés
      this.nextStep();
    }
  }
}