export interface GradeCsvStudent {
  id: number;
  student_id: string;
  roll_number: number;
  theory_marks?: number;
  practical_marks?: number;
  total_marks?: number;
  grade?: string;
  grade_point?: number;
  status?: 'entered' | 'pending';
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error('The CSV contains an unclosed quoted field.');
  row.push(field);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  return rows;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s*\([^)]*\)\s*$/, '').replace(/[\s_-]/g, '');
}

function parseMarks(value: string | undefined, field: string, max: number, required: boolean): number {
  const raw = value?.trim() ?? '';
  if (!raw && !required) return 0;
  const marks = Number(raw);
  if (!raw || !Number.isFinite(marks) || marks < 0 || marks > max) {
    throw new Error(`${field} must be between 0 and ${max}.`);
  }
  return marks;
}

function calculateGrade(total: number): { grade: string; gradePoint: number } {
  if (total >= 90) return { grade: 'A+', gradePoint: 4.0 };
  if (total >= 80) return { grade: 'A', gradePoint: 3.6 };
  if (total >= 70) return { grade: 'B+', gradePoint: 3.2 };
  if (total >= 60) return { grade: 'B', gradePoint: 2.8 };
  if (total >= 50) return { grade: 'C+', gradePoint: 2.4 };
  if (total >= 40) return { grade: 'C', gradePoint: 2.0 };
  if (total >= 35) return { grade: 'D', gradePoint: 1.6 };
  return { grade: 'NG', gradePoint: 0.0 };
}

export function importGradesFromCsv<T extends GradeCsvStudent>(
  csvText: string,
  students: T[],
  theoryMax = 75,
  practicalMax = 25,
): { students: T[]; importedCount: number } {
  const rows = parseCsv(csvText);
  if (rows.length < 2) throw new Error('The CSV has no grade rows.');

  const headers = rows[0].map(normalizeHeader);
  const studentIdIndex = headers.findIndex((header) => ['studentid', 'id'].includes(header));
  const rollIndex = headers.indexOf('rollnumber');
  const theoryIndex = headers.findIndex((header) => header.startsWith('theory'));
  const practicalIndex = headers.findIndex((header) => header.startsWith('practical'));

  if ((studentIdIndex < 0 && rollIndex < 0) || theoryIndex < 0) {
    throw new Error('CSV headers must include Student ID or Roll Number and Theory.');
  }

  const byStudentId = new Map(students.map((student) => [String(student.student_id), student.id]));
  const byRoll = new Map(students.map((student) => [String(student.roll_number), student.id]));
  const updates = new Map<number, Pick<GradeCsvStudent, 'theory_marks' | 'practical_marks' | 'total_marks' | 'grade' | 'grade_point'>>();

  rows.slice(1).forEach((columns, index) => {
    const line = index + 2;
    const studentId = studentIdIndex >= 0 ? columns[studentIdIndex]?.trim() : '';
    const rollNumber = rollIndex >= 0 ? columns[rollIndex]?.trim() : '';
    const studentKey = studentId ? byStudentId.get(studentId) : undefined;
    const rollKey = rollNumber ? byRoll.get(rollNumber) : undefined;
    const matchedId = studentKey ?? rollKey;

    if (matchedId === undefined) throw new Error(`CSV row ${line} does not match a student in the selected class.`);
    if (studentKey !== undefined && rollKey !== undefined && studentKey !== rollKey) {
      throw new Error(`CSV row ${line} has a Student ID and Roll Number that do not match.`);
    }
    if (updates.has(matchedId)) throw new Error(`CSV contains more than one row for the same student (row ${line}).`);

    const theory = parseMarks(columns[theoryIndex], `Theory marks on row ${line}`, theoryMax, true);
    const practical = parseMarks(practicalIndex >= 0 ? columns[practicalIndex] : undefined, `Practical marks on row ${line}`, practicalMax, false);
    const total = theory + practical;
    const calculated = calculateGrade(total);
    updates.set(matchedId, {
      theory_marks: theory,
      practical_marks: practical,
      total_marks: total,
      grade: calculated.grade,
      grade_point: calculated.gradePoint,
    });
  });

  if (updates.size === 0) throw new Error('The CSV has no grade rows.');

  return {
    importedCount: updates.size,
    students: students.map((student) => {
      const update = updates.get(student.id);
      return update ? { ...student, ...update, status: 'pending' } : student;
    }),
  };
}

export function escapeCsvCell(value: unknown): string {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
