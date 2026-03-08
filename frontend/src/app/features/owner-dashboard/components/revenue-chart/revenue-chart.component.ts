import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface RevenueChartBar {
  height: number;
  label: string;
  value: string;
  isClosed?: boolean;
}

export type RevenueChartVariant = 'overview' | 'sales';

interface ChartPoint {
  x: number;
  y: number;
}

interface XTick {
  x: number;
  label: string;
  anchor: 'start' | 'middle' | 'end';
}

interface YTick {
  y: number;
  label: string;
}

interface CubicSegment {
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
  x: number;
  y: number;
}

interface OverviewBarItem {
  label: string;
  shortLabel: string;
  value: number;
  displayValue: string;
  fullValueLabel: string;
  heightPercent: number;
  isPeak: boolean;
  isClosed: boolean;
  statusLabel: string;
}

interface SalesBarItem {
  label: string;
  value: number;
  displayValue: string;
  fullValueLabel: string;
  heightPercent: number;
  isPeak: boolean;
  isClosed: boolean;
}

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue-chart.component.html',
  styleUrl: './revenue-chart.component.css',
})
export class RevenueChartComponent {
  @Input() bars: RevenueChartBar[] = [];
  @Input() isLoading = false;
  @Input() errorMessage = '';
  @Input() caption = '';
  @Input() variant: RevenueChartVariant = 'overview';

  private readonly svgWidth = 860;
  private readonly svgHeight = 276;
  private readonly axisLeft = 54;
  private readonly axisRight = 78;
  private readonly axisTop = 14;
  private readonly axisBottom = 212;
  private static nextId = 0;
  private readonly chartId = ++RevenueChartComponent.nextId;
  private readonly yTickCount = 4;
  private readonly salesYAxisMaxValue = 100_000;
  private readonly salesTickValues = [100_000, 80_000, 60_000, 40_000, 20_000];

  get axisStartX(): number {
    return this.axisLeft;
  }

  get axisEndX(): number {
    return this.svgWidth - this.axisRight;
  }

  get axisTopY(): number {
    return this.axisTop;
  }

  get axisBottomY(): number {
    return this.axisBottom;
  }

  get xLabelY(): number {
    return this.axisBottomY + (this.variant === 'sales' ? 40 : 28);
  }

  get areaGradientId(): string {
    return `chartAreaGradient-${this.chartId}`;
  }

  get clipPathId(): string {
    return `chartClipPath-${this.chartId}`;
  }

  get hasRenderableData(): boolean {
    return this.bars.length > 0;
  }

  get viewBox(): string {
    return `0 0 ${this.svgWidth} ${this.svgHeight}`;
  }

  get isOverviewVariant(): boolean {
    return this.variant === 'overview';
  }

  get chartVariantClass(): string {
    return this.variant === 'sales' ? 'sales' : 'overview';
  }

  get points(): ChartPoint[] {
    if (this.bars.length === 0) {
      return [];
    }

    const count = this.bars.length;
    const plotWidth = this.axisEndX - this.axisStartX;
    const plotHeight = this.axisBottomY - this.axisTopY;
    const maxValue = Math.max(this.maxYAxisValue, 1);
    const values = this.normalizedValues;

    return this.bars.map((_, index) => {
      const x =
        count === 1
          ? this.axisStartX + plotWidth / 2
          : this.axisStartX + (index * plotWidth) / (count - 1);
      const valueRatio = Math.max(0, Math.min(1, values[index] / maxValue));
      const y = this.axisBottomY - valueRatio * plotHeight;

      return { x, y };
    });
  }

  get xTicks(): XTick[] {
    const lastIndex = this.points.length - 1;

    return this.points.map((point, index) => ({
      x: point.x,
      label: this.displayLabel(this.bars[index]?.label ?? ''),
      anchor: index === 0 ? 'start' : index === lastIndex ? 'end' : 'middle',
    }));
  }

  get yTicks(): YTick[] {
    if (this.variant === 'sales') {
      const plotHeight = this.axisBottomY - this.axisTopY;
      const maxValue = this.salesYAxisMaxValue;

      return this.salesTickValues.map((value) => {
        const ratio = value / maxValue;
        const y = this.axisBottomY - ratio * plotHeight;

        return {
          y,
          label: this.formatForint(value, true),
        };
      });
    }

    const plotHeight = this.axisBottomY - this.axisTopY;
    const maxValue = this.maxYAxisValue;

    return Array.from({ length: this.yTickCount }, (_, index) => {
      const ratio = index / (this.yTickCount - 1);
      const value = maxValue * (1 - ratio);
      const y = this.axisTopY + ratio * plotHeight;

      return {
        y,
        label: this.formatForint(value, true),
      };
    });
  }

  get linePath(): string {
    const points = this.points;
    if (points.length === 0) {
      return '';
    }

    if (points.length === 1) {
      const point = points[0];
      return `M ${point.x} ${point.y}`;
    }

    const segments = this.toSmoothBezierSegments(points);
    let path = `M ${points[0].x} ${points[0].y}`;

    for (const segment of segments) {
      path += ` C ${segment.cp1x} ${segment.cp1y}, ${segment.cp2x} ${segment.cp2y}, ${segment.x} ${segment.y}`;
    }

    return path;
  }

  get areaPath(): string {
    const points = this.points;
    if (points.length === 0) {
      return '';
    }

    if (points.length === 1) {
      const point = points[0];
      return `M ${point.x} ${this.axisBottomY} L ${point.x} ${point.y} L ${point.x} ${this.axisBottomY} Z`;
    }

    const first = points[0];
    const last = points[points.length - 1];

    return `${this.linePath} L ${last.x} ${this.axisBottomY} L ${first.x} ${this.axisBottomY} Z`;
  }

  get overviewBars(): OverviewBarItem[] {
    const values = this.normalizedValues;
    const maxValue = Math.max(...values, 0);
    const peakValue = Math.max(...values, 0);

    return this.bars.map((bar, index) => {
      const value = values[index] ?? 0;
      const isPeak = peakValue > 0 && value === peakValue;
      const isClosed = bar.isClosed ?? value === 0;

      return {
        label: bar.label,
        shortLabel: this.displayLabel(bar.label),
        value,
        displayValue: this.formatOverviewValue(value, 'bar'),
        fullValueLabel: this.formatForint(value),
        heightPercent: maxValue > 0 ? Math.round((value / maxValue) * 100) : 0,
        isPeak,
        isClosed,
        statusLabel: isPeak ? 'csúcsnap' : isClosed ? 'nincs' : 'aktív nap',
      };
    });
  }

  get salesBars(): SalesBarItem[] {
    const values = this.normalizedValues;
    const maxValue = Math.max(...values, 0);
    const peakValue = Math.max(...values, 0);

    return this.bars.map((bar, index) => {
      const value = values[index] ?? 0;
      const isClosed = bar.isClosed ?? false;

      return {
        label: this.displayLabel(bar.label),
        value,
        displayValue: this.formatOverviewValue(value, 'bar'),
        fullValueLabel: isClosed ? 'Zárva' : this.formatForint(value),
        heightPercent: maxValue > 0 ? Math.max(6, Math.round((value / maxValue) * 100)) : 6,
        isPeak: peakValue > 0 && value === peakValue,
        isClosed,
      };
    });
  }

  get totalValueLabel(): string {
    return this.formatOverviewValue(this.totalValue, 'summary');
  }

  get averageValueLabel(): string {
    return this.formatOverviewValue(this.averageValue, 'summary');
  }

  get peakValueLabel(): string {
    const peakBar = this.peakBar;

    if (!peakBar || peakBar.value <= 0) {
      return 'Nincs bevétel';
    }

    return this.formatOverviewValue(peakBar.value, 'summary');
  }

  get peakDayLabel(): string {
    const peakBar = this.peakBar;

    if (!peakBar || peakBar.value <= 0) {
      return 'Az elmúlt 7 napban nem volt forgalom';
    }

    return `${peakBar.shortLabel} volt a legerősebb nap`;
  }

  get activeDaysLabel(): string {
    return `${this.activeDayCount}/${this.bars.length || 7} aktív nap`;
  }

  get salesTotalLabel(): string {
    return this.formatOverviewValue(this.totalValue, 'summary');
  }

  get salesAverageLabel(): string {
    return this.formatOverviewValue(this.averageValue, 'summary');
  }

  get salesPeakLabel(): string {
    const peakBar = this.salesPeakBar;

    if (!peakBar || peakBar.value <= 0) {
      return 'Nincs csúcs';
    }

    return `${peakBar.label}: ${this.formatOverviewValue(peakBar.value, 'summary')}`;
  }

  get maxYAxisValue(): number {
    if (this.variant === 'sales') {
      return this.salesYAxisMaxValue;
    }

    const values = this.normalizedValues;

    if (values.length === 0) {
      return 0;
    }

    return Math.max(...values, 0);
  }

  displayLabel(rawLabel: string): string {
    const parsedDate = this.tryParseDate(rawLabel);
    if (parsedDate) {
      const longWeekday = parsedDate.toLocaleDateString('hu-HU', { weekday: 'long' });
      return this.variant === 'overview' ? this.toOverviewWeekdayLabel(longWeekday) : longWeekday;
    }

    return this.variant === 'overview' ? this.toOverviewWeekdayLabel(rawLabel) : rawLabel;
  }

  trackByLabel(index: number, bar: RevenueChartBar): string {
    return `${bar.label}-${index}`;
  }

  trackByOverviewBar(index: number, bar: OverviewBarItem): string {
    return `${bar.label}-${index}`;
  }

  trackBySalesBar(index: number, bar: SalesBarItem): string {
    return `${bar.label}-${index}`;
  }

  trackByPointIndex(index: number): number {
    return index;
  }

  private get normalizedValues(): number[] {
    return this.bars.map((bar) => {
      const parsed = this.parseNumericValue(bar.value);
      if (parsed !== null) {
        return Math.max(0, parsed);
      }

      return this.barHeightToValue(bar.height, this.maxYAxisValue);
    });
  }

  private get totalValue(): number {
    return this.normalizedValues.reduce((sum, value) => sum + value, 0);
  }

  private get averageValue(): number {
    return this.normalizedValues.length > 0 ? this.totalValue / this.normalizedValues.length : 0;
  }

  private get activeDayCount(): number {
    return this.normalizedValues.filter((value) => value > 0).length;
  }

  private get peakBar(): OverviewBarItem | null {
    const bars = this.overviewBars;

    if (bars.length === 0) {
      return null;
    }

    return bars.reduce((currentPeak, bar) => (bar.value > currentPeak.value ? bar : currentPeak), bars[0]);
  }

  private get salesPeakBar(): SalesBarItem | null {
    const bars = this.salesBars;

    if (bars.length === 0) {
      return null;
    }

    return bars.reduce((currentPeak, bar) => (bar.value > currentPeak.value ? bar : currentPeak), bars[0]);
  }

  private formatOverviewValue(value: number, mode: 'summary' | 'bar'): string {
    const absoluteValue = Math.abs(value);

    if (absoluteValue < 10_000) {
      return this.formatForint(value);
    }

    if (mode === 'summary' && absoluteValue < 100_000) {
      return this.formatForint(value);
    }

    return this.formatForint(value, true);
  }

  private parseNumericValue(value: string): number | null {
    const normalized = (value || '').replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const numeric = Number(normalized);

    if (!Number.isFinite(numeric)) {
      return null;
    }

    return numeric;
  }

  private formatForint(value: number, short = false): string {
    if (!short) {
      return `${Math.round(value).toLocaleString('hu-HU')} Ft`;
    }

    const absolute = Math.abs(value);

    if (absolute >= 1_000_000) {
      const million = Math.round((value / 1_000_000) * 10) / 10;
      return `${million.toLocaleString('hu-HU', {
        minimumFractionDigits: Number.isInteger(million) ? 0 : 1,
        maximumFractionDigits: 1,
      })} M Ft`;
    }

    if (absolute >= 1_000) {
      const thousand = Math.round(value / 1_000);
      return `${thousand.toLocaleString('hu-HU')} e Ft`;
    }

    return `${Math.round(value).toLocaleString('hu-HU')} Ft`;
  }

  private barHeightToValue(height: number, maxValue: number): number {
    const boundedHeight = Math.max(0, Math.min(100, height));
    return (boundedHeight / 100) * maxValue;
  }

  private toSmoothBezierSegments(points: ChartPoint[]): CubicSegment[] {
    const tension = 0.22;
    const segments: CubicSegment[] = [];

    for (let index = 0; index < points.length - 1; index++) {
      const p0 = points[Math.max(0, index - 1)];
      const p1 = points[index];
      const p2 = points[index + 1];
      const p3 = points[Math.min(points.length - 1, index + 2)];

      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      segments.push({ cp1x, cp1y, cp2x, cp2y, x: p2.x, y: p2.y });
    }

    return segments;
  }

  private tryParseDate(value: string): Date | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const normalized = value.includes('T') ? value : `${value}T00:00:00`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toOverviewWeekdayLabel(value: string): string {
    const normalized = (value || '').trim().toLowerCase();

    if (normalized.startsWith('hétf')) return 'H';
    if (normalized.startsWith('kedd')) return 'K';
    if (normalized.startsWith('szerda')) return 'Sze';
    if (normalized.startsWith('csüt')) return 'Cs';
    if (normalized.startsWith('pént')) return 'P';
    if (normalized.startsWith('szomb')) return 'Szo';
    if (normalized.startsWith('vasár')) return 'V';

    return normalized ? normalized.charAt(0).toUpperCase() : '';
  }
}
