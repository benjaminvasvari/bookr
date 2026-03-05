import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatNativeDateModule } from '@angular/material/core';

export interface DayOpeningHours {
  dayName: string;
  dayNumber: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

@Component({
  selector: 'app-step-opening-hours',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatInputModule, MatTimepickerModule, MatNativeDateModule],
  templateUrl: './step-opening-hours.component.html',
  styleUrl: './step-opening-hours.component.css',
})
export class StepOpeningHoursComponent implements OnInit {
  @Output() formValid = new EventEmitter<boolean>();
  @Output() formData = new EventEmitter<any>();
  @Input() initialData: any;

  openingHoursForm: FormGroup;
  
  days: DayOpeningHours[] = [
    { dayName: 'Hétfő', dayNumber: 1, isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { dayName: 'Kedd', dayNumber: 2, isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { dayName: 'Szerda', dayNumber: 3, isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { dayName: 'Csütörtök', dayNumber: 4, isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { dayName: 'Péntek', dayNumber: 5, isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { dayName: 'Szombat', dayNumber: 6, isOpen: false, openTime: '10:00', closeTime: '14:00' },
    { dayName: 'Vasárnap', dayNumber: 7, isOpen: false, openTime: '10:00', closeTime: '14:00' }
  ];

  constructor(private fb: FormBuilder) {
    this.openingHoursForm = this.fb.group({
      // Form csak az adatok mentéséhez
    });
  }

  ngOnInit() {
    // Ha van initial data, töltsd be
    if (this.initialData && this.initialData.days) {
      this.days = this.initialData.days;
    }

    // Kezdeti validitás kibocsátása
    this.emitFormStatus();
  }

  emitFormStatus() {
    // Az opening hours opcionális, így mindig valid
    this.formValid.emit(true);
    this.formData.emit({
      days: this.days
    });
  }

  // Toggle a nap nyitva/zárva státusza
  toggleDay(dayNumber: number): void {
    const day = this.days.find(d => d.dayNumber === dayNumber);
    if (day) {
      day.isOpen = !day.isOpen;
      this.emitFormStatus();
    }
  }

  // Nyitási idő módosítása
  onOpenTimeChange(dayNumber: number, time: string): void {
    const day = this.days.find(d => d.dayNumber === dayNumber);
    if (day) {
      day.openTime = time;
      this.emitFormStatus();
    }
  }

  // Zárási idő módosítása
  onCloseTimeChange(dayNumber: number, time: string): void {
    const day = this.days.find(d => d.dayNumber === dayNumber);
    if (day) {
      day.closeTime = time;
      this.emitFormStatus();
    }
  }

  // Az összes nap beállítása nyitvatartásra
  setAllDaysOpen(): void {
    this.days.forEach(day => {
      day.isOpen = true;
      if (day.dayNumber >= 6) {
        // Hétvégék: 10:00 - 14:00
        day.openTime = '10:00';
        day.closeTime = '14:00';
      } else {
        // Hétköznap: 09:00 - 17:00
        day.openTime = '09:00';
        day.closeTime = '17:00';
      }
    });
    this.emitFormStatus();
  }

  // Az összes nap zárásra beállítása
  setAllDaysClosed(): void {
    this.days.forEach(day => {
      day.isOpen = false;
    });
    this.emitFormStatus();
  }

  getFormData() {
    return {
      days: this.days
    };
  }

  isFormValid(): boolean {
    // Az opening hours opcionális
    return true;
  }

  toTimeModel(value: string): Date | null {
    const normalized = value?.trim() ?? '';
    if (!/^\d{2}:\d{2}$/.test(normalized)) {
      return null;
    }

    const [hoursRaw, minutesRaw] = normalized.split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  onOpenTimePickerChange(dayNumber: number, value: Date | null): void {
    const formatted = this.formatTime(value);
    if (!formatted) {
      return;
    }

    this.onOpenTimeChange(dayNumber, formatted);
  }

  onCloseTimePickerChange(dayNumber: number, value: Date | null): void {
    const formatted = this.formatTime(value);
    if (!formatted) {
      return;
    }

    this.onCloseTimeChange(dayNumber, formatted);
  }

  private formatTime(value: Date | null): string {
    if (!value || Number.isNaN(value.getTime())) {
      return '';
    }

    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
