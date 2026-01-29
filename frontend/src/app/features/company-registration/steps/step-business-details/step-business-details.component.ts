import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-business-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-business-details.component.html',
  styleUrls: ['./step-business-details.component.css']
})
export class StepBusinessDetailsComponent implements OnInit {
  @Output() formValid = new EventEmitter<boolean>();
  @Output() formData = new EventEmitter<any>();
  @Input() initialData: any;

  businessForm: FormGroup;

  // Pénznem csak HUF marad
  currency = 'HUF';

  bookingAdvanceOptions = [
    { value: 7, label: '1 hét' },
    { value: 14, label: '2 hét' },
    { value: 30, label: '1 hónap' },
    { value: 60, label: '2 hónap' },
    { value: 90, label: '3 hónap' },
    { value: 180, label: '6 hónap' }
  ];

  cancellationHoursOptions = [
    { value: 1, label: '1 óra' },
    { value: 3, label: '3 óra' },
    { value: 6, label: '6 óra' },
    { value: 12, label: '12 óra' },
    { value: 24, label: '24 óra (1 nap)' },
    { value: 48, label: '48 óra (2 nap)' }
  ];

  bufferTimeOptions = [
    { value: 0, label: 'Nincs' },
    { value: 5, label: '5 perc' },
    { value: 10, label: '10 perc' },
    { value: 15, label: '15 perc' },
    { value: 30, label: '30 perc' }
  ];

  constructor(private fb: FormBuilder) {
    this.businessForm = this.fb.group({
      minBookingHoursSameDay: ['02:00', [Validators.required]],
      cancellationHours: [24, [Validators.required, Validators.min(1)]],
      maxAdvanceBookingDays: [90, [Validators.required, Validators.min(7)]],
      minBookingSameDayNone: [false]
    });

    // Form változások figyelése
    const timeControl = this.businessForm.get('minBookingHoursSameDay');
    if (timeControl) {
      timeControl.setValidators([Validators.required, this.maxSameDayHoursValidator(12)]);
    }

    this.businessForm.valueChanges.subscribe(() => {
      this.emitFormStatus();
    });

    this.businessForm.get('minBookingSameDayNone')?.valueChanges.subscribe((isNone) => {
      const control = this.businessForm.get('minBookingHoursSameDay');
      if (isNone) {
        control?.disable({ emitEvent: false });
        control?.setValue('', { emitEvent: false });
      } else {
        control?.enable({ emitEvent: false });
        if (!control?.value) {
          control?.setValue('02:00', { emitEvent: false });
        }
      }
      this.emitFormStatus();
    });
  }

  ngOnInit() {
    if (this.initialData) {
      this.businessForm.patchValue(this.initialData);
      if (this.initialData.minBookingHoursSameDay === false) {
        this.businessForm.get('minBookingSameDayNone')?.setValue(true, { emitEvent: false });
        this.businessForm.get('minBookingHoursSameDay')?.disable({ emitEvent: false });
      }
    }

    // Kezdeti validitás kibocsátása
    this.emitFormStatus();
  }

  private emitFormStatus(): void {
    const isNone = this.businessForm.get('minBookingSameDayNone')?.value === true;
    const isValid = this.businessForm.valid || isNone;

    this.formValid.emit(isValid);

    if (isValid) {
      const rawValue = this.businessForm.getRawValue();
      const formDataWithCurrency = {
        ...rawValue,
        minBookingHoursSameDay: isNone ? false : rawValue.minBookingHoursSameDay,
        currency: this.currency
      };
      this.formData.emit(formDataWithCurrency);
    }
  }

  private maxSameDayHoursValidator(maxHours: number) {
    return (control: { value: string | null }) => {
      const value = control?.value;
      if (!value) return null;
      const parts = value.split(':');
      if (parts.length !== 2) return null;
      const hours = Number(parts[0]);
      const minutes = Number(parts[1]);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
      const totalMinutes = hours * 60 + minutes;
      const maxMinutes = maxHours * 60;
      return totalMinutes > maxMinutes ? { maxSameDayHours: true } : null;
    };
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.businessForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFormData() {
    const rawValue = this.businessForm.getRawValue();
    const isNone = rawValue.minBookingSameDayNone === true;
    return {
      ...rawValue,
      minBookingHoursSameDay: isNone ? false : rawValue.minBookingHoursSameDay,
      currency: this.currency
    };
  }

  isFormValid(): boolean {
    return this.businessForm.valid;
  }
}