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

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
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
    this.saveCurrentStepData();

    if (this.currentStep < this.steps.length) {
      this.steps[this.currentStep - 1].completed = true;
      this.steps[this.currentStep - 1].active = false;
      this.currentStep++;
      this.steps[this.currentStep - 1].active = true;
      this.isCurrentStepValid = false;
    } else {
      this.submitRegistration();
    }

    // Scroll to top
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
        break;
      case 3:
        data = this.stepImageUpload?.getFormData();
        this.registrationData.imageUpload = data;
        break;
      case 4:
        data = this.stepBusinessDetails?.getFormData();
        this.registrationData.businessDetails = data;
        break;
      case 5:
        data = this.stepOpeningHours?.getFormData();
        this.registrationData.openingHours = data;
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
        break;
      case 3:
        this.registrationData.imageUpload = data;
        break;
      case 4:
        this.registrationData.businessDetails = data;
        break;
      case 5:
        this.registrationData.openingHours = data;
        break;
      case 5:
        this.registrationData.openingHours = data;
        break;
    }
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
    console.log('Registration data:', this.registrationData);
    console.log('Is logged in:', this.isUserLoggedIn);
    
    this.isSubmitting = true;
    
    // Szimulálunk egy API hívást
    setTimeout(() => {
      this.isSubmitting = false;
      this.showSuccessModal = true;
      
      // 3 másodperc után redirect a main page-re
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 3000);
    }, 1500);
    
    // TODO: API call helyett a valódi submission
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
}