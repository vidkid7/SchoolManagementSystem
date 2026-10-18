import { fireEvent, render, screen } from '@testing-library/react';
import {
  formatDateTimeLocal,
  parseDateTimeLocal,
  YearSelectableDatePicker,
  YearSelectableDateTimeField,
} from './YearSelectableDatePicker';

describe('YearSelectableDatePicker', () => {
  it('opens directly on the year view for direct year selection', async () => {
    const onChange = jest.fn();
    render(
      <YearSelectableDatePicker
        label="Admission date"
        value={new Date(2026, 0, 1)}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByLabelText('Admission date'));

    expect(
      await screen.findByRole('button', { name: /year view is open/i })
    ).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('YearSelectableDateTimeField', () => {
  it('opens directly on the year view', async () => {
    render(
      <YearSelectableDateTimeField
        label="Scheduled at"
        value="2026-10-19T14:35"
        onChange={jest.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Scheduled at'));

    expect(
      await screen.findByRole('button', { name: /year view is open/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '2026' })).toBeInTheDocument();
  });

  it('preserves local date and minute precision in the field value', () => {
    const parsed = parseDateTimeLocal('2026-10-19T14:35');
    expect(parsed).not.toBeNull();
    expect(formatDateTimeLocal(parsed)).toBe('2026-10-19T14:35');
    expect(parseDateTimeLocal('not-a-date')).toBeNull();
  });
});
