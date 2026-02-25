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

  private readonly svgWidth = 700;
  private readonly svgHeight = 238;
  private readonly axisLeft = 72;
  private readonly axisRight = 14;
  private readonly axisTop = 10;
  private readonly axisBottom = 188;
  private static nextId = 0;
  private readonly chartId = ++RevenueChartComponent.nextId;
  private readonly yTickCount = 4;

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

  get areaGradientId(): string {
    return `chartAreaGradient-${this.chartId}`;
  }

  get clipPathId(): string {
    return `chartClipPath-${this.chartId}`;
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

  get hasRenderableData(): boolean {
    return this.bars.length > 0;
  }

  get viewBox(): string {
    return `0 0 ${this.svgWidth} ${this.svgHeight}`;
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

  get yTicks(): YTick[] {
    const plotHeight = this.axisBottomY - this.axisTopY;
    const maxValue = this.maxYAxisValue;
    const useShortFormat = this.variant === 'overview';

    return Array.from({ length: this.yTickCount }, (_, index) => {
      const ratio = index / (this.yTickCount - 1);
      const value = maxValue * (1 - ratio);
      const y = this.axisTopY + ratio * plotHeight;

      return {
        y,
        label: this.formatForint(value, useShortFormat),
      };
    });
  }

  get maxYAxisValue(): number {
    const values = this.normalizedValues;

    if (values.length === 0) {
      return 0;
    }

    return Math.max(...values, 0);
  }

  get chartVariantClass(): string {
    return this.variant === 'sales' ? 'sales' : 'overview';
  }

  displayLabel(rawLabel: string): string {
    const parsedDate = this.tryParseDate(rawLabel);
    if (parsedDate) {
      const longWeekday = parsedDate.toLocaleDateString('hu-HU', { weekday: 'long' });
      return this.variant === 'overview' ? this.toOverviewWeekdayLabel(longWeekday) : longWeekday;
    }

    return this.variant === 'overview' ? this.toOverviewWeekdayLabel(rawLabel) : rawLabel;
  }

  get xTicks(): XTick[] {
    return this.points.map((point, index) => ({
      x: point.x,
      label: this.displayLabel(this.bars[index]?.label ?? ''),
    }));
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

  trackByLabel(index: number, bar: RevenueChartBar): string {
    return `${bar.label}-${index}`;
  }

  trackByPointIndex(index: number): number {
    return index;
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
      return `${value.toLocaleString('hu-HU')} Ft`;
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
