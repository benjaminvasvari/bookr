import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ThemeMode, ThemeService } from '../../../core/services/theme.service';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

type SavedNotificationPreference = Partial<NotificationPreference> & {
  email?: boolean;
};

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreference[] = [
  {
    id: 'new-booking',
    label: 'Új foglalás',
    description: 'Értesítés, ha új foglalás érkezik hozzád.',
    enabled: true,
  },
  {
    id: 'booking-change',
    label: 'Foglalás módosítás',
    description: 'Értesítés, ha módosítják az időpontot.',
    enabled: true,
  },
  {
    id: 'booking-cancel',
    label: 'Foglalás lemondás',
    description: 'Értesítés, ha egy időpont lemondásra kerül.',
    enabled: true,
  },
  {
    id: 'daily-summary',
    label: 'Napi összegzés',
    description: 'Napi lista a következő és lezárt foglalásokról.',
    enabled: false,
  },
];

interface WorkingHourDay {
  key: string;
  label: string;
  enabled: boolean;
  start: string;
  end: string;
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
  selector: 'app-staff-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.css',
})
export class StaffSettingsComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  followSystemTheme = false;
  isEditingWorkingHours = false;

  notificationPreferences: NotificationPreference[] = DEFAULT_NOTIFICATION_PREFERENCES.map((item) => ({ ...item }));

  workingHours: WorkingHourDay[] = DEFAULT_WORKING_HOURS.map((day) => ({ ...day }));
  workingHoursDraft: WorkingHourDay[] = DEFAULT_WORKING_HOURS.map((day) => ({ ...day }));

  isSavingNotificationPrefs = false;
  isSavingWorkingHours = false;
  notificationSaveMessage = '';
  workingHoursSaveMessage = '';

  private themeSubscription?: Subscription;
  private readonly notificationStorageKey = 'staffSettingNotificationPreferences';
  private readonly workingHoursStorageKey = 'staffSettingWorkingHours';

  constructor(private themeService: ThemeService) {}

  get enabledNotificationCount(): number {
    return this.notificationPreferences.filter((item) => item.enabled).length;
  }

  get enabledWorkingDaysCount(): number {
    const source = this.isEditingWorkingHours ? this.workingHoursDraft : this.workingHours;
    return source.filter((day) => day.enabled).length;
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.isDarkMode$.subscribe((isDarkMode) => {
      this.isDarkMode = isDarkMode;
    });

    this.themeSubscription.add(
      this.themeService.themeMode$.subscribe((mode: ThemeMode) => {
        this.followSystemTheme = mode === 'system';
      })
    );

    this.loadNotificationPreferences();
    this.loadWorkingHours();
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  onDarkModeChange(): void {
    if (this.followSystemTheme) {
      return;
    }

    this.themeService.setDarkMode(this.isDarkMode);
  }

  onFollowSystemThemeChange(): void {
    if (this.followSystemTheme) {
      this.themeService.setThemeMode('system');
      return;
    }

    this.themeService.setDarkMode(this.isDarkMode);
  }

  saveNotificationPreferences(): void {
    this.isSavingNotificationPrefs = true;
    this.notificationSaveMessage = '';

    setTimeout(() => {
      localStorage.setItem(this.notificationStorageKey, JSON.stringify(this.notificationPreferences));
      this.isSavingNotificationPrefs = false;
      this.notificationSaveMessage = 'Értesítési beállítások elmentve.';
    }, 350);
  }

  saveWorkingHours(): void {
    if (!this.isEditingWorkingHours) {
      return;
    }

    this.isSavingWorkingHours = true;
    this.workingHoursSaveMessage = '';

    const normalizedHours = this.workingHoursDraft.map((day) => {
      if (!day.enabled) {
        return day;
      }

      if (day.end <= day.start) {
        return {
          ...day,
          end: day.start,
        };
      }

      return day;
    });

    setTimeout(() => {
      this.workingHours = normalizedHours;
      this.workingHoursDraft = this.cloneWorkingHours(normalizedHours);
      this.isEditingWorkingHours = false;
      localStorage.setItem(this.workingHoursStorageKey, JSON.stringify(this.workingHours));
      this.isSavingWorkingHours = false;
      this.workingHoursSaveMessage = 'Munkaidő beállítások elmentve.';
    }, 350);
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

  onWorkingDayAvailabilityChange(day: WorkingHourDay): void {
    this.workingHoursSaveMessage = '';

    this.normalizeWorkingDay(day);

    if (this.isEditingWorkingHours) {
      return;
    }

    this.workingHoursDraft = this.cloneWorkingHours(this.workingHours);
    localStorage.setItem(this.workingHoursStorageKey, JSON.stringify(this.workingHours));
  }

  onWorkingHoursTimeChange(day: WorkingHourDay, field: 'start' | 'end', value: string): void {
    this.workingHoursSaveMessage = '';
    day[field] = value;

    this.normalizeWorkingDay(day, field);

    if (this.isEditingWorkingHours) {
      return;
    }

    this.workingHoursDraft = this.cloneWorkingHours(this.workingHours);
    localStorage.setItem(this.workingHoursStorageKey, JSON.stringify(this.workingHours));
  }

  trackByNotification(_: number, item: NotificationPreference): string {
    return item.id;
  }

  trackByDay(_: number, day: WorkingHourDay): string {
    return day.key;
  }

  private loadNotificationPreferences(): void {
    const saved = localStorage.getItem(this.notificationStorageKey);

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as SavedNotificationPreference[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const savedById = new Map<string, SavedNotificationPreference>();

        for (const item of parsed) {
          if (item && typeof item === 'object' && typeof item.id === 'string') {
            savedById.set(item.id, item);
          }
        }

        this.notificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES.map((item) => {
          const savedItem = savedById.get(item.id);
          const enabled = typeof savedItem?.enabled === 'boolean'
            ? savedItem.enabled
            : typeof savedItem?.email === 'boolean'
              ? savedItem.email
              : item.enabled;

          return {
            ...item,
            enabled,
          };
        });
      }
    } catch {
      // Keep defaults when local storage content is invalid.
    }
  }

  private loadWorkingHours(): void {
    const saved = localStorage.getItem(this.workingHoursStorageKey);

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
      // Keep defaults when local storage content is invalid.
    }

    this.workingHoursDraft = this.cloneWorkingHours(this.workingHours);
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
