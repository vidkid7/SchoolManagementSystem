import { fireEvent, render, screen } from '@testing-library/react';
import { YearSelectableDatePicker } from './YearSelectableDatePicker';

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
