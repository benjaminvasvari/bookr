import type { WorkBook, WorkSheet } from 'xlsx';

export interface BookrExportWorkbookOptions<Row extends Record<string, unknown>> {
  exportType: string;
  source: string;
  dataSheetName: string;
  rows: Row[];
  filters?: Array<[string, string]>;
}

export async function createBookrExportWorkbook<Row extends Record<string, unknown>>(
  options: BookrExportWorkbookOptions<Row>
): Promise<{ workbook: WorkBook; XLSX: typeof import('xlsx'); exportedAt: string }> {
  const XLSX = await import('xlsx');
  const exportedAt = new Date().toLocaleString('hu-HU');
  const workbook = XLSX.utils.book_new();

  workbook.Props = {
    Title: `${options.exportType} export`,
    Subject: `Bookr ${options.exportType} export`,
    Author: 'Bookr',
    Company: 'Bookr',
    Comments: `Exportálva a Bookr weboldalról. Forrás: ${options.source}.`,
  };

  workbook.Custprops = {
    ExportSource: 'Bookr weboldal',
    ExportModule: options.source,
    ExportType: options.exportType,
  };

  XLSX.utils.book_append_sheet(workbook, createBrandSheet(XLSX, options, exportedAt), 'Bookr Export');
  XLSX.utils.book_append_sheet(
    workbook,
    createDataSheet(XLSX, options.rows, options.source, exportedAt),
    options.dataSheetName
  );
  XLSX.utils.book_append_sheet(workbook, createMetaSheet(XLSX, options, exportedAt), 'Meta');

  return { workbook, XLSX, exportedAt };
}

function createBrandSheet(
  XLSX: typeof import('xlsx'),
  options: BookrExportWorkbookOptions<Record<string, unknown>>,
  exportedAt: string
): WorkSheet {
  const brandRows = [
    ['Bookr export'],
    ['Ez a fájl a Bookr weboldalról lett exportálva.'],
    ['https://bookr.hu'],
    [],
    ['Export típusa', options.exportType],
    ['Forrás', options.source],
    ['Export ideje', exportedAt],
    ['Találatok', String(options.rows.length)],
    ...((options.filters ?? []).map(([label, value]) => [label, value])),
  ];

  const sheet = XLSX.utils.aoa_to_sheet(brandRows);
  sheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
  ];
  sheet['!cols'] = [{ wch: 20 }, { wch: 34 }, { wch: 24 }, { wch: 18 }];
  sheet['!rows'] = [{ hpt: 28 }, { hpt: 22 }, { hpt: 20 }];

  return sheet;
}

function createDataSheet(
  XLSX: typeof import('xlsx'),
  rows: Record<string, unknown>[],
  source: string,
  exportedAt: string
): WorkSheet {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Bookr export'],
    ['Exportálva a Bookr weboldalról'],
    [`${source} | ${exportedAt}`],
    [],
  ]);

  XLSX.utils.sheet_add_json(sheet, rows, {
    origin: 'A5',
    skipHeader: false,
  });

  const columnCount = Math.max(getHeaders(rows).length, 1);
  sheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columnCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columnCount - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: columnCount - 1 } },
  ];
  sheet['!cols'] = getColumnWidths(rows);

  return sheet;
}

function createMetaSheet(
  XLSX: typeof import('xlsx'),
  options: BookrExportWorkbookOptions<Record<string, unknown>>,
  exportedAt: string
): WorkSheet {
  const metaRows = [
    ['Bookr forrás', 'Exportálva a Bookr weboldalról'],
    ['bookr.hu', 'https://bookr.hu'],
    ['Export típusa', options.exportType],
    ['Forrás', options.source],
    ['Export ideje', exportedAt],
    ['Találatok', String(options.rows.length)],
    ...((options.filters ?? []).map(([label, value]) => [label, value])),
  ];

  const sheet = XLSX.utils.aoa_to_sheet(metaRows);
  sheet['!cols'] = [{ wch: 24 }, { wch: 42 }];
  return sheet;
}

function getHeaders(rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) {
    return ['Adat'];
  }

  return Object.keys(rows[0]);
}

function getColumnWidths(rows: Record<string, unknown>[]): Array<{ wch: number }> {
  const headers = getHeaders(rows);

  return headers.map((header) => {
    const cellLengths = rows.map((row) => String(row[header] ?? '').length);
    const maxLength = Math.max(header.length, ...cellLengths, 12);

    return { wch: Math.min(42, maxLength + 2) };
  });
}