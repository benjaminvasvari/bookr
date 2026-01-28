import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistrationStepperComponent, Step } from '../registration-stepper/registration-stepper.component';
import { StepOwnerInfoComponent } from '../../company-registration/steps/step-owner-info/step-owner-info.component';
import { StepCompanyInfoComponent } from '../../company-registration/steps/step-company-info/step-company-info.component';
import { StepBusinessDetailsComponent } from '../steps/step-business-details/step-business-details.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-company-registration-container',
  standalone: true,
  imports: [
    CommonModule,
    RegistrationStepperComponent,
    StepOwnerInfoComponent,
    StepCompanyInfoComponent,
    StepBusinessDetailsComponent,  // ← ÚJ! Hozzáadva az imports-hoz
  ],
  templateUrl: './company-registration-container.component.html',
  styleUrls: ['./company-registration-container.component.css']
})
export class CompanyRegistrationContainerComponent implements OnInit {
  @ViewChild(StepOwnerInfoComponent) stepOwnerInfo!: StepOwnerInfoComponent;
  @ViewChild(StepCompanyInfoComponent) stepCompanyInfo!: StepCompanyInfoComponent;
  @ViewChild(StepBusinessDetailsComponent) stepBusinessDetails!: StepBusinessDetailsComponent;  // ← ÚJ! ViewChild hozzáadva

  currentStep = 1;
  isCurrentStepValid = false;
  isUserLoggedIn = false;
  currentUser: any = null;

  registrationData: any = {
    ownerInfo: null,
    companyInfo: null,
    businessDetails: null,
    openingHours: null
  };

  steps: Step[] = [
    { number: 1, title: 'Tulajdonos adatok', completed: false, active: true },
    { number: 2, title: 'Cég információk', completed: false, active: false },
    { number: 3, title: 'Üzleti részletek', completed: false, active: false },
    { number: 4, title: 'Nyitvatartás', completed: false, active: false }
  ];

  constructor(private authService: AuthService) {}

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
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.steps[this.currentStep - 1].active = false;
      this.currentStep--;
      this.steps[this.currentStep - 1].active = true;
      this.steps[this.currentStep - 1].completed = false;
      this.checkCurrentStepValidity();
    }
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
      case 3:  // ← ÚJ! Step 3 mentés
        data = this.stepBusinessDetails?.getFormData();
        this.registrationData.businessDetails = data;
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
        this.registrationData.businessDetails = data;
        break;
      case 4:
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
      case 3:  // ← ÚJ! Step 3 validáció
        isValid = this.stepBusinessDetails?.isFormValid() || false;
        break;
    }
    this.isCurrentStepValid = isValid;
  }

  private submitRegistration(): void {
    console.log('Registration data:', this.registrationData);
    console.log('Is logged in:', this.isUserLoggedIn);
    // TODO: API call
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