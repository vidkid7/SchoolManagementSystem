export interface ArchiveOptions {
  academicYearId: number;
  academicYearName: string;
  userId: number;
}

export interface RestoreOptions {
  archiveId: number;
  userId: number;
}

export interface ArchiveResult {
  archiveId: number;
  status: string;
  recordCounts: Record<string, number>;
  message: string;
}

export interface ArchiveMetadata {
  id: number;
  academic_year_id: number;
  academic_year_name: string;
  archived_at: Date;
  archived_by: number;
  status: 'in_progress' | 'completed' | 'failed' | 'restored';
  tables_archived?: string[];
  record_counts?: Record<string, number>;
  retention_until: Date;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}
