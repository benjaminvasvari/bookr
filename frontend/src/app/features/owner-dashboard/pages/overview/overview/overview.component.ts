import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import {
  OwnerDashboardReview,
  OwnerDashboardServiceItem,
  OwnerDashboardUpcomingAppointment,
  OwnerDashboardData,
} from '../../../../../core/models/owner-dashboard.model';
import { AuthService } from '../../../../../core/services/auth.service';
import { OwnerDashboardService } from '../../../../../core/services/owner-dashboard.service';
import {
  OwnerSalesService,
  SalesRevenueChartPoint,
} from '../../../../../core/services/owner-sales.service';
import {
  RevenueChartBar,
  RevenueChartComponent,
} from '../../../components/revenue-chart/revenue-chart.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, RevenueChartComponent],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css',
})
export class OverviewComponent implements OnInit {
  dashboardData: OwnerDashboardData | null = null;
  isLoading = true;
  errorMessage = '';
  isRevenueChartLoading = false;
  revenueChartError = '';
  revenueChartBars: RevenueChartBar[] = [];

  constructor(
    private readonly ownerDashboardService: OwnerDashboardService,
    private readonly authService: AuthService,
    private readonly ownerSalesService: OwnerSalesService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadRevenueChart();
  }

  get todayBookings(): number {
    return this.dashboardData?.todayBookingsCount.todayCount ?? 0;
  }

  get activeClients(): number {
    return this.dashboardData?.activeClientsData.activeClients ?? 0;
  }

  get newClientsThisWeek(): number {
    return this.dashboardData?.activeClientsData.newClientsThisWeek ?? 0;
  }

  get weeklyRevenueThisWeek(): number {
    return Number(this.dashboardData?.weeklyRevenueData.thisWeek ?? 0);
  }

  get revenueCurrency(): string {
    return this.dashboardData?.weeklyRevenueData.currency ?? 'HUF';
  }

  get averageRating(): number {
    return this.dashboardData?.averageRating.averageRating ?? 0;
  }

  get totalReviews(): number {
    return this.dashboardData?.averageRating.totalReviews ?? 0;
  }

  get starArray(): ('full' | 'half' | 'empty')[] {
    const rating = this.averageRating;
    return Array.from({ length: 5 }, (_, i) => {
      const diff = rating - i;
      if (diff >= 1) return 'full';
      if (diff >= 0.5) return 'half';
      return 'empty';
    });
  }

  get upcomingAppointments(): OwnerDashboardUpcomingAppointment[] {
    return this.dashboardData?.upcomingAppointmentsData ?? [];
  }

  get latestReviews(): OwnerDashboardReview[] {
    return this.dashboardData?.reviewsLimited ?? [];
  }

  get servicesPreview(): OwnerDashboardServiceItem[] {
    const categories = this.dashboardData?.servicesByCategories ?? [];
    const seen = new Set<number>();
    const flattened: OwnerDashboardServiceItem[] = [];

    for (const category of categories) {
      for (const service of category.services) {
        if (!seen.has(service.id)) {
          seen.add(service.id);
          flattened.push(service);
        }
      }
    }

    return flattened;
  }

  get bookingsTrendClass(): 'positive' | 'negative' | '' {
    const change = this.calculatePercentChange(
      this.dashboardData?.todayBookingsCount.todayCount ?? 0,
      this.dashboardData?.todayBookingsCount.yesterdayCount ?? 0
    );

    if (change === null || change === 0) {
      return '';
    }

    return change > 0 ? 'positive' : 'negative';
  }

  get bookingsTrendText(): string {
    const today = this.dashboardData?.todayBookingsCount.todayCount ?? 0;
    const yesterday = this.dashboardData?.todayBookingsCount.yesterdayCount ?? 0;
    const change = this.calculatePercentChange(today, yesterday);

    if (change === null || change === 0) {
      return 'Nincs változás tegnaphoz képest';
    }

    return `${change > 0 ? '+' : ''}${change}% tegnaphoz képest`;
  }

  get revenueTrendClass(): 'positive' | 'negative' | '' {
    const thisWeek = Number(this.dashboardData?.weeklyRevenueData.thisWeek ?? 0);
    const lastWeek = Number(this.dashboardData?.weeklyRevenueData.lastWeek ?? 0);
    const change = this.calculatePercentChange(thisWeek, lastWeek);

    if (change === null || change === 0) {
      return '';
    }

    return change > 0 ? 'positive' : 'negative';
  }

  get revenueTrendText(): string {
    const thisWeek = Number(this.dashboardData?.weeklyRevenueData.thisWeek ?? 0);
    const lastWeek = Number(this.dashboardData?.weeklyRevenueData.lastWeek ?? 0);
    const change = this.calculatePercentChange(thisWeek, lastWeek);

    if (change === null || change === 0) {
      return 'Nincs változás múlt héthez képest';
    }

    return `${change > 0 ? '+' : ''}${change}% múlt héthez képest`;
  }

  formatCurrency(value: number, currency: string): string {
    const safeValue = Number.isFinite(value) ? value : 0;
    const symbol = currency === 'HUF' ? 'Ft' : currency;

    return `${safeValue.toLocaleString('hu-HU')} ${symbol}`;
  }

  getAppointmentTitle(appointment: OwnerDashboardUpcomingAppointment): string {
    return appointment.serviceName ?? appointment.service ?? 'Foglalás';
  }

  getAppointmentClient(appointment: OwnerDashboardUpcomingAppointment): string {
    return appointment.clientName ?? appointment.customerName ?? appointment.userName ?? 'Ismeretlen ügyfél';
  }

  getAppointmentTime(appointment: OwnerDashboardUpcomingAppointment): string {
    if (appointment.time) {
      const normalized = this.normalizeTime(appointment.time);
      if (normalized) return normalized;
    }

    if (appointment.startTime) {
      const normalized = this.normalizeTime(appointment.startTime);
      if (normalized) return normalized;
    }

    if (!appointment.date) {
      return '--:--';
    }

    const parsedDate = new Date(appointment.date);
    if (Number.isNaN(parsedDate.getTime())) {
      return '--:--';
    }

    return parsedDate.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  }

  getAppointmentDayLabel(appointment: OwnerDashboardUpcomingAppointment): string {
    if (appointment.dayLabel) {
      return appointment.dayLabel;
    }

    const dateSource = appointment.date ?? appointment.startTime ?? null;
    if (!dateSource) {
      return '';
    }

    const trimmed = dateSource.trim().toLowerCase();
    if (trimmed === 'ma' || trimmed === 'holnap') {
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    }

    const appointmentDate = new Date(dateSource.replace(' ', 'T'));
    if (Number.isNaN(appointmentDate.getTime())) {
      return dateSource;
    }

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (this.isSameDay(appointmentDate, today)) {
      return 'Ma';
    }

    if (this.isSameDay(appointmentDate, tomorrow)) {
      return 'Holnap';
    }

    return appointmentDate.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  }

  trackByAppointment(index: number, appointment: OwnerDashboardUpcomingAppointment): string | number {
    return appointment.id ?? `${appointment.date ?? ''}-${appointment.time ?? ''}-${index}`;
  }

  trackByService(_: number, service: OwnerDashboardServiceItem): number {
    return service.id;
  }

  trackByReview(_: number, review: OwnerDashboardReview): number {
    return review.id;
  }

  private loadDashboard(): void {
    this.ownerDashboardService
      .getOwnerDashboard()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.dashboardData = response.result;
        },
        error: (error: unknown) => {
          this.errorMessage =
            error instanceof Error
              ? error.message
              : 'Nem sikerült betölteni a dashboard adatokat.';
        },
      });
  }

  private calculatePercentChange(currentValue: number, previousValue: number): number | null {
    if (previousValue === 0) {
      if (currentValue === 0) {
        return 0;
      }

      return null;
    }

    return Math.round(((currentValue - previousValue) / previousValue) * 100);
  }

  private isSameDay(dateA: Date, dateB: Date): boolean {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  }

  private normalizeTime(value: string): string | null {
    const match = value.trim().match(/(?:^|\s|T)(\d{1,2}):(\d{2})/);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  private loadRevenueChart(): void {
    const user = this.authService.getCurrentUser();

    if (!user?.companyId) {
      this.revenueChartError = 'Nem található cégazonosító a grafikonhoz.';
      return;
    }

    this.isRevenueChartLoading = true;
    this.revenueChartError = '';

    this.ownerSalesService
      .getSalesRevenueChart(user.companyId, 'week')
      .pipe(finalize(() => (this.isRevenueChartLoading = false)))
      .subscribe({
        next: (points) => {
          this.revenueChartBars = this.mapWeeklyPointsToBars(points);
        },
        error: () => {
          this.revenueChartBars = [];
          this.revenueChartError = 'Nem sikerült betölteni a bevételi grafikont.';
        },
      });
  }

  private mapWeeklyPointsToBars(points: SalesRevenueChartPoint[]): RevenueChartBar[] {
    const datedPoints = points
      .map((point) => ({ point, date: this.tryParseDate(point.label) }))
      .filter((item): item is { point: SalesRevenueChartPoint; date: Date } => item.date !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const referenceDate = datedPoints.length > 0 ? datedPoints[datedPoints.length - 1].date : new Date();
    const rangeDates = this.buildLastSevenDates(referenceDate);
    const valuesByDate = new Map<string, number>();

    for (const item of datedPoints) {
      valuesByDate.set(this.toDateKey(item.date), item.point.value);
    }

    const maxValue = Math.max(...rangeDates.map((date) => valuesByDate.get(this.toDateKey(date)) ?? 0), 1);

    return rangeDates.map((date) => {
      const value = valuesByDate.get(this.toDateKey(date)) ?? 0;
      const height = value > 0 ? Math.max(20, Math.round((value / maxValue) * 90)) : 8;

      return {
        height,
        label: date.toLocaleDateString('hu-HU', { weekday: 'long' }),
        value: this.formatInteger(value),
      };
    });
  }

  private buildLastSevenDates(endDate: Date): Date[] {
    const normalizedEnd = new Date(endDate);
    normalizedEnd.setHours(0, 0, 0, 0);

    const dates: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(normalizedEnd);
      day.setDate(normalizedEnd.getDate() - i);
      dates.push(day);
    }

    return dates;
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private tryParseDate(value: string): Date | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const normalized = value.includes('T') ? value : `${value}T00:00:00`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private formatInteger(value: number): string {
    const rounded = Math.round(value);
    const sign = rounded < 0 ? '-' : '';
    const digits = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    return `${sign}${digits}`;
  }

}
