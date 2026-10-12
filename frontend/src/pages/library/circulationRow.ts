export interface CirculationRow {
  circulationId: number;
  bookTitle: string;
  accessionNumber: string;
  memberName: string;
  memberType: 'student' | 'staff';
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'issued' | 'borrowed' | 'renewed' | 'returned' | 'overdue';
  fineAmount?: number;
  finePaid?: boolean;
}

type ApiCirculation = Record<string, any>;

export function normalizeCirculation(record: ApiCirculation): CirculationRow {
  const book = record.book ?? record.Book ?? {};
  const student = record.student ?? record.Student ?? {};
  const name = [
    student.firstNameEn ?? student.first_name_en,
    student.middleNameEn ?? student.middle_name_en,
    student.lastNameEn ?? student.last_name_en,
  ].filter((part): part is string => typeof part === 'string' && part.trim().length > 0).join(' ');
  const fineAmount = Number(record.fineAmount ?? record.fine ?? 0);

  return {
    ...record,
    circulationId: Number(record.circulationId ?? record.circulation_id ?? record.id),
    bookTitle: record.bookTitle ?? book.title ?? '—',
    accessionNumber: record.accessionNumber ?? book.accessionNumber ?? book.accession_number ?? '—',
    memberName: record.memberName ?? (name || `Student #${record.studentId ?? 'unknown'}`),
    memberType: record.memberType ?? 'student',
    issueDate: record.issueDate ?? record.issue_date ?? '',
    dueDate: record.dueDate ?? record.due_date ?? '',
    returnDate: record.returnDate ?? record.return_date,
    status: record.status ?? 'borrowed',
    fineAmount: Number.isFinite(fineAmount) ? fineAmount : 0,
    finePaid: Boolean(record.finePaid ?? record.fine_paid ?? false),
  };
}
