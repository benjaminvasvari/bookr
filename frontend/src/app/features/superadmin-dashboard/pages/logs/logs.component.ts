import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperadminService } from '../../../../core/services/superadmin.service';

@Component({
  selector: 'app-superadmin-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css'],
})
export class SuperadminLogsComponent {
  constructor(private superadminService: SuperadminService) {}

  onAddFilter(): void {
    this.superadminService.runAction('add-log-filter');
  }

  onExportLogs(): void {
    this.superadminService.runAction('export-logs');
  }

  onViewLog(logId: string): void {
    this.superadminService.runAction('view-log', logId);
  }

  onInvestigateLog(logId: string): void {
    this.superadminService.runAction('investigate-log', logId);
  }
}
