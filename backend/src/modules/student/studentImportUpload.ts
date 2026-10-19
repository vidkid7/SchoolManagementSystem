import { ValidationError } from '@middleware/errorHandler';

const IMPORT_FILE_TYPES: Record<string, Set<string>> = {
  '.xls': new Set(['application/vnd.ms-excel']),
  '.xlsx': new Set(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  '.csv': new Set(['text/csv', 'application/csv', 'text/comma-separated-values']),
};

export const isSupportedStudentImportFile = (originalName: string, mimeType: string): boolean => {
  const extension = originalName.slice(originalName.lastIndexOf('.')).toLowerCase();
  return IMPORT_FILE_TYPES[extension]?.has(mimeType.toLowerCase()) ?? false;
};

export const studentImportFileFilter = (
  _request: unknown,
  file: { originalname: string; mimetype: string },
  callback: (error: Error | null, acceptFile?: boolean) => void
): void => {
  if (isSupportedStudentImportFile(file.originalname, file.mimetype)) {
    callback(null, true);
    return;
  }

  callback(new ValidationError('Unsupported student import file type', [
    { field: 'file', message: 'Please upload an Excel or CSV file (.xlsx, .xls, or .csv)' },
  ]));
};
