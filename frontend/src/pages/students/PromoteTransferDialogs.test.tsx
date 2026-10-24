import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { PromoteDialog, TransferDialog } from './PromoteTransferDialogs';

const mockTranslate = (key: string) => key;
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockTranslate }) }));
jest.mock('../../hooks/useNepaliNumbers', () => ({
  useNepaliNumbers: () => ({ formatNumber: (value: number | string) => String(value) }),
}));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

describe('PromoteDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/academic/classes')) {
        return { data: { data: [
          { classId: 63, gradeLevel: 6, section: 'B', academicYearId: 14 },
          { classId: 117, gradeLevel: 7, section: 'A', academicYearId: 15 },
          { classId: 118, gradeLevel: 7, section: 'B', academicYearId: 15 },
          { classId: 119, gradeLevel: 8, section: 'B', academicYearId: 15 },
        ] } } as never;
      }
      return { data: { data: [{ academicYearId: 15, isCurrent: true }] } } as never;
    });
    jest.mocked(apiClient.post).mockResolvedValue({ data: { data: { success: true } } } as never);
  });

  it('loads real class/year IDs and sends the flat backend promotion contract', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    render(<ThemeProvider theme={createTheme()}>
      <PromoteDialog open onClose={onClose} studentId={780001} currentClass={63} studentName="QA Student" onSuccess={onSuccess} />
    </ThemeProvider>);

    expect(await screen.findByText('students.class 6')).toBeInTheDocument();
    await user.type(screen.getByRole('spinbutton', { name: 'students.promote.totalMarks' }), '82');
    await user.type(screen.getByRole('spinbutton', { name: 'students.promote.rank' }), '3');
    const submitButton = screen.getByRole('button', { name: 'students.promote.promoteButton' });
    expect(submitButton).toBeEnabled();
    fireEvent.click(submitButton);

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/api/v1/students/780001/promote', {
      academicYearId: 15,
      nextClassId: 118,
      currentClassId: 63,
      currentGradeLevel: 6,
      totalMarks: 82,
      rank: 3,
      remarks: undefined,
    }));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('transfers to an actual class ID in the current academic year', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    render(<ThemeProvider theme={createTheme()}>
      <TransferDialog open onClose={onClose} studentId={780001} currentClass={63} currentSection="B" studentName="QA Student" onSuccess={onSuccess} />
    </ThemeProvider>);

    const classSelect = await screen.findByRole('combobox', { name: 'students.transfer.newClass' });
    await user.click(classSelect);
    await user.click(await screen.findByRole('option', { name: 'students.class 7 — students.section A' }));
    await user.type(screen.getByRole('textbox', { name: 'students.transfer.reason' }), 'Class reassignment');
    fireEvent.click(screen.getByRole('button', { name: 'students.transfer.transferButton' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/api/v1/students/780001/transfer', {
      newClassId: 117,
      newRollNumber: undefined,
      reason: 'Class reassignment',
    }));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('blocks blank reasons and non-positive or fractional roll numbers', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider theme={createTheme()}>
      <TransferDialog open onClose={jest.fn()} studentId={780001} currentClass={63} currentSection="B" studentName="QA Student" onSuccess={jest.fn()} />
    </ThemeProvider>);

    const classSelect = await screen.findByRole('combobox', { name: 'students.transfer.newClass' });
    await user.click(classSelect);
    await user.click(await screen.findByRole('option', { name: 'students.class 7 — students.section A' }));
    const reason = screen.getByRole('textbox', { name: 'students.transfer.reason' });
    await user.type(reason, '   ');
    const transferButton = screen.getByRole('button', { name: 'students.transfer.transferButton' });
    expect(transferButton).toBeDisabled();
    expect(reason).toHaveAttribute('maxlength', '500');

    await user.clear(reason);
    await user.type(reason, 'Valid reason');
    const rollNumber = screen.getByRole('spinbutton', { name: 'students.transfer.newRollNumber' });
    await user.type(rollNumber, '2.5');

    expect(await screen.findByText('students.transfer.invalidRollNumber')).toBeInTheDocument();
    expect(transferButton).toBeDisabled();
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
