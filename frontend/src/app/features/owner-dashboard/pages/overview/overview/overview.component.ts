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
import { OwnerDashboardService } from '../../../../../core/services/owner-dashboard.service';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css',
})
export class OverviewComponent implements OnInit {
  dashboardData: OwnerDashboardData | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(private ownerDashboardService: OwnerDashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
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
      return appointment.time;
    }

    if (appointment.startTime) {
      return appointment.startTime;
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

    const dateSource = appointment.date ?? null;
    if (!dateSource) {
      return '';
    }

    const appointmentDate = new Date(dateSource);
    if (Number.isNaN(appointmentDate.getTime())) {
      return '';
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

}
