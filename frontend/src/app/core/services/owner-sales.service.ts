import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export type SalesOverviewPeriod = 'week' | 'month' | 'year';

export interface SalesTopService {
  name: string;
  bookings: number;
  revenue: string;
}

export interface SalesOverviewKpi {
  revenue: number;
  avgBasket: number;
  bookingsCount: number;
  returningClientsPercent: number;
}

export interface SalesRevenueChartPoint {
  label: string;
  value: number;
}

@Injectable({
  providedIn: 'root',
})
export class OwnerSalesService {
    getSalesTopServices(companyId: number, period: SalesOverviewPeriod): Observable<SalesTopService[]> {
      return this.http.get<any>(
        `${this.apiUrl}${API_ENDPOINTS.APPOINTMENTS.SALES_TOP_SERVICES(companyId, period)}`
      ).pipe(
        map((response) => this.normalizeTopServices(response))
      );
    }

    private normalizeTopServices(payload: any): SalesTopService[] {
      if (Array.isArray(payload)) {
        return payload.map(this.mapTopServiceItem);
      }
      if (payload && typeof payload === 'object') {
        const arr = payload.data || payload.items || payload.result || Object.values(payload);
        if (Array.isArray(arr)) {
          return arr.map(this.mapTopServiceItem);
        }
      }
      return [];
    }

    private mapTopServiceItem(item: any): SalesTopService {
      const rawRevenue = item.revenue ?? item.currency ?? item.totalRevenue;
      const revenueValue =
        typeof rawRevenue === 'number' || typeof rawRevenue === 'string'
          ? `${new Intl.NumberFormat('hu-HU').format(Number(rawRevenue) || 0)} Ft`
          : '0 Ft';

      return {
        name: item.name || item.serviceName || '',
        bookings: Number(item.bookings ?? item.count ?? item.clientCount ?? 0),
        revenue: revenueValue,
      };
    }
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getSalesOverview(companyId: number, period: SalesOverviewPeriod): Observable<SalesOverviewKpi> {
    return forkJoin({
      revenue: this.getNumericValue(
        `${this.apiUrl}${API_ENDPOINTS.APPOINTMENTS.SALES_OVERVIEW_REVENUE(companyId, period)}`
      ),
      avgBasket: this.getNumericValue(
        `${this.apiUrl}${API_ENDPOINTS.APPOINTMENTS.SALES_OVERVIEW_AVG_BASKET(companyId, period)}`
      ),
      bookingsCount: this.getNumericValue(
        `${this.apiUrl}${API_ENDPOINTS.APPOINTMENTS.SALES_OVERVIEW_BOOKINGS_COUNT(companyId, period)}`
      ),
      returningClientsRaw: this.getNumericValue(
        `${this.apiUrl}${API_ENDPOINTS.APPOINTMENTS.SALES_OVERVIEW_RETURNING_CLIENTS(companyId, period)}`
      ),
    }).pipe(
      map(({ revenue, avgBasket, bookingsCount, returningClientsRaw }) => ({
        revenue,
        avgBasket,
        bookingsCount,
        returningClientsPercent: this.normalizePercent(returningClientsRaw),
      }))
    );
  }

  getSalesRevenueChart(
    companyId: number,
    period: SalesOverviewPeriod
  ): Observable<SalesRevenueChartPoint[]> {
    const urls = this.buildSalesRevenueChartUrls(companyId, period);
    return this.requestSalesRevenueChartWithFallback(urls, period, 0);
  }

  private requestSalesRevenueChartWithFallback(
    urls: string[],
    period: SalesOverviewPeriod,
    index: number
  ): Observable<SalesRevenueChartPoint[]> {
    return this.http.get<unknown>(urls[index]).pipe(
      map((response) => this.extractChartPoints(response, period)),
      catchError((error: unknown) => {
        const status = (error as { status?: number })?.status;
        const canRetry = status !== undefined && status >= 500 && index < urls.length - 1;

        if (canRetry) {
          return this.requestSalesRevenueChartWithFallback(urls, period, index + 1);
        }

        return throwError(() => error);
      })
    );
  }

  private buildSalesRevenueChartUrls(companyId: number, period: SalesOverviewPeriod): string[] {
    const basePath = '/appointments/getSalesRevenueChart';
    const periodVariants = this.getPeriodVariants(period);

    return periodVariants.map(
      (periodValue) => `${this.apiUrl}${basePath}?companyId=${companyId}&period=${periodValue}`
    );
  }

  private getPeriodVariants(period: SalesOverviewPeriod): string[] {
    const legacyPeriod = period === 'week' ? 'weekly' : period === 'month' ? 'monthly' : 'yearly';
    return [
      period,
      period.toUpperCase(),
      legacyPeriod,
      legacyPeriod.toUpperCase(),
    ];
  }

  private getNumericValue(url: string): Observable<number> {
    return this.http.get<unknown>(url).pipe(
      map((response) => {
        const parsed = this.extractNumber(response);
        return parsed ?? 0;
      })
    );
  }

  private extractNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.replace(/\s/g, '').replace(',', '.');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const parsed = this.extractNumber(item);
        if (parsed !== null) {
          return parsed;
        }
      }
      return null;
    }

    if (value && typeof value === 'object') {
      const objectValue = value as Record<string, unknown>;
      const priorityKeys = ['data', 'value', 'result', 'count', 'total', 'avg', 'percentage'];

      for (const key of priorityKeys) {
        if (key in objectValue) {
          const parsed = this.extractNumber(objectValue[key]);
          if (parsed !== null) {
            return parsed;
          }
        }
      }

      for (const nestedValue of Object.values(objectValue)) {
        const parsed = this.extractNumber(nestedValue);
        if (parsed !== null) {
          return parsed;
        }
      }
    }

    return null;
  }

  private normalizePercent(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    if (value <= 1) {
      return Math.round(value * 100);
    }

    return Math.round(value);
  }

  private extractChartPoints(
    payload: unknown,
    period: SalesOverviewPeriod
  ): SalesRevenueChartPoint[] {
    const points = this.findChartArray(payload, period);

    if (points.length > 0) {
      return points;
    }

    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const mapped = Object.entries(payload as Record<string, unknown>)
        .map(([key, value]) => {
          const numericValue = this.extractNumber(value);
          if (numericValue === null) {
            return null;
          }

          return {
            label: key,
            value: numericValue,
          };
        })
        .filter((point): point is SalesRevenueChartPoint => point !== null);

      if (mapped.length > 0) {
        return mapped;
      }
    }

    return [];
  }

  private findChartArray(
    payload: unknown,
    period: SalesOverviewPeriod
  ): SalesRevenueChartPoint[] {
    if (Array.isArray(payload)) {
      return payload
        .map((item, index) => this.mapChartItem(item, period, index))
        .filter((point): point is SalesRevenueChartPoint => point !== null);
    }

    if (payload && typeof payload === 'object') {
      const objectPayload = payload as Record<string, unknown>;
      const preferredKeys = ['data', 'items', 'chart', 'values', 'result'];

      for (const key of preferredKeys) {
        if (key in objectPayload) {
          const nestedPoints = this.findChartArray(objectPayload[key], period);
          if (nestedPoints.length > 0) {
            return nestedPoints;
          }
        }
      }
    }

    return [];
  }

  private mapChartItem(
    item: unknown,
    period: SalesOverviewPeriod,
    index: number
  ): SalesRevenueChartPoint | null {
    if (typeof item === 'number' || typeof item === 'string') {
      const numericValue = this.extractNumber(item);
      if (numericValue === null) {
        return null;
      }

      return {
        label: this.defaultChartLabel(period, index),
        value: numericValue,
      };
    }

    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const source = item as Record<string, unknown>;

      const label = this.extractStringField(source, ['label', 'name', 'period', 'month', 'day', 'date']);
      const value = this.extractNumericField(source, ['value', 'revenue', 'amount', 'total', 'sum', 'y']);

      if (value === null) {
        return null;
      }

      return {
        label: label || this.defaultChartLabel(period, index),
        value,
      };
    }

    return null;
  }

  private extractStringField(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const raw = source[key];
      if (typeof raw === 'string' && raw.trim().length > 0) {
        return raw.trim();
      }
    }

    return null;
  }

  private extractNumericField(source: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      if (!(key in source)) {
        continue;
      }

      const parsed = this.extractNumber(source[key]);
      if (parsed !== null) {
        return parsed;
      }
    }

    for (const value of Object.values(source)) {
      const parsed = this.extractNumber(value);
      if (parsed !== null) {
        return parsed;
      }
    }

    return null;
  }

  private defaultChartLabel(period: SalesOverviewPeriod, index: number): string {
    if (period === 'week') {
      const labels = ['H', 'K', 'Sz', 'Cs', 'P', 'Szo', 'V'];
      return labels[index] ?? `${index + 1}`;
    }

    if (period === 'year') {
      const labels = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];
      return labels[index] ?? `${index + 1}`;
    }

    return `${index + 1}`;
  }
}
