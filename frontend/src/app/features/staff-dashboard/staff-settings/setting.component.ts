import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ThemeMode, ThemeService } from '../../../core/services/theme.service';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
}

interface WorkingHourDay {
  key: string;
  label: string;
  enabled: boolean;
  start: string;
  end: string;
}

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

  notificationPreferences: NotificationPreference[] = [
    {
      id: 'new-booking',
      label: 'Új foglalás',
      description: 'Értesítés, ha új foglalás érkezik hozzád.',
      email: true,
      push: true,
    },
    {
      id: 'booking-change',
      label: 'Foglalás módosítás',
      description: 'Értesítés, ha módosítják az időpontot.',
      email: true,
      push: true,
    },
    {
      id: 'booking-cancel',
      label: 'Foglalás lemondás',
      description: 'Értesítés, ha egy időpont lemondásra kerül.',
      email: true,
      push: true,
    },
    {
      id: 'daily-summary',
      label: 'Napi összegzés',
      description: 'Napi lista a következő és lezárt foglalásokról.',
      email: false,
      push: true,
    },
  ];

  workingHours: WorkingHourDay[] = [
    { key: 'monday', label: 'Hétfő', enabled: true, start: '09:00', end: '17:00' },
    { key: 'tuesday', label: 'Kedd', enabled: true, start: '09:00', end: '17:00' },
    { key: 'wednesday', label: 'Szerda', enabled: true, start: '09:00', end: '17:00' },
    { key: 'thursday', label: 'Csütörtök', enabled: true, start: '09:00', end: '17:00' },
    { key: 'friday', label: 'Péntek', enabled: true, start: '09:00', end: '16:00' },
    { key: 'saturday', label: 'Szombat', enabled: false, start: '09:00', end: '13:00' },
    { key: 'sunday', label: 'Vasárnap', enabled: false, start: '09:00', end: '13:00' },
  ];
  workingHoursDraft: WorkingHourDay[] = [];

  isSavingNotificationPrefs = false;
  isSavingWorkingHours = false;
  notificationSaveMessage = '';
  workingHoursSaveMessage = '';

  private themeSubscription?: Subscription;
  private readonly notificationStorageKey = 'staffSettingNotificationPreferences';
  private readonly workingHoursStorageKey = 'staffSettingWorkingHours';

  constructor(private themeService: ThemeService) {}

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
      const parsed = JSON.parse(saved) as NotificationPreference[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.notificationPreferences = parsed;
      }
    } catch {
      // Keep defaults when local storage content is invalid.
    }
  }

  private loadWorkingHours(): void {
    const saved = localStorage.getItem(this.workingHoursStorageKey);

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as WorkingHourDay[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.workingHours = parsed;
      }
    } catch {
      // Keep defaults when local storage content is invalid.
    }

    this.workingHoursDraft = this.cloneWorkingHours(this.workingHours);
  }

  private cloneWorkingHours(source: WorkingHourDay[]): WorkingHourDay[] {
    return source.map((day) => ({ ...day }));
  }
}
