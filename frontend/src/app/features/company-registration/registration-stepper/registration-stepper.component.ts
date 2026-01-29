import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  @Output() stepChanged = new EventEmitter<number>();

  get progressPercentage(): number {
    if (this.steps.length <= 1) return 0;
    return ((this.currentStep - 1) / (this.steps.length - 1)) * 100;
  }

  onStepClick(stepNumber: number): void {
    const step = this.steps.find(s => s.number === stepNumber);
    
    // Csak completed lépésekre vagy az aktuálisnál nem előbbre lehet kattintani
    if (step && (step.completed || stepNumber <= this.currentStep)) {
      this.stepChanged.emit(stepNumber);
    }
  }
}