export function extractStudentSections(rows: unknown): string[] {
  if (!Array.isArray(rows)) return [];

  return [...new Set(
    rows
      .map((row: unknown) => {
        if (!row || typeof row !== 'object' || !('section' in row)) return '';
        return typeof row.section === 'string' ? row.section.trim() : '';
      })
      .filter(Boolean),
  )].sort((a, b) => a.localeCompare(b));
}
