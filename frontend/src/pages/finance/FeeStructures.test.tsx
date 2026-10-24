import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { FeeStructures } from './FeeStructures';

jest.mock('../../hooks/useSlugNavigate', () => ({
  useSlugNavigate: () => jest.fn(),
}));

jest.mock('../../hooks/useCurrentAcademicYear', () => ({
  useCurrentAcademicYear: () => ({
    currentYear: { academicYearId: 12, name: '2082-83', isCurrent: true },
    academicYears: [{ academicYearId: 12, name: '2082-83', isCurrent: true }],
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderPage = () => render(
  <MemoryRouter initialEntries={['/KMC/finance/fee-structures']}>
    <Routes>
      <Route path="/:municipalitySlug/finance/fee-structures" element={<FeeStructures />} />
    </Routes>
  </MemoryRouter>,
);

describe('FeeStructures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { success: true } });
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: { success: true } });
  });

  it('blocks blank fee names and non-positive amounts without sending a create request', async () => {
    renderPage();
    await screen.findByText('finance.noFeeStructures');
    fireEvent.click(screen.getByRole('button', { name: 'finance.createFeeStructure' }));

    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));
    expect(await screen.findByText('finance.feeNameRequired')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/finance\.feeName/), { target: { value: 'Tuition' } });
    fireEvent.change(screen.getByLabelText(/finance\.amount/), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));
    expect(await screen.findByText('finance.amountRequired')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('creates a fee structure with normalized values and all classes by default', async () => {
    renderPage();
    await screen.findByText('finance.noFeeStructures');
    fireEvent.click(screen.getByRole('button', { name: 'finance.createFeeStructure' }));
    fireEvent.change(screen.getByLabelText(/finance\.feeName/), { target: { value: '  Tuition  ' } });
    fireEvent.change(screen.getByLabelText(/finance\.amount/), { target: { value: '1250' } });
    fireEvent.change(screen.getByLabelText('finance.description'), { target: { value: '  Monthly tuition  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'common.add' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/finance/fee-structures', {
      name: 'Tuition',
      academicYearId: 12,
      applicableClasses: Array.from({ length: 12 }, (_, index) => index + 1),
      applicableShifts: ['morning', 'day', 'evening'],
      description: 'Monthly tuition',
      feeComponents: [{
        name: 'Tuition',
        type: 'monthly',
        amount: 1250,
        frequency: 'monthly',
        isMandatory: true,
        description: 'Monthly tuition',
      }],
    }));
  });

  it('preserves existing class assignments when editing other fields', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { data: [{ feeStructureId: 7, name: 'Tuition', academicYearId: 12, applicableClasses: [1, 2], amount: 1250, isActive: true }] },
    });
    renderPage();
    await screen.findByText('Tuition');
    fireEvent.click(screen.getByRole('button', { name: 'common.edit' }));
    fireEvent.change(screen.getByLabelText(/finance\.feeName/), { target: { value: 'Tuition revised' } });
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith('/finance/fee-structures/7', {
      name: 'Tuition revised',
      applicableClasses: [1, 2],
      applicableShifts: ['morning', 'day', 'evening'],
      description: undefined,
    }));
  });

  it('deletes only after confirmation and refreshes the table', async () => {
    (apiClient.get as jest.Mock)
      .mockResolvedValueOnce({ data: { data: [{ feeStructureId: 7, name: 'Tuition', academicYearId: 12, applicableClasses: [1], amount: 1250, isActive: true }] } })
      .mockResolvedValue({ data: { data: [] } });
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage();
    await screen.findByText('Tuition');
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    expect(apiClient.delete).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith('/finance/fee-structures/7'));
    expect(await screen.findByText('finance.noFeeStructures')).toBeInTheDocument();
    confirmSpy.mockRestore();
  });
});
