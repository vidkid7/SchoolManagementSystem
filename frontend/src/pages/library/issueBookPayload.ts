interface IssueBookOption {
  bookId: number;
}

interface IssueStudentOption {
  studentId: number;
}

export interface IssueBookPayload {
  bookId: number;
  studentId: number;
  dueDate?: string;
}

export function createIssueBookPayload(
  book: IssueBookOption,
  student: IssueStudentOption,
  dueDate: string
): IssueBookPayload {
  const bookId = Number(book.bookId);
  const studentId = Number(student.studentId);

  if (!Number.isInteger(bookId) || bookId <= 0 || !Number.isInteger(studentId) || studentId <= 0) {
    throw new Error('Select a valid book and student');
  }

  return {
    bookId,
    studentId,
    ...(dueDate.trim() && { dueDate: dueDate.trim() }),
  };
}
