declare module 'xlsx' {
  export function read(data: Buffer | string, opts?: { type?: string; cellDates?: boolean }): XLSX.WorkBook;
  export function write(workbook: XLSX.WorkBook, opts?: { type?: string; bookType?: string }): Buffer;
  
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [sheetName: string]: WorkSheet };
  }
  
  export interface WorkSheet {
    [cell: string]: any;
    '!ref'?: string;
    '!cols'?: Array<{ wch: number }>;
  }

  export const utils: {
    sheet_to_json<T>(sheet: WorkSheet, opts?: { defval?: any; raw?: boolean }): T[];
    json_to_sheet<T>(data: T[], opts?: { header?: string[] }): WorkSheet;
    book_new(): WorkBook;
    book_append_sheet(workbook: WorkBook, worksheet: WorkSheet, name: string): void;
  };
}
