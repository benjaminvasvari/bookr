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

  notificationPreferences: NotificationPreference[] = DEFAULT_NOTIFICATION_PREFERENCES.map((item) => ({ ...item }));

  isSavingNotificationPrefs = false;
  notificationSaveMessage = '';

  private themeSubscription?: Subscription;
  private readonly notificationStorageKey = 'staffSettingNotificationPreferences';

  constructor(private themeService: ThemeService) {}

  get enabledNotificationCount(): number {
    return this.notificationPreferences.filter((item) => item.enabled).length;
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

  trackByNotification(_: number, item: NotificationPreference): string {
    return item.id;
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

}
