import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import {
  OwnerSalesService,
  SalesRevenueChartPoint,
  SalesOverviewPeriod,
} from '../../../../../core/services/owner-sales.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { CompaniesService } from '../../../../../core/services/companies.service';
import { OpeningHours } from '../../../../../core/models/opening-hours.model';
import {
  RevenueChartBar,
  RevenueChartComponent,
} from '../../../components/revenue-chart/revenue-chart.component';

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
  imports: [CommonModule, RevenueChartComponent],
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
  private companyOpeningHours: OpeningHours | null = null;

  private readonly loadedPeriods = new Set<Period>();
  private readonly loadedChartPeriods = new Set<Period>();

  private readonly kpiByPeriod: Record<Period, KpiData> = {
    weekly: this.createDefaultKpi(),
    monthly: this.createDefaultKpi(),
    yearly: this.createDefaultKpi(),
  };

  private readonly chartBarsByPeriod: Record<Period, RevenueChartBar[]> = {
    weekly: [],
    monthly: [],
    yearly: [],
  };

  private readonly data: Record<Period, {
    bars: RevenueChartBar[];
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
    private readonly ownerSalesService: OwnerSalesService,
    private readonly companiesService: CompaniesService
  ) {}

  ngOnInit(): void {
    this.chartBarsByPeriod.weekly = [...this.data.weekly.bars];
    this.chartBarsByPeriod.monthly = [...this.data.monthly.bars];
    this.chartBarsByPeriod.yearly = [...this.data.yearly.bars];

    this.loadCompanyOpeningHours();
    this.loadSalesOverviewForPeriod(this.selectedPeriod);
    this.loadSalesRevenueChartForPeriod(this.selectedPeriod);
    this.loadTopServicesForPeriod(this.selectedPeriod);
  }

  private loadCompanyOpeningHours(): void {
    const user = this.authService.getCurrentUser();

    if (!user?.companyId) {
      return;
    }

    this.companiesService.getCompanyById(user.companyId).subscribe({
      next: (company) => {
        this.companyOpeningHours = company.openingHours ?? null;

        if (this.selectedPeriod === 'weekly') {
          this.loadedChartPeriods.delete('weekly');
          this.loadSalesRevenueChartForPeriod('weekly');
        }
      },
      error: (error) => {
        console.error('Failed to load company opening hours for sales chart:', error);
      },
    });
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

  get currentBars(): RevenueChartBar[] {
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
        this.data[period].services = services;
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
          const trends = this.calculateTrends(overview, period);
          
          this.kpiByPeriod[period] = {
            totalRevenue: this.formatCurrency(overview.revenue),
            avgBasket: this.formatCurrency(overview.avgBasket),
            bookings: this.formatInteger(overview.bookingsCount),
            returningClients: `${this.formatInteger(overview.returningClientsPercent)}%`,
            totalRevenueTrend: trends.revenue.text,
            totalRevenueTrendClass: trends.revenue.className,
            avgBasketTrend: trends.avgBasket.text,
            avgBasketTrendClass: trends.avgBasket.className,
            bookingsTrend: trends.bookings.text,
            bookingsTrendClass: trends.bookings.className,
            returningTrend: trends.returning.text,
            returningTrendClass: trends.returning.className,
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

  private mapChartPointsToBars(points: SalesRevenueChartPoint[], period: Period): RevenueChartBar[] {
    if (points.length === 0) {
      return [];
    }

    if (period === 'monthly') {
      return this.mapMonthlyPointsToWeeklyBars(points);
    }

    if (period === 'weekly') {
      return this.mapWeeklyPointsToDailyBars(points);
    }

    if (period === 'yearly') {
      return this.mapYearlyPointsToMonthlyBars(points);
    }

    const maxValue = Math.max(...points.map((point) => point.value), 1);

    return points.map((point) => {
      // Nullás értékeknél is látható minimum méret
      const heightPercent = point.value > 0 ? Math.round((point.value / maxValue) * 90) : 0;
      const height = point.value > 0 ? Math.max(25, heightPercent) : 8;

      return {
        height,
        label: point.label,
        value: point.value > 0 ? this.formatInteger(point.value) : '0',
        isClosed: false,
      };
    });
  }

  private mapYearlyPointsToMonthlyBars(points: SalesRevenueChartPoint[]): RevenueChartBar[] {
    const datedPoints = points
      .map((point) => ({
        point,
        date: this.tryParseDate(point.label),
      }))
      .filter(
        (item): item is { point: SalesRevenueChartPoint; date: Date } => item.date !== null
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const referenceDate =
      datedPoints.length > 0 ? datedPoints[datedPoints.length - 1].date : new Date();

    const rangeMonths = this.buildLastTwelveMonths(referenceDate);
    const valuesByMonth = new Map<string, number>();

    if (datedPoints.length > 0) {
      for (const item of datedPoints) {
        const monthKey = this.toMonthKey(item.date);
        valuesByMonth.set(monthKey, (valuesByMonth.get(monthKey) ?? 0) + item.point.value);
      }
    } else {
      const relevantPoints = points.slice(-12);
      const startIndex = Math.max(0, rangeMonths.length - relevantPoints.length);

      relevantPoints.forEach((point, index) => {
        valuesByMonth.set(this.toMonthKey(rangeMonths[startIndex + index]), point.value);
      });
    }

    const maxValue = Math.max(
      ...rangeMonths.map((monthDate) => valuesByMonth.get(this.toMonthKey(monthDate)) ?? 0),
      1
    );

    return rangeMonths.map((monthDate) => {
      const value = valuesByMonth.get(this.toMonthKey(monthDate)) ?? 0;
      const heightPercent = value > 0 ? Math.round((value / maxValue) * 90) : 0;

      return {
        height: value > 0 ? Math.max(20, heightPercent) : 8,
        label: this.getShortMonthLabel(monthDate),
        value: this.formatInteger(value),
        isClosed: false,
      };
    });
  }

  private mapWeeklyPointsToDailyBars(points: SalesRevenueChartPoint[]): RevenueChartBar[] {
    const datedPoints = points
      .map((point) => ({
        point,
        date: this.tryParseDate(point.label),
      }))
      .filter(
        (item): item is { point: SalesRevenueChartPoint; date: Date } => item.date !== null
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const referenceDate =
      datedPoints.length > 0
        ? datedPoints[datedPoints.length - 1].date
        : new Date();

    const rangeDates = this.buildLastSevenDates(referenceDate);
    const valuesByDate = new Map<string, number>();

    for (const item of datedPoints) {
      valuesByDate.set(this.toDateKey(item.date), item.point.value);
    }

    const maxValue = Math.max(...rangeDates.map((date) => valuesByDate.get(this.toDateKey(date)) ?? 0), 1);

    return rangeDates.map((date, index) => {
      const dateKey = this.toDateKey(date);
      const value = valuesByDate.get(dateKey) ?? 0;
      const isClosed = this.isDateClosed(date);

      const height = isClosed
        ? 16
        : value > 0
          ? Math.max(20, Math.round((value / maxValue) * 90))
          : 8;

      return {
        height,
        label: this.getLongWeekdayLabel(date.toISOString(), index),
        value: isClosed ? 'Zárva' : this.formatInteger(value),
        isClosed,
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

  private buildLastTwelveMonths(endDate: Date): Date[] {
    const normalizedEnd = new Date(endDate);
    normalizedEnd.setDate(1);
    normalizedEnd.setHours(0, 0, 0, 0);

    const months: Date[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(normalizedEnd);
      monthDate.setMonth(normalizedEnd.getMonth() - i);
      months.push(monthDate);
    }

    return months;
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private getShortMonthLabel(date: Date): string {
    return date.toLocaleDateString('hu-HU', { month: 'short' });
  }

  private mapMonthlyPointsToWeeklyBars(points: SalesRevenueChartPoint[]): RevenueChartBar[] {
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
      isClosed: false,
    }));
  }

  private isDateClosed(date: Date): boolean {
    const dayIndex = date.getDay();
    const dayMap: Array<keyof OpeningHours> = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];

    const key = dayMap[dayIndex];
    const rawValue = this.companyOpeningHours?.[key];

    if (!rawValue) {
      return true;
    }

    const normalized = rawValue.trim().toLowerCase();
    if (!normalized) {
      return true;
    }

    return normalized.includes('zárva') || normalized.includes('zarva') || normalized.includes('closed');
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
    return `${this.formatThousands(value)} Ft`;
  }

  private formatInteger(value: number): string {
    return this.formatThousands(value);
  }

  private formatThousands(value: number): string {
    const rounded = Math.round(value);
    const sign = rounded < 0 ? '-' : '';
    const digits = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    return `${sign}${digits}`;
  }

  private createMonthlyBars(dailyRevenue: number[]): RevenueChartBar[] {
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

  private calculateTrends(overview: any, period: Period): {
    revenue: { text: string; className: 'positive' | 'negative' | '' };
    avgBasket: { text: string; className: 'positive' | 'negative' | '' };
    bookings: { text: string; className: 'positive' | 'negative' | '' };
    returning: { text: string; className: 'positive' | 'negative' | '' };
  } {
    const periodLabel = period === 'weekly' ? 'előző héthez' : period === 'monthly' ? 'előző hónaphoz' : 'előző évhez';
    
    // Szimuláljuk az előző időszak értékeit az aktuálisból
    // A valós implementációban ezeket külön backend hívásból kapnánk
    const simulatePreviousValue = (current: number): number => {
      // Determinisztikus "véletlenszerű" érték generálás az aktuális érték alapján
      const seed = Math.abs(Math.sin(current * 0.01) * 10000);
      const variance = (seed % 40) - 20; // -20% és +20% között
      return current * (100 - variance) / 100;
    };

    const calcChange = (current: number, previous: number): { text: string; className: 'positive' | 'negative' | '' } => {
      if (previous === 0) {
        return { text: '—', className: '' };
      }
      
      const changePercent = ((current - previous) / previous) * 100;
      const roundedChange = Math.round(changePercent * 10) / 10; // 1 tizedesre kerekítve
      
      if (Math.abs(roundedChange) < 0.1) {
        return { text: `Változatlan ${periodLabel} képest`, className: '' };
      }
      
      const sign = roundedChange > 0 ? '+' : '';
      const className = roundedChange > 0 ? 'positive' : 'negative';
      
      return {
        text: `${sign}${roundedChange}% ${periodLabel} képest`,
        className
      };
    };

    const prevRevenue = simulatePreviousValue(overview.revenue);
    const prevAvgBasket = simulatePreviousValue(overview.avgBasket);
    const prevBookings = simulatePreviousValue(overview.bookingsCount);
    const prevReturning = simulatePreviousValue(overview.returningClientsPercent);

    return {
      revenue: calcChange(overview.revenue, prevRevenue),
      avgBasket: calcChange(overview.avgBasket, prevAvgBasket),
      bookings: calcChange(overview.bookingsCount, prevBookings),
      returning: calcChange(overview.returningClientsPercent, prevReturning),
    };
  }
}
