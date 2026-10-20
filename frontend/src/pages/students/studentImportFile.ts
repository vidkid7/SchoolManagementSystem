const IMPORT_FILE_TYPES: Record<string, ReadonlySet<string>> = {
  '.xls': new Set(['application/vnd.ms-excel']),
  '.xlsx': new Set(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  '.csv': new Set(['text/csv', 'application/csv', 'text/comma-separated-values']),
};

export const isSupportedStudentImportFile = (fileName: string, mimeType: string): boolean => {
  const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  return IMPORT_FILE_TYPES[extension]?.has(mimeType.toLowerCase()) ?? false;
};
