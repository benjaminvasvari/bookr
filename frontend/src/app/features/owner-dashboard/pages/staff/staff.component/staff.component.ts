import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  OwnerActualStaffMember,
  OwnerPendingStaffMember,
  OwnerUpcomingAppointment,
} from '../../../../../core/models/staff.model';
import { AuthService } from '../../../../../core/services/auth.service';
import { StaffService } from '../../../../../core/services/staff.service';

interface StaffInviteForm {
  email: string;
  role: string;
}

interface PendingInvite {
  id: number;
  email: string;
  role: string;
  sentAtLabel: string;
}

interface StaffCard {
  id: number;
  displayName: string;
  specialties: string;
  imageUrl: string | null;
  upcomingAppointments: OwnerUpcomingAppointment[];
}

@Component({
  selector: 'app-staff.component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.css',
})
export class StaffComponent implements OnInit {
  showInviteModal = false;
  isSendingInvite = false;
  inviteSent = false;
  emailTouched = false;
  roleTouched = false;

  inviteForm: StaffInviteForm = {
    email: '',
    role: '',
  };

  pendingInvites: PendingInvite[] = [];
  actualStaff: StaffCard[] = [];
  isLoadingStaff = false;
  loadError = '';
  inviteError = '';
  pendingActionError = '';
  lastInvitedPendingId: number | null = null;
  searchTerm = '';
  selectedRole = 'all';
  private deletingPendingIds = new Set<number>();

  constructor(
    private staffService: StaffService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadOwnerStaff();
  }

  get activeStaffCount(): number {
    return this.actualStaff.length;
  }

  get roleOptions(): string[] {
    const roleSet = new Set<string>();

    this.actualStaff.forEach((staff) => {
      const role = staff.specialties.trim();
      if (role) {
        roleSet.add(role);
      }
    });

    this.pendingInvites.forEach((invite) => {
      const role = invite.role.trim();
      if (role) {
        roleSet.add(role);
      }
    });

    return [...roleSet].sort((first, second) => first.localeCompare(second, 'hu'));
  }

  get hasActiveFilters(): boolean {
    return this.searchTerm.trim().length > 0 || this.selectedRole !== 'all';
  }

  get filteredPendingInvites(): PendingInvite[] {
    return this.pendingInvites.filter((invite) => {
      const matchesRole = this.selectedRole === 'all' || invite.role === this.selectedRole;
      const matchesSearch = this.matchesSearch(invite.email, invite.role);

      return matchesRole && matchesSearch;
    });
  }

  get filteredActualStaff(): StaffCard[] {
    return this.actualStaff.filter((staff) => {
      const matchesRole = this.selectedRole === 'all' || staff.specialties === this.selectedRole;
      const matchesSearch = this.matchesSearch(staff.displayName, staff.specialties);

      return matchesRole && matchesSearch;
    });
  }

  get isValidEmail(): boolean {
    const email = this.inviteForm.email.trim();
    return /^[^\s@]+@[^\s@]+\.(com|hu)$/i.test(email);
  }

  get canSubmitInvite(): boolean {
    return this.isValidEmail && !!this.inviteForm.role.trim() && !this.isSendingInvite;
  }

  openInviteModal(): void {
    this.resetInviteState();
    this.showInviteModal = true;
  }

  closeInviteModal(): void {
    if (this.isSendingInvite) {
      return;
    }

    this.showInviteModal = false;
  }

  submitInvite(): void {
    this.emailTouched = true;
    this.roleTouched = true;

    if (!this.canSubmitInvite) {
      return;
    }

    this.isSendingInvite = true;
    this.inviteError = '';

    const payload = {
      email: this.inviteForm.email.trim(),
      position: this.inviteForm.role.trim(),
    };

    this.staffService.invitePendingStaff(payload).subscribe({
      next: (response) => {
        const createdInvite = response?.result;
        if (createdInvite) {
          this.lastInvitedPendingId = createdInvite.id;
          this.pendingInvites = [
            {
              id: createdInvite.id,
              email: createdInvite.email,
              role: createdInvite.position,
              sentAtLabel: createdInvite.createdAt
                ? this.formatPendingCreatedAt(createdInvite.createdAt)
                : new Date().toLocaleString('hu-HU', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).replace(',', ''),
            },
            ...this.pendingInvites,
          ];
        }

        this.isSendingInvite = false;
        this.inviteSent = true;
        this.loadOwnerStaff();

        setTimeout(() => {
          this.showInviteModal = false;
          this.resetInviteState();
        }, 1600);
      },
      error: (error) => {
        this.isSendingInvite = false;
        this.inviteError = this.resolveInviteErrorMessage(error);
      },
    });
  }

  onEmailBlur(): void {
    this.emailTouched = true;
  }

  onRoleBlur(): void {
    this.roleTouched = true;
  }

  getInviteInitials(email: string): string {
    const localPart = email.split('@')[0]?.trim() ?? '';
    if (!localPart) {
      return 'PD';
    }

    const chunks = localPart
      .split(/[._-]+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (chunks.length >= 2) {
      return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase();
    }

    return localPart.slice(0, 2).toUpperCase();
  }

  trackByPendingInvite(_: number, invite: PendingInvite): number {
    return invite.id;
  }

  trackByStaff(_: number, staff: StaffCard): number {
    return staff.id;
  }

  getStaffInitials(staff: StaffCard): string {
    const fullName = `${staff.displayName}`.trim();

    if (!fullName) {
      return 'ST';
    }

    const parts = fullName
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return fullName.slice(0, 2).toUpperCase();
  }

  getAppointmentTimeLabel(appointment: OwnerUpcomingAppointment): string {
    const normalized = this.normalizeOwnerUpcomingAppointment(appointment);

    if (normalized.time) {
      return normalized.time;
    }

    if (!normalized.date) {
      return '-';
    }

    const parsed = new Date(normalized.date);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }

    return parsed.toLocaleTimeString('hu-HU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isStaffCurrentlyBusy(staff: StaffCard): boolean {
    return this.isBusyNow(staff.upcomingAppointments);
  }

  getStaffStatusLabel(staff: StaffCard): string {
    return this.isStaffCurrentlyBusy(staff) ? 'Foglalt' : 'Elérhető';
  }

  retryLoad(): void {
    this.loadOwnerStaff();
  }

  removePendingInvite(invite: PendingInvite): void {
    if (this.deletingPendingIds.has(invite.id)) {
      return;
    }

    this.pendingActionError = '';
    this.deletingPendingIds.add(invite.id);

    this.staffService.deletePendingStaff(invite.id).subscribe({
      next: () => {
        this.pendingInvites = this.pendingInvites.filter((item) => item.id !== invite.id);
        this.deletingPendingIds.delete(invite.id);
      },
      error: (error) => {
        this.deletingPendingIds.delete(invite.id);
        const statusCode = (error as { error?: { statusCode?: number } })?.error?.statusCode;
        this.pendingActionError = statusCode === 404
          ? 'A pending meghívó már nem található.'
          : 'A pending meghívó törlése sikertelen. Próbáld újra.';
      },
    });
  }

  isPendingDeleting(id: number): boolean {
    return this.deletingPendingIds.has(id);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRole = 'all';
  }

  private loadOwnerStaff(): void {
    const currentUser = this.authService.getCurrentUser();
    const companyId = currentUser?.companyId ?? null;

    if (!companyId) {
      this.loadError = 'Nem található companyId a felhasználónál.';
      this.actualStaff = [];
      this.pendingInvites = [];
      return;
    }

    this.isLoadingStaff = true;
    this.loadError = '';

    this.staffService.getAllStaffForOwnerWithAppointments(companyId).subscribe({
      next: (response) => {
        const result = response?.result;
        const pending = result?.pendingStaff ?? [];
        const actual = result?.actualStaff ?? [];

        this.pendingInvites = pending.map((item) => this.mapPendingInvite(item));
        this.actualStaff = actual.map((item) => this.mapActualStaff(item));
        this.isLoadingStaff = false;
      },
      error: () => {
        this.loadError = 'Nem sikerült betölteni a dolgozókat. Próbáld újra.';
        this.actualStaff = [];
        this.pendingInvites = [];
        this.isLoadingStaff = false;
      },
    });
  }

  private mapPendingInvite(item: OwnerPendingStaffMember): PendingInvite {
    return {
      id: item.id,
      email: item.email,
      role: item.position || 'Meghívott dolgozó',
      sentAtLabel: this.formatPendingCreatedAt(item.createdAt),
    };
  }

  private mapActualStaff(item: OwnerActualStaffMember): StaffCard {
    const appointments = (item.upcomingAppointments ?? []).map((appointment) =>
      this.normalizeOwnerUpcomingAppointment(appointment)
    );

    return {
      id: item.id,
      displayName: item.displayName || `${item.firstName} ${item.lastName}`.trim(),
      specialties: item.specialties || 'Nincs megadva',
      imageUrl: item.imageUrl,
      upcomingAppointments: appointments,
    };
  }

  private normalizeOwnerUpcomingAppointment(
    appointment: OwnerUpcomingAppointment
  ): OwnerUpcomingAppointment {
    const source = appointment as unknown as Record<string, unknown>;
    const rawDate = this.getStringValue(source, ['date', 'appointmentDate', 'startDate']);
    const rawTime = this.getStringValue(source, ['time', 'appointmentTime']);
    const rawStartTime = this.getStringValue(source, [
      'startTime',
      'appointmentStartTime',
      'start',
      'startsAt',
      'appointmentStart',
    ]);

    let date = (rawDate || appointment.date || '').trim();
    let time = (rawTime || appointment.time || '').trim();

    if (rawStartTime) {
      const extracted = this.extractDateAndTime(rawStartTime);
      if (!date) {
        date = extracted.date;
      }
      if (!time) {
        time = extracted.time;
      }
    }

    if ((!date || !time) && rawDate) {
      const extracted = this.extractDateAndTime(rawDate);
      if (!date) {
        date = extracted.date;
      }
      if (!time) {
        time = extracted.time;
      }
    }

    if (!date && time) {
      date = this.getTodayDateString();
    }

    return {
      ...appointment,
      date: date || appointment.date,
      time: time || appointment.time,
      serviceName:
        appointment.serviceName ||
        this.getStringValue(source, ['serviceName', 'service', 'serviceNames']) ||
        appointment.serviceName,
      clientName:
        appointment.clientName ||
        this.getStringValue(source, ['clientName', 'customerName', 'userName']) ||
        appointment.clientName,
    };
  }

  private isBusyNow(appointments: OwnerUpcomingAppointment[]): boolean {
    if (!appointments.length) {
      return false;
    }

    const now = new Date();

    return appointments.some((appointment) => {
      const start = this.resolveAppointmentStart(appointment);
      if (!start) {
        return false;
      }

      const end = this.resolveAppointmentEnd(start, appointment);
      return now >= start && now < end;
    });
  }

  private resolveAppointmentStart(appointment: OwnerUpcomingAppointment): Date | null {
    const normalized = this.normalizeOwnerUpcomingAppointment(appointment);
    if (!normalized?.date) {
      return null;
    }

    const dateValue = normalized.date.trim();
    const timeValue = normalized.time?.trim();

    if (timeValue) {
      const parsed = new Date(`${dateValue}T${timeValue}`);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    const directParsed = new Date(dateValue);
    return Number.isNaN(directParsed.getTime()) ? null : directParsed;
  }

  private extractDateAndTime(value: string): { date: string; time: string } {
    const normalized = value.trim();

    if (!normalized) {
      return { date: '', time: '' };
    }

    const timeOnlyMatch = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (timeOnlyMatch) {
      const hour = timeOnlyMatch[1].padStart(2, '0');
      const minute = timeOnlyMatch[2];
      return {
        date: '',
        time: `${hour}:${minute}`,
      };
    }

    const dateTimeMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})/);
    if (dateTimeMatch) {
      return {
        date: dateTimeMatch[1],
        time: dateTimeMatch[2],
      };
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return { date: '', time: '' };
    }

    const date = parsed.toISOString().slice(0, 10);
    const time = parsed.toTimeString().slice(0, 5);
    return { date, time };
  }

  private getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getStringValue(source: Record<string, unknown>, keys: string[]): string {
    const sourceEntries = Object.entries(source);

    for (const key of keys) {
      const normalizedKey = key.toLowerCase();
      const matchedEntry = sourceEntries.find(([sourceKey]) => sourceKey.toLowerCase() === normalizedKey);
      if (!matchedEntry) {
        continue;
      }

      const value = matchedEntry[1];
      const stringValue = this.toNonEmptyString(value);
      if (stringValue) {
        return stringValue;
      }
    }

    return '';
  }

  private toNonEmptyString(value: unknown): string {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      const asDate = new Date(value);
      if (!Number.isNaN(asDate.getTime())) {
        return asDate.toISOString();
      }

      return String(value);
    }

    return '';
  }

  private resolveAppointmentEnd(start: Date, appointment: OwnerUpcomingAppointment): Date {
    const appointmentAsRecord = appointment as unknown as Record<string, unknown>;
    const durationValue = appointmentAsRecord['durationMinutes'];
    const durationMinutes = typeof durationValue === 'number' && durationValue > 0 ? durationValue : 60;

    return new Date(start.getTime() + durationMinutes * 60 * 1000);
  }

  private formatPendingCreatedAt(value: string): string {
    const parsed = this.parsePendingCreatedAt(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(',', '');
  }

  private matchesSearch(...values: Array<string | undefined>): boolean {
    const search = this.searchTerm.trim().toLocaleLowerCase('hu');

    if (!search) {
      return true;
    }

    return values.some((value) => (value || '').toLocaleLowerCase('hu').includes(search));
  }

  private parsePendingCreatedAt(value: string): Date {
    const directParsed = new Date(value);
    if (!Number.isNaN(directParsed.getTime())) {
      return directParsed;
    }

    const match = value.match(/^\w{3}\s+(\w{3})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\s+\w+\s+(\d{4})$/);
    if (!match) {
      return new Date('invalid');
    }

    const [, monthName, day, hours, minutes, seconds, year] = match;
    const monthIndexMap: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    const monthIndex = monthIndexMap[monthName];
    if (monthIndex === undefined) {
      return new Date('invalid');
    }

    return new Date(
      Number(year),
      monthIndex,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds),
    );
  }

  private resetInviteState(): void {
    this.isSendingInvite = false;
    this.inviteSent = false;
    this.inviteError = '';
    this.lastInvitedPendingId = null;
    this.emailTouched = false;
    this.roleTouched = false;
    this.inviteForm = {
      email: '',
      role: '',
    };
  }

  private resolveInviteErrorMessage(error: unknown): string {
    const errorPayload = (error as { error?: { message?: string; status?: string; statusCode?: number } })?.error;

    if (errorPayload?.message) {
      return errorPayload.message;
    }

    if (errorPayload?.statusCode === 409) {
      return 'Ehhez az email címhez már tartozik meghívó.';
    }

    return 'A meghívó küldése sikertelen. Próbáld újra.';
  }

}
