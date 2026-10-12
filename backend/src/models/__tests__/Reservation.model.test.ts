import Reservation from '../Reservation.model';

describe('Reservation serialization', () => {
  it('preserves safe book and student associations for circulation history', () => {
    const reservation = Reservation.build({
      reservationId: 8,
      bookId: 12,
      studentId: 34,
      reservationDate: new Date('2026-10-12T00:00:00.000Z'),
      expiryDate: new Date('2026-11-11T00:00:00.000Z'),
      status: 'pending',
      notificationSent: false,
      queuePosition: 1,
    });
    (reservation as any).setDataValue('book', {
      bookId: 12,
      title: 'Synthetic test book',
      accessionNumber: 'QA-RESERVE-001',
    });
    (reservation as any).setDataValue('student', {
      studentId: 34,
      studentCode: 'QA-STUDENT-001',
      firstNameEn: 'Synthetic',
      lastNameEn: 'Student',
      fatherPhone: 'must-not-be-serialized',
    });

    expect(reservation.toJSON()).toMatchObject({
      reservationId: 8,
      book: { bookId: 12, title: 'Synthetic test book', accessionNumber: 'QA-RESERVE-001' },
      student: {
        studentId: 34,
        studentCode: 'QA-STUDENT-001',
        firstNameEn: 'Synthetic',
        lastNameEn: 'Student',
      },
    });
    expect(JSON.stringify(reservation.toJSON())).not.toContain('must-not-be-serialized');
  });
});
