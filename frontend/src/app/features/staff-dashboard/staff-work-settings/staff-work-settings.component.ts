import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import {
  ServicesService,
  StaffServiceItem,
  UpdateStaffServiceAssignmentRequest,
} from '../../../core/services/services.service';
import { StaffService, UpdateStaffWorkingHoursRequest } from '../../../core/services/staff.service';

interface WorkingHourDay {
  key: string;
  label: string;
  enabled: boolean;
  start: string;
  end: string;
}

interface StaffAssignableService {
  key: string;
  companyServiceId: number | null;
  name: string;
  category: string;
  duration: string;
  price: number;
  currency: string;
  enabled: boolean;
}

interface StaffAssignableServiceGroup {
  category: string;
  services: StaffAssignableService[];
}

const DEFAULT_WORKING_HOURS: WorkingHourDay[] = [
  { key: 'monday', label: 'Hétfő', enabled: true, start: '09:00', end: '17:00' },
  { key: 'tuesday', label: 'Kedd', enabled: true, start: '09:00', end: '17:00' },
  { key: 'wednesday', label: 'Szerda', enabled: true, start: '09:00', end: '17:00' },
  { key: 'thursday', label: 'Csütörtök', enabled: true, start: '09:00', end: '17:00' },
  { key: 'friday', label: 'Péntek', enabled: true, start: '09:00', end: '16:00' },
  { key: 'saturday', label: 'Szombat', enabled: false, start: '09:00', end: '13:00' },
  { key: 'sunday', label: 'Vasárnap', enabled: false, start: '09:00', end: '13:00' },
];

@Component({
  selector: 'app-staff-work-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-work-settings.component.html',
  styleUrl: './staff-work-settings.component.css',
})
export class StaffWorkSettingsComponent implements OnInit, OnDestroy {
  workingHours: WorkingHourDay[] = [];
  services: StaffAssignableService[] = [];

  isLoadingWorkingHours = true;
  isLoadingServices = false;

  workingHoursSaveMessage = '';
  workingHoursLoadError = '';
  workingHoursUpdateError = '';
  serviceSaveMessage = '';
  serviceUpdateError = '';
  errorMessage = '';

  private pendingUpdateTimers = new Map<string, number>();
  private workingHoursUpdateInFlight = new Set<string>();
  private pendingServiceUpdateTimers = new Map<string, number>();
  private serviceUpdateInFlight = new Set<number>();

  private companyId: number | null = null;
  private staffUserId: number | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly servicesService: ServicesService,
    private readonly staffService: StaffService,
  ) {}

  get enabledWorkingDaysCount(): number {
    return this.workingHours.filter((day) => day.enabled).length;
  }

  get selectedServicesCount(): number {
    return this.services.filter((service) => service.enabled).length;
  }

  get totalServicesCount(): number {
    return this.services.length;
  }

  get isWorkingHoursSaving(): boolean {
    return this.pendingUpdateTimers.size > 0 || this.workingHoursUpdateInFlight.size > 0;
  }

  get isServicesSaving(): boolean {
    return this.pendingServiceUpdateTimers.size > 0 || this.serviceUpdateInFlight.size > 0;
  }

  get serviceGroups(): StaffAssignableServiceGroup[] {
    const grouped = new Map<string, StaffAssignableService[]>();

    for (const service of this.services) {
      const existingGroup = grouped.get(service.category) ?? [];
      existingGroup.push(service);
      grouped.set(service.category, existingGroup);
    }

    return Array.from(grouped.entries()).map(([category, services]) => ({
      category,
      services,
    }));
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();

    if (!user?.id || !user.companyId) {
      this.errorMessage = 'Nem található staff vagy cég adat a beállítások betöltéséhez.';
      return;
    }

    this.staffUserId = user.id;
    this.companyId = user.companyId;

    this.loadWorkingHours();
    this.loadServices();
  }

  ngOnDestroy(): void {
    this.clearPendingUpdateTimers();
    this.clearPendingServiceUpdateTimers();
  }

  onWorkingDayAvailabilityChange(day: WorkingHourDay): void {
    this.workingHoursSaveMessage = '';
    this.workingHoursUpdateError = '';
    this.normalizeWorkingDay(day);
    this.scheduleWorkingHoursUpdate(day);
  }

  onWorkingHoursTimeChange(day: WorkingHourDay, field: 'start' | 'end', value: string): void {
    this.workingHoursSaveMessage = '';
    this.workingHoursUpdateError = '';
    day[field] = value;
    this.normalizeWorkingDay(day, field);
    this.scheduleWorkingHoursUpdate(day);
  }

  private scheduleWorkingHoursUpdate(day: WorkingHourDay): void {
    const existingTimer = this.pendingUpdateTimers.get(day.key);

    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = window.setTimeout(() => {
      this.pendingUpdateTimers.delete(day.key);
      this.sendWorkingHoursUpdate(day);
    }, 700);

    this.pendingUpdateTimers.set(day.key, timer);
    this.workingHoursSaveMessage = 'Munkaidő mentése...';
    this.workingHoursUpdateError = '';
  }

  private sendWorkingHoursUpdate(day: WorkingHourDay): void {
    if (!this.companyId || !this.staffUserId) {
      return;
    }

    const payload: UpdateStaffWorkingHoursRequest = {
      dayOfWeek: day.key,
      isAvailable: day.enabled,
      startTime: day.enabled ? this.formatServerTime(day.start) : null,
      endTime: day.enabled ? this.formatServerTime(day.end) : null,
    };

    this.workingHoursUpdateInFlight.add(day.key);

    this.staffService.updateStaffWorkingHours(payload).subscribe({
      next: () => {
        this.workingHoursSaveMessage = 'Munkaidő sikeresen frissítve.';
        this.workingHoursUpdateError = '';
        this.workingHoursUpdateInFlight.delete(day.key);
      },
      error: () => {
        this.workingHoursSaveMessage = '';
        this.workingHoursUpdateError = 'Hiba történt a munkaidő frissítése során.';
        this.workingHoursUpdateInFlight.delete(day.key);
      },
    });
  }

  private clearPendingUpdateTimers(): void {
    this.pendingUpdateTimers.forEach((timer) => clearTimeout(timer));
    this.pendingUpdateTimers.clear();
    this.workingHoursUpdateInFlight.clear();
  }

  private formatServerTime(value: string): string {
    return value && value.length === 5 ? `${value}:00` : value;
  }

  resetServices(): void {
    this.services = this.services.map((service) => ({
      ...service,
      enabled: true,
    }));
  }

  onServiceAvailabilityChange(service: StaffAssignableService): void {
    this.serviceSaveMessage = '';
    this.serviceUpdateError = '';
    this.scheduleServiceUpdate(service);
  }

  isServiceSaving(service: StaffAssignableService): boolean {
    const serviceId = service.companyServiceId;

    if (typeof serviceId !== 'number') {
      return false;
    }

    return this.serviceUpdateInFlight.has(serviceId);
  }

  formatPrice(price: number, currency: string): string {
    const symbol = currency === 'HUF' ? 'Ft' : currency;
    const formatted = Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    return `${formatted} ${symbol}`;
  }

  trackByDay(_: number, day: WorkingHourDay): string {
    return day.key;
  }

  trackByService(_: number, service: StaffAssignableService): string {
    return service.key;
  }

  private loadWorkingHours(): void {
    this.isLoadingWorkingHours = true;
    this.workingHoursLoadError = '';

    this.staffService.getStaffWorkingHours().subscribe({
      next: (data) => {
        this.workingHours = DEFAULT_WORKING_HOURS.map((defaultDay) => {
          const savedDay = data?.[defaultDay.key];

          return {
            key: defaultDay.key,
            label: defaultDay.label,
            enabled: savedDay ? savedDay.isAvailable : defaultDay.enabled,
            start: savedDay?.startTime ?? defaultDay.start,
            end: savedDay?.endTime ?? defaultDay.end,
          };
        });
        this.isLoadingWorkingHours = false;
      },
      error: () => {
        this.workingHours = [];
        this.workingHoursLoadError = 'Nem sikerült betölteni a munkaidő adatokat. Kérjük próbálja újra később.';
        this.isLoadingWorkingHours = false;
      },
    });
  }

  private loadServices(): void {
    this.isLoadingServices = true;
    this.serviceSaveMessage = '';
    this.serviceUpdateError = '';
    this.errorMessage = '';

    this.servicesService.getStaffServices().subscribe({
      next: (services: StaffServiceItem[]) => {
        this.services = services.map((service) => this.mapStaffService(service));
        this.isLoadingServices = false;
      },
      error: () => {
        this.errorMessage = 'Nem sikerült betölteni a szolgáltatásokat.';
        this.services = [];
        this.isLoadingServices = false;
      },
    });
  }

  private mapStaffService(service: StaffServiceItem): StaffAssignableService {
    return {
      key: `staff-service:${service.id}`,
      companyServiceId: service.id,
      name: service.name,
      category: service.categories || 'Egyéb',
      duration: `${service.durationMinutes} perc`,
      price: service.price,
      currency: service.currency || 'HUF',
      enabled: service.isAssigned,
    };
  }

  private scheduleServiceUpdate(service: StaffAssignableService): void {
    const existingTimer = this.pendingServiceUpdateTimers.get(service.key);

    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = window.setTimeout(() => {
      this.pendingServiceUpdateTimers.delete(service.key);
      this.sendServiceUpdate(service);
    }, 600);

    this.pendingServiceUpdateTimers.set(service.key, timer);
    this.serviceSaveMessage = 'Szolgáltatás mentése...';
  }

  private sendServiceUpdate(service: StaffAssignableService): void {
    const serviceId = service.companyServiceId;

    if (typeof serviceId !== 'number') {
      return;
    }

    const payload: UpdateStaffServiceAssignmentRequest = {
      serviceId,
      isAssigned: service.enabled,
    };

    this.serviceUpdateInFlight.add(serviceId);

    this.servicesService.updateStaffServiceAssignment(payload).subscribe({
      next: () => {
        this.serviceSaveMessage = 'Szolgáltatás sikeresen frissítve.';
        this.serviceUpdateError = '';
        this.serviceUpdateInFlight.delete(serviceId);
      },
      error: () => {
        service.enabled = !payload.isAssigned;
        this.serviceSaveMessage = '';
        this.serviceUpdateError = 'Hiba történt a szolgáltatás frissítése során.';
        this.serviceUpdateInFlight.delete(serviceId);
      },
    });
  }

  private clearPendingServiceUpdateTimers(): void {
    this.pendingServiceUpdateTimers.forEach((timer) => clearTimeout(timer));
    this.pendingServiceUpdateTimers.clear();
  }

  private cloneWorkingHours(source: WorkingHourDay[]): WorkingHourDay[] {
    return source.map((day) => ({ ...day }));
  }

  private normalizeWorkingDay(day: WorkingHourDay, changedField?: 'start' | 'end'): void {
    if (!day.enabled) {
      return;
    }

    if (day.end >= day.start) {
      return;
    }

    if (changedField === 'end') {
      day.start = day.end;
      return;
    }

    day.end = day.start;
  }
}