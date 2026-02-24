import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import {
  OwnerSalesService,
  SalesRevenueChartPoint,
  SalesOverviewPeriod,
} from '../../../../../core/services/owner-sales.service';
import { AuthService } from '../../../../../core/services/auth.service';

export type Period = 'weekly' | 'monthly' | 'yearly';

interface KpiData {
  totalRevenue: string;
  avgBasket: string;
  bookings: string;
  returningClients: string;
  totalRevenueTrend: string;
  totalRevenueTrendClass: 'positive' | 'negative' | '';
  avgBasketTrend: string;
  avgBasketTrendClass: 'positive' | 'negative' | '';
  bookingsTrend: string;
  bookingsTrendClass: 'positive' | 'negative' | '';
  returningTrend: string;
  returningTrendClass: 'positive' | 'negative' | '';
}

interface BarData {
  height: number;
  label: string;
  value: string;
}

interface BreakdownRow {
  label: string;
  percent: number;
  value: string;
}

interface ServiceRow {
  name: string;
  bookings: number;
  revenue: string;
}

interface Transaction {
  date: string;
  client: string;
  service: string;
  amount: string;
  success: boolean;
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css',
})
export class SalesComponent implements OnInit {
  kpiErrorMessage = '';
  isChartLoading = false;
  selectedPeriod: Period = 'weekly';
  isKpiLoading = false;
  isTopServicesLoading: boolean = false;
  topServicesError: string = '';

  private readonly loadedPeriods = new Set<Period>();
  private readonly loadedChartPeriods = new Set<Period>();

  private readonly kpiByPeriod: Record<Period, KpiData> = {
    weekly: this.createDefaultKpi(),
    monthly: this.createDefaultKpi(),
    yearly: this.createDefaultKpi(),
  };

  private readonly chartBarsByPeriod: Record<Period, BarData[]> = {
    weekly: [],
    monthly: [],
    yearly: [],
  };

  private readonly data: Record<Period, {
    bars: BarData[];
    chartCaption: string;
    breakdown: BreakdownRow[];
    services: ServiceRow[];
    transactions: Transaction[];
  }> = {
    weekly: {
      bars: [],
      chartCaption: '',
      breakdown: [],
      services: [],
      transactions: [],
    },
    monthly: {
      bars: [],
      chartCaption: '',
      breakdown: [],
      services: [],
      transactions: [],
    },
    yearly: {
      bars: [],
      chartCaption: '',
      breakdown: [],
      services: [],
      transactions: [],
    },
  };

  constructor(
    private readonly authService: AuthService,
    private readonly ownerSalesService: OwnerSalesService
  ) {}

  ngOnInit(): void {
    this.chartBarsByPeriod.weekly = [...this.data.weekly.bars];
    this.chartBarsByPeriod.monthly = [...this.data.monthly.bars];
    this.chartBarsByPeriod.yearly = [...this.data.yearly.bars];

    this.loadSalesOverviewForPeriod(this.selectedPeriod);
    this.loadSalesRevenueChartForPeriod(this.selectedPeriod);
    this.loadTopServicesForPeriod(this.selectedPeriod);
  }

  get currentTopServices(): ServiceRow[] {
    return this.data[this.selectedPeriod].services;
  }
  get current() {
    return this.data[this.selectedPeriod];
  }

  get currentKpi(): KpiData {
    return this.kpiByPeriod[this.selectedPeriod];
  }

  get currentBars(): BarData[] {
    return this.chartBarsByPeriod[this.selectedPeriod];
  }

  get periodLabel(): string {
    return { weekly: 'Utolsó 7 nap', monthly: 'Utolsó 30 nap', yearly: 'Utolsó 12 hónap' }[this.selectedPeriod];
  }

  selectPeriod(period: Period): void {
    this.selectedPeriod = period;
    this.loadSalesOverviewForPeriod(period);
    this.loadSalesRevenueChartForPeriod(period);
    this.loadTopServicesForPeriod(period);
  }
  private loadTopServicesForPeriod(period: Period): void {
    const user = this.authService.getCurrentUser();
    if (!user?.companyId) {
      this.topServicesError = 'Nem található cégazonosító a szolgáltatásokhoz.';
      this.data[period].services = [];
      return;
    }
    this.isTopServicesLoading = true;
    this.topServicesError = '';
    this.ownerSalesService.getSalesTopServices(user.companyId, this.toSalesOverviewPeriod(period)).pipe(
      finalize(() => (this.isTopServicesLoading = false))
    ).subscribe({
      next: (services) => {
        // Map backend response to ServiceRow
        this.data[period].services = (services as any)?.result?.map((item: any) => ({
          name: item.serviceName || '',
          bookings: item.clientCount ?? 0,
          revenue: item.currency ? `${item.currency} Ft` : '0 Ft',
        })) || [];
      },
      error: (err) => {
        this.topServicesError = 'Nem sikerült betölteni a kiemelt szolgáltatásokat.';
        this.data[period].services = [];
      }
    });
  }

  private loadSalesOverviewForPeriod(period: Period): void {
    const user = this.authService.getCurrentUser();

    if (!user?.companyId) {
      this.kpiErrorMessage = 'Nem található cégazonosító a pénzügyi adatok betöltéséhez.';
      this.kpiByPeriod[period] = this.createDefaultKpi();
      return;
    }

    if (this.loadedPeriods.has(period)) {
      return;
    }

    this.isKpiLoading = true;
    this.kpiErrorMessage = '';

    this.ownerSalesService
      .getSalesOverview(user.companyId, this.toSalesOverviewPeriod(period))
      .pipe(finalize(() => (this.isKpiLoading = false)))
      .subscribe({
        next: (overview) => {
          this.kpiByPeriod[period] = {
            totalRevenue: this.formatCurrency(overview.revenue),
            avgBasket: this.formatCurrency(overview.avgBasket),
            bookings: this.formatInteger(overview.bookingsCount),
            returningClients: `${this.formatInteger(overview.returningClientsPercent)}%`,
            totalRevenueTrend: 'Backend adat',
            totalRevenueTrendClass: '',
            avgBasketTrend: 'Backend adat',
            avgBasketTrendClass: '',
            bookingsTrend: 'Backend adat',
            bookingsTrendClass: '',
            returningTrend: 'Backend adat',
            returningTrendClass: '',
          };

          this.loadedPeriods.add(period);
        },
        error: (error) => {
          console.error('Sales overview load error:', error);
          this.kpiErrorMessage = 'Nem sikerült betölteni a pénzügyi KPI adatokat.';
          this.kpiByPeriod[period] = this.createDefaultKpi();
        },
      });
  }

  private createDefaultKpi(): KpiData {
    return {
      totalRevenue: '0 Ft',
      avgBasket: '0 Ft',
      bookings: '0',
      returningClients: '0%',
      totalRevenueTrend: '—',
      totalRevenueTrendClass: '',
      avgBasketTrend: '—',
      avgBasketTrendClass: '',
      bookingsTrend: '—',
      bookingsTrendClass: '',
      returningTrend: '—',
      returningTrendClass: '',
    };
  }

  private loadSalesRevenueChartForPeriod(period: Period): void {
    const user = this.authService.getCurrentUser();

    if (!user?.companyId) {
      return;
    }

    if (this.loadedChartPeriods.has(period)) {
      return;
    }

    this.isChartLoading = true;

    this.ownerSalesService
      .getSalesRevenueChart(user.companyId, this.toSalesOverviewPeriod(period))
      .pipe(finalize(() => (this.isChartLoading = false)))
      .subscribe({
        next: (points) => {
          const bars = this.mapChartPointsToBars(points, period);
          if (bars.length > 0) {
            this.chartBarsByPeriod[period] = bars;
          }

          this.loadedChartPeriods.add(period);
        },
        error: (error) => {
          console.error('Sales revenue chart load error:', error);
        },
      });
  }

  private mapChartPointsToBars(points: SalesRevenueChartPoint[], period: Period): BarData[] {
    if (points.length === 0) {
      return [];
    }

    if (period === 'monthly') {
      return this.mapMonthlyPointsToWeeklyBars(points);
    }

    if (period === 'weekly') {
      return this.mapWeeklyPointsToDailyBars(points);
    }

    const maxValue = Math.max(...points.map((point) => point.value), 1);

    return points.map((point) => {
      const height = Math.max(20, Math.round((point.value / maxValue) * 90));

      return {
        height,
        label: point.label,
        value: this.formatInteger(point.value),
      };
    });
  }

  private mapWeeklyPointsToDailyBars(points: SalesRevenueChartPoint[]): BarData[] {
    // Mindig csak 7 nap (hétfő-vasárnap)
    const weekPoints = points.slice(0, 7);
    const maxValue = Math.max(...weekPoints.map((point) => point.value), 1);
    return weekPoints.map((point, index) => {
      const height = Math.max(20, Math.round((point.value / maxValue) * 90));
      return {
        height,
        label: this.getLongWeekdayLabel(point.label, index),
        value: this.formatInteger(point.value),
      };
    });
  }

  private mapMonthlyPointsToWeeklyBars(points: SalesRevenueChartPoint[]): BarData[] {
    const bucketSize = 7;
    const grouped: Array<{ value: number; label: string }> = [];
    const now = new Date();
    const currentYear = now.getFullYear();

    for (let index = 0; index < points.length; index += bucketSize) {
      const chunk = points.slice(index, index + bucketSize);
      const bucketValue = chunk.reduce((sum, point) => sum + point.value, 0);
      let label = '';
      if (chunk.length > 0) {
        const firstDate = this.tryParseDate(chunk[0].label);
        const lastDate = this.tryParseDate(chunk[chunk.length - 1].label);
        if (firstDate) {
          // utolsó, csonka blokk: csak kezdő dátum + kötőjel
          if (chunk.length < bucketSize) {
            label = this.formatChartDate(firstDate, null, currentYear) + ' –';
          } else if (lastDate) {
            label = this.formatChartDate(firstDate, lastDate, currentYear);
          }
        }
      }
      grouped.push({
        value: bucketValue,
        label,
      });
    }

    const maxValue = Math.max(...grouped.map((item) => item.value), 1);

    return grouped.map((item) => ({
      height: Math.max(20, Math.round((item.value / maxValue) * 90)),
      label: item.label,
      value: this.formatInteger(item.value),
    }));
  }

  private formatChartDate(from: Date, to: Date | null, currentYear: number): string {
    // Ha év eltér, vagy nem az aktuális év, akkor év is kell
    const fromYear = from.getFullYear();
    const fromMonth = from.getMonth() + 1;
    const fromDay = from.getDate();
    let fromStr = `${this.pad2(fromMonth)}.${this.pad2(fromDay)}`;
    if (fromYear !== currentYear) {
      fromStr = `${fromYear}.` + fromStr;
    }
    if (!to) return fromStr;
    const toYear = to.getFullYear();
    const toMonth = to.getMonth() + 1;
    const toDay = to.getDate();
    let toStr = `${this.pad2(toMonth)}.${this.pad2(toDay)}`;
    if (toYear !== fromYear) {
      toStr = `${toYear}.` + toStr;
    }
    return `${fromStr} – ${toStr}`;
  }

  private pad2(n: number): string {
    return n < 10 ? '0' + n : '' + n;
  }

  private getLongWeekdayLabel(rawLabel: string, index: number): string {
    const dateFromApi = this.tryParseDate(rawLabel);
    if (dateFromApi) {
      // hosszú napnév (Hétfő, Kedd, ...)
      return dateFromApi.toLocaleDateString('hu-HU', { weekday: 'long' });
    }
    const fallbackLabels = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
    return fallbackLabels[index % fallbackLabels.length];
  }

  private tryParseDate(value: string): Date | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const normalized = value.includes('T') ? value : `${value}T00:00:00`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toSalesOverviewPeriod(period: Period): SalesOverviewPeriod {
    if (period === 'weekly') {
      return 'week';
    }

    if (period === 'monthly') {
      return 'month';
    }

    return 'year';
  }

  private formatCurrency(value: number): string {
    return `${new Intl.NumberFormat('hu-HU').format(Math.round(value))} Ft`;
  }

  private formatInteger(value: number): string {
    return new Intl.NumberFormat('hu-HU').format(Math.round(value));
  }

  private createMonthlyBars(dailyRevenue: number[]): BarData[] {
    const bucketTotals = this.bucketByDays(dailyRevenue, 7);
    const maxTotal = Math.max(...bucketTotals, 1);

    return bucketTotals.map((total, index) => {
      const height = Math.max(20, Math.round((total / maxTotal) * 90));
      return {
        height,
        label: `${index + 1}. hét`,
        value: `${Math.round(total / 1000)} e`,
      };
    });
  }

  private bucketByDays(values: number[], bucketSize: number): number[] {
    const buckets: number[] = [];

    for (let index = 0; index < values.length; index += bucketSize) {
      const bucketTotal = values
        .slice(index, index + bucketSize)
        .reduce((sum, current) => sum + current, 0);
      buckets.push(bucketTotal);
    }

    return buckets;
  }
}
