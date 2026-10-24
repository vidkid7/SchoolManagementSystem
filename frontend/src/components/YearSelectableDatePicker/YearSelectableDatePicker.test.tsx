import { fireEvent, render, screen } from '@testing-library/react';
import {
  formatDateOnly,
  formatDateTimeLocal,
  parseDateOnly,
  parseDateTimeLocal,
} from './dateUtils';
import { YearSelectableDatePicker, YearSelectableDateTimeField } from './YearSelectableDatePicker';

describe('date-only conversion', () => {
  it('rejects impossible calendar dates instead of normalizing them into another day', () => {
    expect(parseDateOnly('2024-02-29')).toEqual(new Date(2024, 1, 29));
    expect(parseDateOnly('2023-02-29')).toBeNull();
    expect(parseDateOnly('2026-02-31')).toBeNull();
    expect(formatDateOnly(parseDateOnly('2024-02-29'))).toBe('2024-02-29');
  });
});

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

    expect(screen.getByRole('textbox', { name: 'Admission date' })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Admission date'));
    expect(
      await screen.findByRole('button', { name: /year view is open/i })
    ).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('emits a date with the selected year', async () => {
    const onChange = jest.fn();
    render(
      <YearSelectableDatePicker
        label="Admission date"
        value={new Date(2026, 0, 1)}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByLabelText('Admission date'));
    fireEvent.click(await screen.findByRole('radio', { name: '2027' }));

    expect(onChange).toHaveBeenCalled();
    const selectedDate = onChange.mock.calls.at(-1)?.[0] as Date;
    expect(selectedDate.getFullYear()).toBe(2027);
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

    expect(screen.getByRole('textbox', { name: 'Scheduled at' })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Scheduled at'));

    expect(
      await screen.findByRole('button', { name: /year view is open/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '2026' })).toBeInTheDocument();
  });

  it('emits a local datetime with the selected year', async () => {
    const onChange = jest.fn();
    render(
      <YearSelectableDateTimeField
        label="Scheduled at"
        value="2026-10-19T14:35"
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByLabelText('Scheduled at'));
    fireEvent.click(await screen.findByRole('radio', { name: '2027' }));

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0].target.value).toMatch(/^2027-/);
  });

  it('preserves local date and minute precision in the field value', () => {
    const parsed = parseDateTimeLocal('2026-10-19T14:35');
    expect(parsed).not.toBeNull();
    expect(formatDateTimeLocal(parsed)).toBe('2026-10-19T14:35');
    expect(parseDateTimeLocal('not-a-date')).toBeNull();
  });
});
