import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { CompaniesService } from '../../../core/services/companies.service';
import { Service, ServiceCategory } from '../../../core/models/service.model';

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
  source: 'company' | 'custom';
}

interface StaffAssignableServiceGroup {
  category: string;
  services: StaffAssignableService[];
}

interface NewStaffServiceDraft {
  name: string;
  category: string;
  duration: string;
  price: number | null;
  currency: string;
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
export class StaffWorkSettingsComponent implements OnInit {
  workingHours: WorkingHourDay[] = this.cloneWorkingHours(DEFAULT_WORKING_HOURS);
  workingHoursDraft: WorkingHourDay[] = this.cloneWorkingHours(DEFAULT_WORKING_HOURS);
  services: StaffAssignableService[] = [];
  newServiceDraft: NewStaffServiceDraft = this.createEmptyServiceDraft();

  isEditingWorkingHours = false;
  isSavingWorkingHours = false;
  isLoadingServices = false;
  isAddingService = false;

  workingHoursSaveMessage = '';
  errorMessage = '';
  newServiceErrorMessage = '';

  private companyId: number | null = null;
  private staffUserId: number | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly companiesService: CompaniesService,
  ) {}

  get enabledWorkingDaysCount(): number {
    const source = this.isEditingWorkingHours ? this.workingHoursDraft : this.workingHours;
    return source.filter((day) => day.enabled).length;
  }

  get selectedServicesCount(): number {
    return this.services.filter((service) => service.enabled).length;
  }

  get totalServicesCount(): number {
    return this.services.length;
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

  startWorkingHoursEdit(): void {
    this.isEditingWorkingHours = true;
    this.workingHoursSaveMessage = '';
    this.workingHoursDraft = this.cloneWorkingHours(this.workingHours);
  }

  cancelWorkingHoursEdit(): void {
    this.isEditingWorkingHours = false;
    this.isSavingWorkingHours = false;
    this.workingHoursSaveMessage = '';
    this.workingHoursDraft = this.cloneWorkingHours(this.workingHours);
  }

  saveWorkingHours(): void {
    if (!this.isEditingWorkingHours) {
      return;
    }

    this.isSavingWorkingHours = true;
    this.workingHoursSaveMessage = '';

    const normalizedHours = this.workingHoursDraft.map((day) => {
      if (!day.enabled) {
        return { ...day };
      }

      if (day.end <= day.start) {
        return {
          ...day,
          end: day.start,
        };
      }

      return { ...day };
    });

    setTimeout(() => {
      this.workingHours = normalizedHours;
      this.workingHoursDraft = this.cloneWorkingHours(normalizedHours);
      this.isEditingWorkingHours = false;
      localStorage.setItem(this.getWorkingHoursStorageKey(), JSON.stringify(this.workingHours));
      this.isSavingWorkingHours = false;
      this.workingHoursSaveMessage = 'Munkaidő beállítások elmentve.';
    }, 300);
  }

  onWorkingDayAvailabilityChange(day: WorkingHourDay): void {
    this.workingHoursSaveMessage = '';
    this.normalizeWorkingDay(day);
  }

  onWorkingHoursTimeChange(day: WorkingHourDay, field: 'start' | 'end', value: string): void {
    this.workingHoursSaveMessage = '';
    day[field] = value;
    this.normalizeWorkingDay(day, field);
  }

  resetServices(): void {
    this.services = this.services.map((service) => ({
      ...service,
      enabled: true,
    }));
    this.persistServices();
  }

  startAddService(): void {
    this.isAddingService = true;
    this.newServiceErrorMessage = '';
    this.newServiceDraft = this.createEmptyServiceDraft();
  }

  cancelAddService(): void {
    this.isAddingService = false;
    this.newServiceErrorMessage = '';
    this.newServiceDraft = this.createEmptyServiceDraft();
  }

  addCustomService(): void {
    const name = this.newServiceDraft.name.trim();
    const category = this.newServiceDraft.category.trim();
    const duration = this.newServiceDraft.duration.trim();
    const price = this.newServiceDraft.price;

    if (!name || !category || !duration || price === null || price < 0) {
      this.newServiceErrorMessage = 'Add meg a szolgáltatás nevét, kategóriáját, időtartamát és árát.';
      return;
    }

    this.services = [
      {
        key: `custom:${Date.now()}`,
        companyServiceId: null,
        name,
        category,
        duration,
        price,
        currency: this.newServiceDraft.currency || 'HUF',
        enabled: true,
        source: 'custom',
      },
      ...this.services,
    ];

    this.isAddingService = false;
    this.newServiceErrorMessage = '';
    this.newServiceDraft = this.createEmptyServiceDraft();
    this.persistServices();
  }

  onServiceAvailabilityChange(): void {
    this.persistServices();
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
    const saved = localStorage.getItem(this.getWorkingHoursStorageKey());

    if (!saved) {
      this.workingHoursDraft = this.cloneWorkingHours(this.workingHours);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as WorkingHourDay[];

      if (Array.isArray(parsed) && parsed.length > 0) {
        const savedByKey = new Map(parsed.map((day) => [day.key, day]));

        this.workingHours = DEFAULT_WORKING_HOURS.map((defaultDay) => {
          const savedDay = savedByKey.get(defaultDay.key);

          if (!savedDay) {
            return { ...defaultDay };
          }

          return {
            key: defaultDay.key,
            label: defaultDay.label,
            enabled: typeof savedDay.enabled === 'boolean' ? savedDay.enabled : defaultDay.enabled,
            start: typeof savedDay.start === 'string' && savedDay.start ? savedDay.start : defaultDay.start,
            end: typeof savedDay.end === 'string' && savedDay.end ? savedDay.end : defaultDay.end,
          };
        });
      }
    } catch {
      this.workingHours = this.cloneWorkingHours(DEFAULT_WORKING_HOURS);
    }

    this.workingHoursDraft = this.cloneWorkingHours(this.workingHours);
  }

  private loadServices(): void {
    if (!this.companyId) {
      return;
    }

    this.isLoadingServices = true;
    this.errorMessage = '';

    this.companiesService.getServiceCategoriesWithServices(this.companyId).subscribe({
      next: (categories: ServiceCategory[]) => {
        const savedServiceConfigs = this.getSavedServiceConfigs();
        const savedCompanyServicesById = new Map(
          savedServiceConfigs
            .filter((service) => service.source === 'company' && typeof service.companyServiceId === 'number')
            .map((service) => [service.companyServiceId as number, service])
        );

        const companyServices = categories.flatMap((category) =>
          (category.services || []).map((service) =>
            this.mapCompanyService(category.name, service, savedCompanyServicesById.get(service.id))
          )
        );

        const customServices = savedServiceConfigs.filter((service) => service.source === 'custom');

        this.services = [...customServices, ...companyServices];

        this.isLoadingServices = false;
      },
      error: () => {
        this.errorMessage = 'Nem sikerült betölteni a szolgáltatásokat.';
        this.services = [];
        this.isLoadingServices = false;
      },
    });
  }

  private mapCompanyService(
    categoryName: string,
    service: Service,
    savedService: StaffAssignableService | undefined,
  ): StaffAssignableService {
    return {
      key: `company:${service.id}`,
      companyServiceId: service.id,
      name: service.name,
      category: categoryName,
      duration: service.duration,
      price: service.price,
      currency: service.currency || 'HUF',
      enabled: savedService ? savedService.enabled : true,
      source: 'company',
    };
  }

  private getSavedServiceConfigs(): StaffAssignableService[] {
    const saved = localStorage.getItem(this.getServicesStorageKey());

    if (!saved) {
      return [];
    }

    try {
      const parsed = JSON.parse(saved) as StaffAssignableService[];

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(
        (service) =>
          typeof service?.key === 'string' &&
          typeof service?.name === 'string' &&
          typeof service?.category === 'string' &&
          typeof service?.duration === 'string' &&
          typeof service?.price === 'number' &&
          typeof service?.currency === 'string' &&
          typeof service?.enabled === 'boolean' &&
          (service?.source === 'company' || service?.source === 'custom')
      );
    } catch {
      return [];
    }
  }

  private createEmptyServiceDraft(): NewStaffServiceDraft {
    return {
      name: '',
      category: '',
      duration: '30 perc',
      price: null,
      currency: 'HUF',
    };
  }

  private getWorkingHoursStorageKey(): string {
    return `staffWorkSettingsWorkingHours:${this.staffUserId}:${this.companyId}`;
  }

  private getServicesStorageKey(): string {
    return `staffWorkSettingsServices:${this.staffUserId}:${this.companyId}`;
  }

  private persistServices(): void {
    if (!this.companyId || !this.staffUserId) {
      return;
    }

    localStorage.setItem(this.getServicesStorageKey(), JSON.stringify(this.services));
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