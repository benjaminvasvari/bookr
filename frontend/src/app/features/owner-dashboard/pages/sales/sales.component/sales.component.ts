import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class SalesComponent {
  selectedPeriod: Period = 'weekly';
  private readonly now = new Date();
  private readonly rollingMonthDates = this.createRollingMonthDates();

  private readonly monthlyDailyRevenue = [
    32000, 35000, 30000, 41000, 36000, 38000, 44000,
    34000, 37000, 39000, 42000, 40000, 45000, 47000,
    36000, 38000, 41000, 43000, 45000, 46000, 49000,
    37000, 39000, 42000, 44000, 43000, 47000, 50000,
    52000, 54000,
  ];

  private readonly rollingMonthDailyRevenue = this.createRollingMonthDailyRevenue(this.rollingMonthDates.length);

  private readonly data: Record<Period, {
    kpi: KpiData;
    bars: BarData[];
    chartCaption: string;
    breakdown: BreakdownRow[];
    services: ServiceRow[];
    transactions: Transaction[];
  }> = {
    weekly: {
      kpi: {
        totalRevenue: '248 000 Ft',
        avgBasket: '12 400 Ft',
        bookings: '20',
        returningClients: '42%',
        totalRevenueTrend: '+12% az előző héthez képest',
        totalRevenueTrendClass: 'positive',
        avgBasketTrend: '-3% az előző héthez képest',
        avgBasketTrendClass: 'negative',
        bookingsTrend: '+4 foglalás az előző héthez képest',
        bookingsTrendClass: 'positive',
        returningTrend: '+2% az előző héthez képest',
        returningTrendClass: 'positive',
      },
      bars: [
        { height: 40, label: 'H', value: '32 000' }, { height: 60, label: 'K', value: '48 000' }, { height: 55, label: 'Sze', value: '44 000' },
        { height: 80, label: 'Cs', value: '64 000' }, { height: 65, label: 'P', value: '52 000' }, { height: 75, label: 'Szo', value: '60 000' }, { height: 90, label: 'V', value: '72 000' },
      ],
      chartCaption: 'Napi bevétel az elmúlt 7 napban.',
      breakdown: [
        { label: 'Hétfő', percent: 65, value: '52 000 Ft' },
        { label: 'Kedd', percent: 48, value: '38 000 Ft' },
        { label: 'Szerda', percent: 72, value: '58 000 Ft' },
        { label: 'Csütörtök', percent: 58, value: '46 000 Ft' },
        { label: 'Péntek', percent: 80, value: '64 000 Ft' },
        { label: 'Szombat', percent: 90, value: '72 000 Ft' },
      ],
      services: [
        { name: 'Hajvágás', bookings: 8, revenue: '68 000 Ft' },
        { name: 'Relax masszázs', bookings: 4, revenue: '42 000 Ft' },
        { name: 'Szakáll igazítás', bookings: 6, revenue: '31 000 Ft' },
      ],
      transactions: [
        { date: '2026.02.17', client: 'Kiss Anna', service: 'Hajvágás', amount: '8 500 Ft', success: true },
        { date: '2026.02.16', client: 'Gábor Máté', service: 'Relax masszázs', amount: '14 000 Ft', success: true },
        { date: '2026.02.15', client: 'Szabó Petra', service: 'Festés', amount: '18 000 Ft', success: false },
      ],
    },
    monthly: {
      kpi: {
        totalRevenue: '1 120 000 Ft',
        avgBasket: '11 900 Ft',
        bookings: '94',
        returningClients: '46%',
        totalRevenueTrend: '+8% az előző hónaphoz képest',
        totalRevenueTrendClass: 'positive',
        avgBasketTrend: '-4% az előző hónaphoz képest',
        avgBasketTrendClass: 'negative',
        bookingsTrend: '+11 foglalás az előző hónaphoz képest',
        bookingsTrendClass: 'positive',
        returningTrend: '+4% az előző hónaphoz képest',
        returningTrendClass: 'positive',
      },
      bars: this.createMonthlyBars(this.rollingMonthDailyRevenue, this.rollingMonthDates),
      chartCaption: 'Fix 7 napos blokkokra aggregált bevétel az elmúlt 1 hónapból.',
      breakdown: [
        { label: '1. hét (7 nap)', percent: 67, value: '256 000 Ft' },
        { label: '2. hét (7 nap)', percent: 77, value: '284 000 Ft' },
        { label: '3. hét (7 nap)', percent: 85, value: '298 000 Ft' },
        { label: '4. hét (7 nap)', percent: 84, value: '302 000 Ft' },
        { label: '5. blokk (2 nap)', percent: 30, value: '106 000 Ft' },
      ],
      services: [
        { name: 'Hajvágás', bookings: 32, revenue: '272 000 Ft' },
        { name: 'Relax masszázs', bookings: 18, revenue: '252 000 Ft' },
        { name: 'Szakáll igazítás', bookings: 24, revenue: '192 000 Ft' },
      ],
      transactions: [
        { date: '2026.02.14', client: 'Nagy Bálint', service: 'Hajvágás', amount: '8 500 Ft', success: true },
        { date: '2026.02.10', client: 'Varga Réka', service: 'Festés', amount: '22 000 Ft', success: true },
        { date: '2026.02.05', client: 'Tóth Miklós', service: 'Masszázs', amount: '16 000 Ft', success: false },
      ],
    },
    yearly: {
      kpi: {
        totalRevenue: '13 440 000 Ft',
        avgBasket: '12 200 Ft',
        bookings: '1 102',
        returningClients: '51%',
        totalRevenueTrend: '+15% az előző évhez képest',
        totalRevenueTrendClass: 'positive',
        avgBasketTrend: '+2% az előző évhez képest',
        avgBasketTrendClass: 'positive',
        bookingsTrend: '+98 foglalás az előző évhez képest',
        bookingsTrendClass: 'positive',
        returningTrend: '+5% az előző évhez képest',
        returningTrendClass: 'positive',
      },
      bars: [
        { height: 45, label: 'Jan', value: '890 e' }, { height: 55, label: 'Feb', value: '1,1 M' }, { height: 60, label: 'Már', value: '1,2 M' }, { height: 70, label: 'Ápr', value: '1,4 M' },
        { height: 80, label: 'Máj', value: '1,6 M' }, { height: 90, label: 'Jún', value: '1,8 M' }, { height: 85, label: 'Júl', value: '1,7 M' }, { height: 78, label: 'Aug', value: '1,5 M' },
        { height: 72, label: 'Szep', value: '1,4 M' }, { height: 65, label: 'Okt', value: '1,3 M' }, { height: 58, label: 'Nov', value: '1,1 M' }, { height: 50, label: 'Dec', value: '990 e' },
      ],
      chartCaption: 'Havi bevétel bontás az elmúlt évben.',
      breakdown: [
        { label: 'Q1', percent: 60, value: '2 850 000 Ft' },
        { label: 'Q2', percent: 85, value: '4 020 000 Ft' },
        { label: 'Q3', percent: 78, value: '3 680 000 Ft' },
        { label: 'Q4', percent: 62, value: '2 890 000 Ft' },
      ],
      services: [
        { name: 'Hajvágás', bookings: 380, revenue: '3 230 000 Ft' },
        { name: 'Relax masszázs', bookings: 210, revenue: '2 940 000 Ft' },
        { name: 'Szakáll igazítás', bookings: 290, revenue: '2 320 000 Ft' },
      ],
      transactions: [
        { date: '2026.01.28', client: 'Horváth Zsolt', service: 'Hajvágás', amount: '8 500 Ft', success: true },
        { date: '2026.01.15', client: 'Fekete Dóra', service: 'Festés', amount: '22 000 Ft', success: true },
        { date: '2025.12.22', client: 'Simon Péter', service: 'Masszázs', amount: '16 000 Ft', success: false },
      ],
    },
  };

  get current() {
    return this.data[this.selectedPeriod];
  }

  get periodLabel(): string {
    return { weekly: 'Utolsó 7 nap', monthly: 'Elmúlt 1 hónap', yearly: 'Utolsó 12 hónap' }[this.selectedPeriod];
  }

  selectPeriod(period: Period): void {
    this.selectedPeriod = period;
  }

  private createMonthlyBars(dailyRevenue: number[], dates: Date[]): BarData[] {
    const buckets: Array<{ total: number; start: Date; end: Date }> = [];
    const bucketSize = 7;

    for (let index = 0; index < dailyRevenue.length; index += bucketSize) {
      const total = dailyRevenue
        .slice(index, index + bucketSize)
        .reduce((sum, current) => sum + current, 0);
      const start = dates[index];
      const end = dates[Math.min(index + bucketSize - 1, dates.length - 1)];

      buckets.push({ total, start, end });
    }

    const maxTotal = Math.max(...buckets.map((bucket) => bucket.total), 1);
    const includeYear = dates[0].getFullYear() !== dates[dates.length - 1].getFullYear();

    return buckets.map((bucket) => ({
      height: Math.max(20, Math.round((bucket.total / maxTotal) * 90)),
      label: `${this.formatDateLabel(bucket.start, includeYear)}-${this.formatDateLabel(bucket.end, includeYear)}`,
      value: `${Math.round(bucket.total / 1000)} e`,
    }));
  }

  private createRollingMonthDates(): Date[] {
    const endDate = new Date(this.now);
    endDate.setHours(0, 0, 0, 0);

    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 1);

    const dates: Date[] = [];
    for (const current = new Date(startDate); current <= endDate; current.setDate(current.getDate() + 1)) {
      dates.push(new Date(current));
    }

    return dates;
  }

  private createRollingMonthDailyRevenue(dayCount: number): number[] {
    return Array.from({ length: dayCount }, (_, index) => {
      return this.monthlyDailyRevenue[index % this.monthlyDailyRevenue.length];
    });
  }

  private formatDateLabel(date: Date, includeYear: boolean): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');

    if (includeYear) {
      return `${date.getFullYear()}.${mm}.${dd}`;
    }

    return `${mm}.${dd}`;
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
