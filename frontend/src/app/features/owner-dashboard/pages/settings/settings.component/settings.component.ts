import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TemporaryClosingPeriod {
  startDate: string;
  endDate: string;
  reason: string;
}

@Component({
  selector: 'app-settings.component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  temporaryClosures: TemporaryClosingPeriod[] = [
    {
      startDate: '',
      endDate: '',
      reason: '',
    },
  ];

  addTemporaryClosure(): void {
    this.temporaryClosures.push({
      startDate: '',
      endDate: '',
      reason: '',
    });
  }

  removeTemporaryClosure(index: number): void {
    if (this.temporaryClosures.length === 1) {
      this.temporaryClosures[0] = {
        startDate: '',
        endDate: '',
        reason: '',
      };
      return;
    }

    this.temporaryClosures.splice(index, 1);
  }

}
