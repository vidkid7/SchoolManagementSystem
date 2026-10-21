import Book from '../../../models/Book.model';
import Circulation from '../../../models/Circulation.model';
import { LibraryFine } from '../../../models/LibraryFine.model';
import { lateFeeService } from '../lateFee.service';

describe('LateFeeService.getFinesByStudent', () => {
  it('uses the configured circulation and book association aliases', async () => {
    const findAll = jest.spyOn(LibraryFine, 'findAll').mockResolvedValue([] as any);

    await lateFeeService.getFinesByStudent(720001);

    expect(findAll).toHaveBeenCalledWith({
      where: { studentId: 720001 },
      include: [{
        model: Circulation,
        as: 'circulation',
        include: [{ model: Book, as: 'book' }],
      }],
      order: [['createdAt', 'DESC']],
    });

    findAll.mockRestore();
  });
});
