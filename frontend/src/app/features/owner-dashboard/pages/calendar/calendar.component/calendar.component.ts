import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../core/services/auth.service';
import { CompaniesService } from '../../../../../core/services/companies.service';
import { OwnerDashboardService } from '../../../../../core/services/owner-dashboard.service';
import { StaffService } from '../../../../../core/services/staff.service';
import { OpeningHours } from '../../../../../core/models/opening-hours.model';
import { User } from '../../../../../core/models';
import { StaffChipComponent } from './staff-chip.component';

interface TimeSlot {
  time: string;
  hour: number;
}

interface CalendarAppointment {
  id: number;
  staffId: number;
  staffName: string;
  title: string;
  clientName: string;
  dayIndex: number; // 0 = Monday, 6 = Sunday
  startTime: string;
  duration: number; // minutes
  color: string;
  phone?: string;
  service?: string;
  price?: number;
  status?: string;
  notes?: string;
}

interface StaffMember {
  id: number;
  name: string;
  color: string;
}

interface WeekDay {
  name: string;
  shortName: string; // Egybetűs/kétbetűs rövidítés (H, K, Sze, Cs, P, Szo, V)
  date: string;
  dayIndex: number;
  dayNumber: number;
  fullDate: Date;
  openingHours: string;
  isClosed: boolean;
  isToday: boolean;
}

interface WeeklyCalendarResponse {
  data?: WeeklyCalendarDay[];
  status?: string;
  statusCode?: number;
}

interface WeeklyCalendarDay {
  date: string;
  staffAppointments: WeeklyCalendarStaffAppointments[];
}

interface WeeklyCalendarStaffAppointments {
  appointments: WeeklyCalendarAppointment[];
  staffColor: string | null;
  staffName: string;
  staffId: number;
}

interface WeeklyCalendarAppointment {
  durationMinutes: number;
  notes: string | null;
  clientName: string;
  clientEmail: string;
  price: number;
  startTime: string;
  currency: string;
  id: number;
  endTime: string;
  serviceName: string;
  clientPhone: string;
  status: string;
}

@Component({
  selector: 'app-calendar.component',
  standalone: true,
  imports: [CommonModule, FormsModule, StaffChipComponent],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
})
export class CalendarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private companiesService = inject(CompaniesService);
  private ownerDashboardService = inject(OwnerDashboardService);
  private staffService = inject(StaffService);
  private readonly generatedColorPalette: string[] = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#d946ef', '#ec4899'
  ];
  private readonly colorPersistDebounceMs = 700;
  private currentUserCompanyId: number | null = null;
  private pendingColorPersistTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private pendingStaffColors = new Map<number, string>();
  private lastPersistedStaffColors = new Map<number, string>();
  
  selectedStaffIds: number[] = []; // Empty = show all
  selectedAppointment: CalendarAppointment | null = null;
  currentTimePosition: number = 0;
  currentTimeInterval: any;
  currentWeekStart: Date = this.getMonday(new Date());
  calendarStartHour: number = 8;
  calendarEndHour: number = 19;
  currentMobileDayIndex: number = 1; // Start with today (Tuesday = index 1)
  mobileSelectedStaffId: number = 0;
  isMobileView: boolean = false;
  companyOpeningHours: OpeningHours | null = null;
  
  // Focused day state (max 2 open day columns)
  focusedDayIndices: number[] = [];

  @HostListener('window:resize')
  onResize() {
    this.isMobileView = window.innerWidth <= 480;
    this.syncMobileSelectedStaffSelection();
  }

  staffColors: { [key: number]: string } = {};

  weekDays: WeekDay[] = [];

  timeSlots: TimeSlot[] = this.buildTimeSlots(this.calendarStartHour, this.calendarEndHour);

  staffMembers: StaffMember[] = [
    { id: 0, name: 'Összes szakember', color: '#64748b' }
  ];

  allAppointments: CalendarAppointment[] = [];

  ngOnInit(): void {
    this.isMobileView = window.innerWidth <= 480;
    this.loadCompanyData();
    this.updateWeekDays();
    this.loadWeeklyAppointments();
    this.updateCurrentTimePosition();
    this.currentTimeInterval = setInterval(() => {
      this.updateCurrentTimePosition();
    }, 60000);
  }

  loadCompanyData(): void {
    const user: User | null = this.authService.getCurrentUser();
    this.currentUserCompanyId = user?.companyId ?? null;

    this.companiesService.getOwnerPanelOpeningHours().subscribe({
      next: (openingHours: OpeningHours) => {
        this.companyOpeningHours = openingHours || null;
        this.updateWeekDays();
      },
      error: (err: unknown) => {
        console.error('Failed to load owner panel opening hours:', err);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.currentTimeInterval) {
      clearInterval(this.currentTimeInterval);
    }

    this.pendingColorPersistTimers.forEach((timer) => clearTimeout(timer));
    this.pendingColorPersistTimers.clear();
    this.pendingStaffColors.clear();
  }

  getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  updateWeekDays(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
    const dayShortNames = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
    const dayKeys: (keyof OpeningHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const months = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];

    this.weekDays = [];
    let todayIndex: number | null = null;

    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const isToday = date.getTime() === today.getTime();
      if (isToday) {
        todayIndex = i;
      }

      const dayOpeningHoursRaw = this.companyOpeningHours?.[dayKeys[i]];
      const normalizedDayOpeningHours = this.normalizeDayOpeningHours(dayOpeningHoursRaw);
      const isDayClosed = this.isClosedFromOpeningHours(normalizedDayOpeningHours, i);
      const openingHours = isDayClosed ? '' : this.formatOpeningHours(normalizedDayOpeningHours);

      this.weekDays.push({
        name: days[i],
        shortName: dayShortNames[i],
        date: `${date.getFullYear()}. ${months[date.getMonth()]} ${date.getDate()}.`,
        dayIndex: i,
        dayNumber: date.getDate(),
        fullDate: date,
        openingHours,
        isClosed: isDayClosed,
        isToday,
      });
    }

    this.setDefaultFocusedDay(todayIndex);
    this.setDefaultMobileDay(todayIndex);
    this.updateTimeRangeFromOpeningHours();
    this.updateCurrentTimePosition();
  }

  private setDefaultFocusedDay(todayIndex: number | null): void {
    if (todayIndex !== null && !this.weekDays[todayIndex]?.isClosed) {
      this.focusedDayIndices = [todayIndex];
      return;
    }

    const firstOpenDay = this.weekDays.findIndex(day => !day.isClosed);
    this.focusedDayIndices = firstOpenDay !== -1 ? [firstOpenDay] : [];
  }

  private setDefaultMobileDay(todayIndex: number | null): void {
    if (todayIndex !== null && !this.weekDays[todayIndex]?.isClosed) {
      this.currentMobileDayIndex = todayIndex;
      if (this.isMobileView) {
        this.focusedDayIndices = [todayIndex];
      }
      return;
    }

    const firstOpenDay = this.weekDays.findIndex(day => !day.isClosed);
    this.currentMobileDayIndex = firstOpenDay !== -1 ? firstOpenDay : 0;

    if (this.isMobileView && this.weekDays[this.currentMobileDayIndex] && !this.weekDays[this.currentMobileDayIndex].isClosed) {
      this.focusedDayIndices = [this.currentMobileDayIndex];
    }
  }

  private normalizeDayOpeningHours(dayOpeningHours: string | undefined): string {
    if (!dayOpeningHours) {
      return '';
    }

    return dayOpeningHours.trim();
  }

  private isClosedFromOpeningHours(dayOpeningHours: string, dayIndex: number): boolean {
    if (!dayOpeningHours) {
      return dayIndex === 5 || dayIndex === 6;
    }

    return dayOpeningHours.toLocaleLowerCase('hu').includes('zárva');
  }

  private formatOpeningHours(dayOpeningHours: string): string {
    if (!dayOpeningHours) {
      return '';
    }

    return dayOpeningHours.replace(/\s*-\s*/g, '–');
  }

  private updateTimeRangeFromOpeningHours(): void {
    const dayValues = Object.values(this.companyOpeningHours ?? {});
    const parsedRanges = dayValues
      .map((value) => this.parseOpeningRange(this.normalizeDayOpeningHours(value)))
      .filter((range): range is { startMinutes: number; endMinutes: number } => range !== null);

    if (parsedRanges.length === 0) {
      this.calendarStartHour = 8;
      this.calendarEndHour = 19;
      this.timeSlots = this.buildTimeSlots(this.calendarStartHour, this.calendarEndHour);
      return;
    }

    const earliestStartMinutes = Math.min(...parsedRanges.map((range) => range.startMinutes));
    const latestEndMinutes = Math.max(...parsedRanges.map((range) => range.endMinutes));

    this.calendarStartHour = Math.floor(earliestStartMinutes / 60);
    this.calendarEndHour = Math.max(this.calendarStartHour + 1, Math.ceil(latestEndMinutes / 60));
    this.timeSlots = this.buildTimeSlots(this.calendarStartHour, this.calendarEndHour);
  }

  private parseOpeningRange(dayOpeningHours: string): { startMinutes: number; endMinutes: number } | null {
    if (!dayOpeningHours || dayOpeningHours.toLocaleLowerCase('hu').includes('zárva')) {
      return null;
    }

    const match = dayOpeningHours.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
    if (!match) {
      return null;
    }

    const startMinutes = this.parseTimeToMinutes(match[1]);
    const endMinutes = this.parseTimeToMinutes(match[2]);

    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return null;
    }

    return { startMinutes, endMinutes };
  }

  private buildTimeSlots(startHour: number, endHour: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour,
      });
    }
    return slots;
  }

  get gridTimeSlots(): TimeSlot[] {
    return this.timeSlots.length > 1 ? this.timeSlots.slice(0, -1) : this.timeSlots;
  }

  private parseTimeToMinutes(time: string): number | null {
    const parts = time.split(':').map(Number);
    if (parts.length !== 2 || parts.some((value) => Number.isNaN(value))) {
      return null;
    }

    const [hours, minutes] = parts;
    return (hours * 60) + minutes;
  }

  private minutesFromCalendarStart(time: string): number {
    const totalMinutes = this.parseTimeToMinutes(time);
    if (totalMinutes === null) {
      return 0;
    }

    return totalMinutes - (this.calendarStartHour * 60);
  }

  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.updateWeekDays();
    this.loadWeeklyAppointments();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.updateWeekDays();
    this.loadWeeklyAppointments();
  }

  goToToday(): void {
    this.currentWeekStart = this.getMonday(new Date());
    this.updateWeekDays();
    this.loadWeeklyAppointments();
  }

  canGoToPreviousMobileWeek(): boolean {
    const thisWeekMonday = this.getMonday(new Date());
    return this.currentWeekStart.getTime() > thisWeekMonday.getTime();
  }

  previousMobileWeek(): void {
    if (!this.canGoToPreviousMobileWeek()) {
      return;
    }

    this.currentWeekStart = new Date(this.currentWeekStart);
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.updateWeekDays();
    this.loadWeeklyAppointments();
  }

  nextMobileWeek(): void {
    this.currentWeekStart = new Date(this.currentWeekStart);
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.updateWeekDays();
    this.loadWeeklyAppointments();
  }

  // Mobile navigation methods
  previousMobileDay(): void {
    if (this.currentMobileDayIndex > 0) {
      this.currentMobileDayIndex--;
      this.ensureMobileDayFocused();
    }
  }

  nextMobileDay(): void {
    if (this.currentMobileDayIndex < 6) {
      this.currentMobileDayIndex++;
      this.ensureMobileDayFocused();
    }
  }

  getMobileDayName(): string {
    return this.weekDays[this.currentMobileDayIndex]?.name || '';
  }

  getMobileDayNumber(): number {
    return this.weekDays[this.currentMobileDayIndex]?.dayNumber || 0;
  }

  setMobileDay(index: number): void {
    const day = this.weekDays[index];
    if (!day || day.isClosed) {
      return;
    }
    this.currentMobileDayIndex = index;
    this.ensureMobileDayFocused();
  }

  getMobileWeekDotLabel(day: WeekDay): string {
    if (day.dayIndex === 2) {
      return 'SZ';
    }
    if (day.dayIndex === 3) {
      return 'CS';
    }
    return day.name.charAt(0).toUpperCase();
  }

  getWeekDateRange(): string {
    const start = this.weekDays[0];
    const end = this.weekDays[6];
    if (!start || !end) return '';
    
    const months = ['január', 'február', 'március', 'április', 'május', 'június', 
                    'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
    const startMonth = months[start.fullDate.getMonth()];
    
    return `${start.fullDate.getFullYear()}. ${startMonth} ${start.dayNumber}–${end.dayNumber}.`;
  }

  updateCurrentTimePosition(): void {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (hours >= this.calendarStartHour && hours < this.calendarEndHour) {
      const totalMinutes = (hours - this.calendarStartHour) * 60 + minutes;
      this.currentTimePosition = totalMinutes;
      return;
    }

    this.currentTimePosition = 0;
  }

  get filteredAppointments(): CalendarAppointment[] {
    if (this.selectedStaffIds.length === 0) {
      return this.allAppointments;
    }
    return this.allAppointments.filter(apt => this.selectedStaffIds.includes(apt.staffId));
  }

  isStaffSelected(staffId: number): boolean {
    return this.selectedStaffIds.includes(staffId);
  }

  toggleStaff(staffId: number): void {
    const index = this.selectedStaffIds.indexOf(staffId);
    if (index > -1) {
      // Remove from selection
      this.selectedStaffIds.splice(index, 1);
    } else {
      // Add to selection
      this.selectedStaffIds.push(staffId);
    }
    this.selectedAppointment = null;
    this.syncMobileSelectedStaffSelection();
  }

  onMobileStaffSelectionChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const staffId = Number(selectElement.value);

    this.mobileSelectedStaffId = staffId;
    this.selectedStaffIds = staffId === 0 ? [] : [staffId];
    this.selectedAppointment = null;
  }

  getMobileSelectedStaffColor(): string {
    if (this.mobileSelectedStaffId === 0) {
      return '#64748b';
    }

    return this.staffMembers.find(staff => staff.id === this.mobileSelectedStaffId)?.color || '#64748b';
  }

  private syncMobileSelectedStaffSelection(): void {
    this.mobileSelectedStaffId = this.selectedStaffIds.length === 1 ? this.selectedStaffIds[0] : 0;
  }

  onStaffColorChanged(event: { staffId: number; color: string }): void {
    const { staffId, color } = event;

    this.staffMembers = this.staffMembers.map(staff =>
      staff.id === staffId ? { ...staff, color } : staff
    );

    this.staffColors = {
      ...this.staffColors,
      [staffId]: color
    };

    this.allAppointments = this.allAppointments.map(appointment =>
      appointment.staffId === staffId ? { ...appointment, color } : appointment
    );

    if (this.selectedAppointment && this.selectedAppointment.staffId === staffId) {
      this.selectedAppointment = {
        ...this.selectedAppointment,
        color
      };
    }

    this.persistStaffColor(staffId, color);
  }

  private persistStaffColor(staffId: number, color: string): void {
    const normalizedColor = this.normalizeHexColor(color);
    if (!normalizedColor) {
      return;
    }

    const currentPersistedColor = this.lastPersistedStaffColors.get(staffId);
    if (currentPersistedColor === normalizedColor) {
      return;
    }

    this.pendingStaffColors.set(staffId, normalizedColor);

    const existingTimer = this.pendingColorPersistTimers.get(staffId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.pendingColorPersistTimers.delete(staffId);
      const queuedColor = this.pendingStaffColors.get(staffId);

      if (!queuedColor || !this.currentUserCompanyId) {
        return;
      }

      if (this.lastPersistedStaffColors.get(staffId) === queuedColor) {
        this.pendingStaffColors.delete(staffId);
        return;
      }

      this.pendingStaffColors.delete(staffId);
      this.staffService.updateStaffColor(staffId, this.currentUserCompanyId, queuedColor).subscribe({
        next: () => {
          this.lastPersistedStaffColors.set(staffId, queuedColor);
        },
        error: (err: unknown) => {
          console.error('Failed to update staff color:', err);
        },
      });
    }, this.colorPersistDebounceMs);

    this.pendingColorPersistTimers.set(staffId, timer);
  }

  private loadWeeklyAppointments(): void {
    if (!this.currentUserCompanyId) {
      return;
    }

    const weekStart = this.toIsoDate(this.currentWeekStart);

    this.ownerDashboardService
      .getWeeklyCalendarAppointments(this.currentUserCompanyId, weekStart, null)
      .subscribe({
        next: (response) => {
          this.applyWeeklyCalendarResponse(response as WeeklyCalendarResponse);
        },
        error: (err: unknown) => {
          console.error('Failed to load weekly calendar appointments:', err);
          this.allAppointments = [];
          this.staffMembers = [{ id: 0, name: 'Összes szakember', color: '#64748b' }];
          this.staffColors = {};
          this.selectedAppointment = null;
        },
      });
  }

  private applyWeeklyCalendarResponse(response: WeeklyCalendarResponse): void {
    const calendarDays = Array.isArray(response?.data) ? response.data : [];
    const staffMap = new Map<number, { name: string; color: string; generatedColor: boolean }>();
    const mappedAppointments: CalendarAppointment[] = [];

    for (const day of calendarDays) {
      const dayIndex = this.getDayIndexForCurrentWeek(day.date);
      if (dayIndex < 0) {
        continue;
      }

      const staffAppointments = Array.isArray(day.staffAppointments) ? day.staffAppointments : [];
      for (const staffEntry of staffAppointments) {
        const normalizedApiColor = this.normalizeHexColor(staffEntry.staffColor);
        const generatedColor = !normalizedApiColor;
        const color = normalizedApiColor ?? this.getGeneratedColorForStaff(staffEntry.staffId);

        if (!staffMap.has(staffEntry.staffId)) {
          staffMap.set(staffEntry.staffId, {
            name: staffEntry.staffName,
            color,
            generatedColor,
          });
        }

        const appointments = Array.isArray(staffEntry.appointments) ? staffEntry.appointments : [];
        for (const appointment of appointments) {
          mappedAppointments.push({
            id: appointment.id,
            staffId: staffEntry.staffId,
            staffName: staffEntry.staffName,
            title: appointment.serviceName,
            clientName: appointment.clientName,
            dayIndex,
            startTime: this.normalizeTime(appointment.startTime),
            duration: appointment.durationMinutes,
            color,
            phone: appointment.clientPhone,
            service: appointment.serviceName,
            price: appointment.price,
            status: appointment.status,
            notes: appointment.notes ?? undefined,
          });
        }
      }
    }

    this.allAppointments = mappedAppointments;
    this.staffMembers = [
      { id: 0, name: 'Összes szakember', color: '#64748b' },
      ...Array.from(staffMap.entries())
        .map(([id, data]) => ({ id, name: data.name, color: data.color }))
        .sort((a, b) => a.name.localeCompare(b.name, 'hu')),
    ];
    this.staffColors = Array.from(staffMap.entries()).reduce<{ [key: number]: string }>((acc, [id, data]) => {
      acc[id] = data.color;
      return acc;
    }, {});

    for (const [staffId, staffData] of staffMap.entries()) {
      if (!staffData.generatedColor) {
        this.lastPersistedStaffColors.set(staffId, staffData.color);
      }
    }

    if (this.selectedAppointment && !this.allAppointments.some(apt => apt.id === this.selectedAppointment?.id)) {
      this.selectedAppointment = null;
    }

    this.persistGeneratedColors(staffMap);
  }

  private persistGeneratedColors(staffMap: Map<number, { name: string; color: string; generatedColor: boolean }>): void {
    for (const [staffId, staffData] of staffMap.entries()) {
      if (!staffData.generatedColor) {
        continue;
      }

      this.persistStaffColor(staffId, staffData.color);
    }
  }

  private getGeneratedColorForStaff(staffId: number): string {
    const paletteIndex = Math.abs(staffId) % this.generatedColorPalette.length;
    return this.generatedColorPalette[paletteIndex];
  }

  private normalizeHexColor(color: string | null | undefined): string | null {
    if (!color) {
      return null;
    }

    const trimmedColor = color.trim();
    if (!trimmedColor) {
      return null;
    }

    const prefixed = trimmedColor.startsWith('#') ? trimmedColor : `#${trimmedColor}`;
    const validHex = /^#([a-fA-F0-9]{6})$/.test(prefixed);

    return validHex ? prefixed.toLowerCase() : null;
  }

  private normalizeTime(time: string): string {
    if (!time) {
      return '';
    }

    return time.length >= 5 ? time.slice(0, 5) : time;
  }

  private getDayIndexForCurrentWeek(dateIso: string): number {
    const parts = dateIso.split('-').map(Number);
    if (parts.length !== 3 || parts.some(part => Number.isNaN(part))) {
      return -1;
    }

    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    const weekStart = new Date(this.currentWeekStart.getFullYear(), this.currentWeekStart.getMonth(), this.currentWeekStart.getDate());
    const diffInDays = Math.round((date.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));

    return diffInDays >= 0 && diffInDays <= 6 ? diffInDays : -1;
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getShortName(fullName: string): string {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return parts[0]; // Return first name only
    }
    return fullName;
  }

  getAppointmentsForDay(dayIndex: number): CalendarAppointment[] {
    const dayAppts = this.allAppointments.filter(apt => apt.dayIndex === dayIndex);
    
    // If no staff selected, show all
    if (this.selectedStaffIds.length === 0) {
      return dayAppts;
    }
    
    // Show only selected staff
    return dayAppts.filter(apt => this.selectedStaffIds.includes(apt.staffId));
  }

  // Column layout - overflow allowed for better visibility
  getAppointmentStyleWithOverlap(appointment: CalendarAppointment, dayIndex: number): any {
    const startMinutes = this.minutesFromCalendarStart(appointment.startTime);
    const endMinutes = startMinutes + appointment.duration;
    const top = startMinutes;
    const height = appointment.duration;

    // Find appointments that overlap in time
    const dayAppointments = this.getAppointmentsForDay(dayIndex);
    const overlapping = dayAppointments.filter(apt => {
      const aptStart = this.minutesFromCalendarStart(apt.startTime);
      const aptEnd = aptStart + apt.duration;
      return apt.id !== appointment.id && aptStart < endMinutes && aptEnd > startMinutes;
    });

    // Check if this day is closed or unfocused
    const isClosed = this.weekDays[dayIndex]?.isClosed || false;
    const isUnfocused = !this.isFocused(dayIndex);
    
    let width = 'calc(100% - 4px)';
    let left = '2px';
    let zIndex = 1;
    
    // Zárt napok - vastagabb csíkok (18px) egymás mellett
    if (isClosed && overlapping.length > 0) {
      const allAppointments = [appointment, ...overlapping].sort((a, b) => {
        const [aH, aM] = a.startTime.split(':').map(Number);
        const [bH, bM] = b.startTime.split(':').map(Number);
        const aStart = aH * 60 + aM;
        const bStart = bH * 60 + bM;
        if (aStart !== bStart) return aStart - bStart;
        return a.id - b.id;
      });
      
      const totalColumns = allAppointments.length;
      const columnIndex = allAppointments.findIndex(a => a.id === appointment.id);
      
      // Zárt napokon: 18px széles csíkok
      const stripWidth = 12;
      const spacing = 1; // Pixel távolság a csíkok között
      const totalWidth = totalColumns * stripWidth + (totalColumns - 1) * spacing;
      const startOffset = `calc(50% - ${totalWidth / 2}px)`;
      
      width = `${stripWidth}px`;
      left = `calc(${startOffset} + ${columnIndex * (stripWidth + spacing)}px)`;
      zIndex = columnIndex + 1;
    }
    // Zárt nap, nincs overlap - középre igazított egyetlen vastagabb csík
    else if (isClosed) {
    const stripWidth = 12;
    width = `${stripWidth}px`;
    left = `calc(50% - ${stripWidth / 2}px)`;
    }
    // Unfocused napok - vékony csíkok egymás mellett
    else if (isUnfocused && overlapping.length > 0) {
      const allAppointments = [appointment, ...overlapping].sort((a, b) => {
        const [aH, aM] = a.startTime.split(':').map(Number);
        const [bH, bM] = b.startTime.split(':').map(Number);
        const aStart = aH * 60 + aM;
        const bStart = bH * 60 + bM;
        if (aStart !== bStart) return aStart - bStart;
        return a.id - b.id;
      });
      
      const totalColumns = allAppointments.length;
      const columnIndex = allAppointments.findIndex(a => a.id === appointment.id);
      
      // Ha unfocused: 14px széles csíkok, egymás mellett
      const stripWidth = 10;
      const spacing = 1; // Pixel távolság a csíkok között
      const totalWidth = totalColumns * stripWidth + (totalColumns - 1) * spacing;
      const startOffset = `calc(50% - ${totalWidth / 2}px)`;
      
      width = `${stripWidth}px`;
      left = `calc(${startOffset} + ${columnIndex * (stripWidth + spacing)}px)`;
      zIndex = columnIndex + 1;
    }
    // Focused napok - normál széles overlap kezelés
    else if (overlapping.length > 0) {
      const allAppointments = [appointment, ...overlapping].sort((a, b) => {
        const [aH, aM] = a.startTime.split(':').map(Number);
        const [bH, bM] = b.startTime.split(':').map(Number);
        const aStart = aH * 60 + aM;
        const bStart = bH * 60 + bM;
        if (aStart !== bStart) return aStart - bStart;
        return a.id - b.id;
      });
      
      const totalColumns = allAppointments.length;
      const columnIndex = allAppointments.findIndex(a => a.id === appointment.id);
      
      // Calculate width - ensure minimum 85px
      const columnWidth = 100 / totalColumns;
      width = `max(${columnWidth}%, 85px)`;
      left = `calc(${columnWidth}% * ${columnIndex})`;
      zIndex = columnIndex + 1;
    }
    // Unfocused, nincs overlap - középre igazított egyetlen csík
    else if (isUnfocused) {
    width = '10px';
    left = 'calc(50% - 5px)';
    }

    // Convert hex to RGBA
    const hexToRgba = (hex: string, opacity: number) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return `rgba(99, 102, 241, ${opacity})`;
      return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity})`;
    };

    return {
      top: `${top}px`,
      height: `${height}px`,
      width: width,
      left: left,
      zIndex: zIndex,
      background: hexToRgba(appointment.color, 0.12),
      borderLeft: `6px solid ${appointment.color}`,
      '--hover-bg': hexToRgba(appointment.color, 0.22),
      '--border-color': appointment.color
    };
  }

  selectAppointment(appointment: CalendarAppointment): void {
    this.selectedAppointment = appointment;
  }

  closeDetails(): void {
    this.selectedAppointment = null;
  }

  shouldShowService(appointment: CalendarAppointment, dayIndex: number): boolean {
    // Only show if duration >= 30 minutes AND no overlapping appointments
    if (appointment.duration < 30) return false;

    const startMinutes = this.minutesFromCalendarStart(appointment.startTime);
    const endMinutes = startMinutes + appointment.duration;
    
    const dayAppointments = this.getAppointmentsForDay(dayIndex);
    const hasOverlap = dayAppointments.some(apt => {
      if (apt.id === appointment.id) return false;

      const aptStart = this.minutesFromCalendarStart(apt.startTime);
      const aptEnd = aptStart + apt.duration;
      
      return aptStart < endMinutes && aptEnd > startMinutes;
    });
    
    return !hasOverlap;
  }

  getStatusLabel(status?: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Függőben',
      'confirmed': 'Megerősítve',
      'completed': 'Befejezve',
      'cancelled': 'Lemondva',
      'booked': 'Foglalva',
      'no_show': 'Nem jelent meg'
    };
    return labels[status || 'pending'] || status || '';
  }

  getAvatarInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  shouldShowClientName(appointment: CalendarAppointment): boolean {
    return appointment.duration >= 45;
  }

  /**
   * Fókusz beállítása egy adott napra
   */
  setFocusedDay(dayIndex: number): void {
    const day = this.weekDays[dayIndex];
    if (!day || day.isClosed) {
      return; // Zárt napokra nem lehet fókuszálni
    }

    const existingIndex = this.focusedDayIndices.indexOf(dayIndex);

    if (existingIndex > -1) {
      if (this.focusedDayIndices.length > 1) {
        this.focusedDayIndices.splice(existingIndex, 1);
      }
      return;
    }

    if (this.focusedDayIndices.length >= 2) {
      this.focusedDayIndices.shift();
    }

    this.focusedDayIndices.push(dayIndex);
  }

  private ensureMobileDayFocused(): void {
    if (!this.isMobileView) {
      return;
    }

    const day = this.weekDays[this.currentMobileDayIndex];
    if (!day || day.isClosed) {
      return;
    }

    this.focusedDayIndices = [this.currentMobileDayIndex];
  }

  /**
   * Ellenőrzi, hogy egy nap fókuszban van-e
   */
  isFocused(dayIndex: number): boolean {
    if (this.isMobileView) {
      return dayIndex === this.currentMobileDayIndex;
    }
    return this.focusedDayIndices.includes(dayIndex);
  }
}
