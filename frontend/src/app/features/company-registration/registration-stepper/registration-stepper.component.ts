import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Step {
  number: number;
  title: string;
  completed: boolean;
  active: boolean;
}

@Component({
  selector: 'app-registration-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registration-stepper.component.html',
  styleUrls: ['./registration-stepper.component.css']
})
export class RegistrationStepperComponent {
  @Input() steps: Step[] = [];
  @Input() currentStep: number = 1;

  get progressPercentage(): number {
    if (this.steps.length <= 1) return 0;
    return ((this.currentStep - 1) / (this.steps.length - 1)) * 100;
  }
}