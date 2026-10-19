import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BulkAdd } from './BulkAdd';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { number?: number }) =>
      key === 'students.removeStudent' ? `Remove student ${options?.number}` : key,
  }),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

describe('BulkAdd', () => {
  it('gives each student row delete control a distinct accessible name', () => {
    render(
      <MemoryRouter initialEntries={['/KMC/students/bulk-add']}>
        <Routes>
          <Route path="/:municipalitySlug/students/bulk-add" element={<BulkAdd />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'students.addAnother' }));

    expect(screen.getByRole('button', { name: 'Remove student 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove student 2' })).toBeInTheDocument();
  });
});
