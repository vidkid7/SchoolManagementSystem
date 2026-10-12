interface ReservableBook {
  bookId: number;
}

interface ReservingStudent {
  studentId: number;
}

export function createReserveBookPayload(book: ReservableBook, student: ReservingStudent) {
  if (!Number.isInteger(book.bookId) || book.bookId < 1 || !Number.isInteger(student.studentId) || student.studentId < 1) {
    throw new Error('Select a valid unavailable book and student');
  }

  return { bookId: book.bookId, studentId: student.studentId };
}
