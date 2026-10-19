import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { InvoiceGeneration } from './InvoiceGeneration';

jest.mock('../../hooks/useSlugNavigate', () => ({
  useSlugNavigate: () => jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) => {
      if (key === 'academic.classSection') return `Class ${values?.grade} - Section ${values?.section}`;
      if (key === 'finance.classNotAssigned') return 'Class not assigned';
      if (key === 'finance.studentSelectionHint') return 'Leave blank to include all matching students.';
      return key;
    },
  }),
}));

describe('InvoiceGeneration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockImplementation((path: string) => {
      if (path === '/finance/fee-structures') return Promise.resolve({ data: { data: [] } });
      if (path === '/academic/classes') {
        return Promise.resolve({ data: { data: [{ classId: 1, gradeLevel: 1, section: 'K' }] } });
      }
      if (path === '/students?limit=1000') {
        return Promise.resolve({
          data: {
            data: [{
              studentId: 600001,
              firstNameEn: 'QA Student',
              lastNameEn: 'Synthetic',
              currentClassId: null,
              class: null,
            }],
          },
        });
      }
      throw new Error(`Unexpected GET ${path}`);
    });
  });

  it('shows actual class labels and clearly marks students without class assignments in bulk mode', async () => {
    render(
      <MemoryRouter initialEntries={['/KMC/finance/invoices/create']}>
        <Routes>
          <Route path="/:municipalitySlug/finance/invoices/create" element={<InvoiceGeneration />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('radio', { name: 'finance.generateInvoices' }));
    expect(await screen.findByText('Leave blank to include all matching students.')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'finance.selectClassOptional' }));
    expect(await screen.findByRole('option', { name: 'Class 1 - Section K' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'finance.allClasses' }));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'finance.selectStudent' }));
    expect(await screen.findByRole('option', { name: 'QA Student Synthetic - Class not assigned' })).toBeInTheDocument();
  });
});
