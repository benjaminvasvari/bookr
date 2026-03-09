import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-staff-chip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './staff-chip.component.html',
  styleUrl: './staff-chip.component.css'
})
export class StaffChipComponent {
  staffId = input.required<number>();
  staffName = input.required<string>();
  staffColor = input.required<string>();
  selected = input<boolean>(false);

  chipToggled = output<number>();
  colorChanged = output<{ staffId: number; color: string }>();

  pickerOpen = signal(false);
  customColor = signal('#3b82f6');
  popoverTop = signal(0);
  popoverLeft = signal(0);
  arrowLeft = signal(24);
  popoverWidth = signal(248);
  mobileSheet = signal(false);

  private activeTrigger: HTMLElement | null = null;

  readonly presetColors: string[] = [
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#eab308',
    '#84cc16',
    '#22c55e',
    '#10b981',
    '#14b8a6',
    '#06b6d4',
    '#0ea5e9',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#d946ef',
    '#ec4899'
  ];

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  onChipClick(): void {
    this.chipToggled.emit(this.staffId());
  }

  onPickerToggle(event: MouseEvent, triggerElement: HTMLElement): void {
    event.stopPropagation();
    const nextOpen = !this.pickerOpen();
    this.pickerOpen.set(nextOpen);
    if (nextOpen) {
      this.activeTrigger = triggerElement;
      this.customColor.set(this.normalizeHex(this.staffColor()));
      this.updatePopoverPosition(triggerElement);
    } else {
      this.closePicker();
    }
  }

  closePicker(): void {
    this.pickerOpen.set(false);
    this.activeTrigger = null;
  }

  onPresetColorClick(color: string, event: MouseEvent): void {
    event.stopPropagation();
    this.customColor.set(color);
    this.colorChanged.emit({ staffId: this.staffId(), color });
  }

  onCustomColorInput(event: Event): void {
    event.stopPropagation();
    const inputElement = event.target as HTMLInputElement;
    const color = this.normalizeHex(inputElement.value);
    this.customColor.set(color);
    this.colorChanged.emit({ staffId: this.staffId(), color });
  }

  onPopoverClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  isActiveColor(color: string): boolean {
    return this.normalizeHex(this.staffColor()) === this.normalizeHex(color);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.pickerOpen()) {
      return;
    }

    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.closePicker();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.pickerOpen() && this.activeTrigger) {
      this.updatePopoverPosition(this.activeTrigger);
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.pickerOpen() && this.activeTrigger) {
      this.updatePopoverPosition(this.activeTrigger);
    }
  }

  private updatePopoverPosition(triggerElement: HTMLElement): void {
    const triggerRect = triggerElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const isMobile = viewportWidth <= 480;
    const width = 248;
    this.popoverWidth.set(width);
    this.mobileSheet.set(isMobile);

    const estimatedPopoverHeight = 220;

    if (isMobile) {
      return;
    }

    const minLeft = 8;
    const maxLeft = Math.max(minLeft, viewportWidth - width - 8);
    const targetLeft = triggerRect.left - 10;
    const left = Math.min(Math.max(targetLeft, minLeft), maxLeft);
    const belowTop = triggerRect.bottom + 10;
    const aboveTop = triggerRect.top - estimatedPopoverHeight - 10;
    const top = belowTop + estimatedPopoverHeight > viewportHeight - 8
      ? Math.max(8, aboveTop)
      : belowTop;

    const triggerCenter = triggerRect.left + triggerRect.width / 2;
    const rawArrowLeft = triggerCenter - left;
    const clampedArrowLeft = Math.min(Math.max(rawArrowLeft, 18), width - 18);

    this.popoverLeft.set(left);
    this.popoverTop.set(top);
    this.arrowLeft.set(clampedArrowLeft);
  }

  private normalizeHex(hex: string): string {
    return hex?.startsWith('#') ? hex.toLowerCase() : `#${hex?.toLowerCase() ?? ''}`;
  }
}
