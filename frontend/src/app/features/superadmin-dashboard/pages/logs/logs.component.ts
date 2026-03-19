import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperadminService } from '../../../../core/services/superadmin.service';
import { createBookrExportWorkbook } from '../../../../core/utils/bookr-export.util';

type LogSeverity = 'error' | 'warning' | 'success' | 'info';
type LogType = 'all' | 'auth' | 'booking' | 'role' | 'api';
type LogActionId = 'investigate' | 'block-user' | 'revert-role' | 'view-booking' | 'retry-api' | 'open-account';

interface LogAction {
  id: LogActionId;
  label: string;
  tone: 'primary' | 'secondary' | 'danger';
}

interface LogEntry {
  id: string;
  time: string;
  title: string;
  actor: string;
  summary: string;
  severity: LogSeverity;
  type: Exclude<LogType, 'all'>;
  entity: string;
  ip: string;
  userAgent: string;
  oldValues?: Record<string, string>;
  newValues?: Record<string, string>;
  actions: LogAction[];
}

interface FilterOption<T> {
  value: T;
  label: string;
}

interface SeverityStat {
  severity: Exclude<LogSeverity, 'info'> | 'info';
  label: string;
  count: number;
}

type ExportFeedbackTone = 'success' | 'error' | 'info';

interface ExportFeedback {
  tone: ExportFeedbackTone;
  title: string;
  detail: string;
  meta?: string;
}

@Component({
  selector: 'app-superadmin-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css'],
})
export class SuperadminLogsComponent implements OnDestroy {
  isExportingLogs = false;
  hasRecentLogExport = false;
  selectedType: LogType = 'all';
  selectedSeverity: LogSeverity | 'all' = 'all';
  expandedLogId: string | null = 'LOG-01';
  exportFeedback: ExportFeedback | null = null;

  private exportSuccessTimeoutId: number | null = null;

  readonly typeFilters: FilterOption<LogType>[] = [
    { value: 'all', label: 'Összes' },
    { value: 'auth', label: 'Auth' },
    { value: 'booking', label: 'Foglalás' },
    { value: 'role', label: 'Szerep' },
    { value: 'api', label: 'API hiba' },
  ];

  readonly severityFilters: FilterOption<LogSeverity | 'all'>[] = [
    { value: 'all', label: 'Összes' },
    { value: 'error', label: 'Hiba' },
    { value: 'warning', label: 'Figyelmeztetés' },
    { value: 'success', label: 'Sikeres' },
    { value: 'info', label: 'Info' },
  ];

  readonly logs: LogEntry[] = [
    {
      id: 'LOG-01',
      time: '10:22',
      title: 'Auth hiba',
      actor: 'vasvariben@gmail.com',
      summary: 'Sikertelen bejelentkezés, 3. kísérlet',
      severity: 'error',
      type: 'auth',
      entity: 'user #1',
      ip: '192.168.1.1',
      userAgent: 'Chrome / Windows',
      oldValues: {
        status: 'aktív',
        failed_attempts: '2',
        lock_state: 'false',
      },
      newValues: {
        status: 'figyelmeztetett',
        failed_attempts: '3',
        lock_state: 'review_required',
      },
      actions: [
        { id: 'investigate', label: 'Vizsgálat indítása', tone: 'primary' },
        { id: 'block-user', label: 'Felhasználó tiltása', tone: 'danger' },
      ],
    },
    {
      id: 'LOG-02',
      time: '10:18',
      title: 'Szerep módosítás',
      actor: 'Jungle Pécs',
      summary: 'staff → owner jogosultságváltás',
      severity: 'warning',
      type: 'role',
      entity: 'member #42',
      ip: '10.1.4.22',
      userAgent: 'Edge / Windows',
      oldValues: {
        role: 'staff',
        scope: 'single_location',
      },
      newValues: {
        role: 'owner',
        scope: 'company_wide',
      },
      actions: [
        { id: 'investigate', label: 'Vizsgálat indítása', tone: 'primary' },
        { id: 'revert-role', label: 'Visszaállítás', tone: 'secondary' },
      ],
    },
    {
      id: 'LOG-03',
      time: '10:15',
      title: 'Foglalás létrehozva',
      actor: 'Kovács Éva',
      summary: 'Glamour Studio · 45 perces kezelés',
      severity: 'success',
      type: 'booking',
      entity: 'booking #1882',
      ip: '10.1.4.16',
      userAgent: 'Safari / iPhone',
      oldValues: {
        status: 'draft',
        staff: 'nincs hozzárendelve',
      },
      newValues: {
        status: 'confirmed',
        staff: 'Kovács Éva',
      },
      actions: [
        { id: 'view-booking', label: 'Foglalás megnyitása', tone: 'primary' },
        { id: 'investigate', label: 'Audit megtekintése', tone: 'secondary' },
      ],
    },
    {
      id: 'LOG-04',
      time: '10:10',
      title: 'Login',
      actor: 'mikor@balazs.hu',
      summary: 'Sikeres bejelentkezés',
      severity: 'info',
      type: 'auth',
      entity: 'user #18',
      ip: '172.16.8.44',
      userAgent: 'Chrome / macOS',
      oldValues: {
        session_state: 'signed_out',
      },
      newValues: {
        session_state: 'active',
      },
      actions: [
        { id: 'open-account', label: 'Fiók megnyitása', tone: 'secondary' },
      ],
    },
    {
      id: 'LOG-05',
      time: '09:58',
      title: 'API hiba',
      actor: 'Billing sync',
      summary: 'Stripe webhook timeout',
      severity: 'error',
      type: 'api',
      entity: 'webhook #991',
      ip: 'internal',
      userAgent: 'Backend worker / Node',
      oldValues: {
        delivery_status: 'pending',
        retry_count: '1',
      },
      newValues: {
        delivery_status: 'failed',
        retry_count: '2',
      },
      actions: [
        { id: 'retry-api', label: 'Újrapróbálás', tone: 'primary' },
        { id: 'investigate', label: 'Vizsgálat indítása', tone: 'secondary' },
      ],
    },
  ];

  constructor(private superadminService: SuperadminService) {}

  ngOnDestroy(): void {
    this.clearExportSuccessTimer();
  }

  get exportButtonLabel(): string {
    if (this.isExportingLogs) {
      return 'Exportálás...';
    }

    if (this.hasRecentLogExport) {
      return 'Letöltve';
    }

    return 'Export';
  }

  onAddFilter(): void {
    this.superadminService.runAction('add-log-filter');
  }

  async onExportLogs(): Promise<void> {
    if (this.isExportingLogs) {
      return;
    }

    const fileName = this.getExportFileName();

    const exportRows = this.filteredLogs.map((log) => ({
      Azonosito: log.id,
      Ido: log.time,
      Cim: log.title,
      Szereplo: log.actor,
      Osszegzes: log.summary,
      Sulyossag: this.getSeverityLabel(log.severity),
      Tipus: this.getTypeLabel(log.type),
      Entitas: log.entity,
      IP: log.ip,
      'User agent': log.userAgent,
      'Regi ertekek': this.serializeLogValues(log.oldValues),
      'Uj ertekek': this.serializeLogValues(log.newValues),
      Muveletek: log.actions.map((action) => action.label).join(', '),
    }));

    if (exportRows.length === 0) {
      this.showExportFeedback(
        'info',
        'Nincs exportálható log',
        'Módosítsd a típus vagy súlyosság szűrőt, és próbáld újra.'
      );
      return;
    }

    this.isExportingLogs = true;

    try {
      const { workbook, XLSX } = await createBookrExportWorkbook({
        exportType: 'Superadmin logok',
        source: 'Bookr weboldal / Superadmin / Logok',
        dataSheetName: 'Logok',
        rows: exportRows,
        filters: [
          ['Típus szűrő', this.getSelectedTypeLabel()],
          ['Súlyosság szűrő', this.getSelectedSeverityLabel()],
        ],
      });

      XLSX.writeFile(workbook, fileName, { compression: true });
      this.markLogExportSuccess(exportRows.length, fileName);

      this.superadminService.runAction(
        'export-logs',
        `xlsx | db: ${exportRows.length} | tipus: ${this.getSelectedTypeLabel()} | sulyossag: ${this.getSelectedSeverityLabel()}`
      );
    } catch (error) {
      console.error('[Logs export] Excel export failed', error);
      this.showExportFeedback(
        'error',
        'Az export nem sikerült',
        'Az Excel fájl létrehozása most nem sikerült. Próbáld újra később.'
      );
    } finally {
      this.isExportingLogs = false;
    }
  }

  closeExportFeedback(): void {
    this.exportFeedback = null;
  }

  private serializeLogValues(values?: Record<string, string>): string {
    if (!values) {
      return '-';
    }

    return Object.entries(values)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ');
  }

  private getSelectedTypeLabel(): string {
    return this.typeFilters.find((filter) => filter.value === this.selectedType)?.label ?? 'Összes';
  }

  private getSelectedSeverityLabel(): string {
    return this.severityFilters.find((filter) => filter.value === this.selectedSeverity)?.label ?? 'Összes';
  }

  private getExportFileName(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `superadmin-logok-${year}-${month}-${day}.xlsx`;
  }

  private markLogExportSuccess(exportedCount: number, fileName: string): void {
    this.hasRecentLogExport = true;
    this.clearExportSuccessTimer();
    this.exportSuccessTimeoutId = window.setTimeout(() => {
      this.hasRecentLogExport = false;
      this.exportSuccessTimeoutId = null;
    }, 2400);

    this.showExportFeedback(
      'success',
      'Excel export kész',
      `${exportedCount} log exportálva. A letöltés elindult, a fájl a böngésző letöltései között érhető el.`,
      `Fájl: ${fileName} · A workbook tartalmaz egy letisztított Bookr forráslapot és export metaadatokat.`
    );
  }

  private showExportFeedback(
    tone: ExportFeedbackTone,
    title: string,
    detail: string,
    meta?: string
  ): void {
    this.exportFeedback = { tone, title, detail, meta };
  }

  private clearExportSuccessTimer(): void {
    if (this.exportSuccessTimeoutId !== null) {
      window.clearTimeout(this.exportSuccessTimeoutId);
      this.exportSuccessTimeoutId = null;
    }
  }

  get severityStats(): SeverityStat[] {
    const counts = this.logs.reduce(
      (accumulator, log) => {
        accumulator[log.severity] += 1;
        return accumulator;
      },
      { error: 0, warning: 0, success: 0, info: 0 }
    );

    return [
      { severity: 'error', label: 'hiba', count: counts.error },
      { severity: 'warning', label: 'figyelmeztetés', count: counts.warning },
      { severity: 'success', label: 'sikeres', count: counts.success },
      { severity: 'info', label: 'info', count: counts.info },
    ];
  }

  get totalEventsToday(): number {
    return this.logs.length;
  }

  get filteredLogs(): LogEntry[] {
    return this.logs.filter((log) => {
      const matchesType = this.selectedType === 'all' || log.type === this.selectedType;
      const matchesSeverity = this.selectedSeverity === 'all' || log.severity === this.selectedSeverity;

      return matchesType && matchesSeverity;
    });
  }

  setTypeFilter(type: LogType): void {
    this.selectedType = type;
  }

  setSeverityFilter(severity: LogSeverity | 'all'): void {
    this.selectedSeverity = severity;
  }

  onSelectSeverityStat(severity: LogSeverity): void {
    this.selectedSeverity = this.selectedSeverity === severity ? 'all' : severity;
  }

  toggleLog(logId: string): void {
    this.expandedLogId = this.expandedLogId === logId ? null : logId;
  }

  isExpanded(logId: string): boolean {
    return this.expandedLogId === logId;
  }

  getSeverityLabel(severity: LogSeverity): string {
    if (severity === 'error') {
      return 'Hiba';
    }

    if (severity === 'warning') {
      return 'Figyelmeztetés';
    }

    if (severity === 'success') {
      return 'Sikeres';
    }

    return 'Info';
  }

  getSeverityIcon(severity: LogSeverity): string {
    if (severity === 'error') {
      return '●';
    }

    if (severity === 'warning') {
      return '●';
    }

    if (severity === 'success') {
      return '●';
    }

    return '●';
  }

  getSeverityClass(severity: LogSeverity): string {
    return `severity-${severity}`;
  }

  getTypeLabel(type: Exclude<LogType, 'all'>): string {
    if (type === 'auth') {
      return 'Auth';
    }

    if (type === 'booking') {
      return 'Foglalás';
    }

    if (type === 'role') {
      return 'Szerep';
    }

    return 'API hiba';
  }

  onViewLog(logId: string): void {
    this.toggleLog(logId);
  }

  onInvestigateLog(logId: string): void {
    this.superadminService.runAction('investigate-log', logId);
  }

  onRunLogAction(logId: string, actionId: LogActionId): void {
    if (actionId === 'investigate') {
      this.onInvestigateLog(logId);
      return;
    }

    if (actionId === 'block-user') {
      this.superadminService.confirmAction('block-log-user', 'Biztosan letiltod ezt a felhasználót?', logId);
      return;
    }

    if (actionId === 'revert-role') {
      this.superadminService.confirmAction('revert-role-change', 'Biztosan visszaállítod a szerepkört?', logId);
      return;
    }

    if (actionId === 'view-booking') {
      this.superadminService.runAction('view-booking-log-context', logId);
      return;
    }

    if (actionId === 'retry-api') {
      this.superadminService.runAction('retry-api-call', logId);
      return;
    }

    this.superadminService.runAction('open-account-from-log', logId);
  }
}
