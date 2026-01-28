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
      bookingAdvanceDays: [30, [Validators.required, Validators.min(1)]],
      cancellationHours: [24, [Validators.required, Validators.min(1)]],
      bufferTimeBetweenBookings: [0, [Validators.required, Validators.min(0)]],
      maxAdvanceBookingDays: [90, [Validators.required, Validators.min(7)]]
    });

    // Form változások figyelése
    this.businessForm.valueChanges.subscribe(() => {
      this.formValid.emit(this.businessForm.valid);
      if (this.businessForm.valid) {
        // Hozzáadjuk a fix HUF pénznemet az adatokhoz
        const formDataWithCurrency = {
          ...this.businessForm.value,
          currency: this.currency
        };
        this.formData.emit(formDataWithCurrency);
      }
    });
  }

  ngOnInit() {
    if (this.initialData) {
      this.businessForm.patchValue(this.initialData);
    }

    // Kezdeti validitás kibocsátása
    this.formValid.emit(this.businessForm.valid);
    
    // Kezdeti adatok kibocsátása (currency-vel)
    if (this.businessForm.valid) {
      const formDataWithCurrency = {
        ...this.businessForm.value,
        currency: this.currency
      };
      this.formData.emit(formDataWithCurrency);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.businessForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFormData() {
    return {
      ...this.businessForm.value,
      currency: this.currency
    };
  }

  isFormValid(): boolean {
    return this.businessForm.valid;
  }
}