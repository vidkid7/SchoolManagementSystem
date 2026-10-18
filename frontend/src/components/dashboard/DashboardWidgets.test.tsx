import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressCard, SectionTitle } from './DashboardWidgets';

describe('dashboard widget accessibility', () => {
  it('names progress indicators and exposes their displayed value', () => {
    render(<ProgressCard title="Attendance Health" value={42} />);

    expect(screen.getByRole('progressbar', { name: 'Attendance Health' })).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByRole('progressbar', { name: 'Attendance Health' })).toHaveAttribute('aria-valuetext', '42%');
  });

  it('renders dashboard section titles as level-five headings', () => {
    render(<SectionTitle title="Institution Overview" />);

    expect(screen.getByRole('heading', { name: 'Institution Overview', level: 5 })).toBeInTheDocument();
  });
});
