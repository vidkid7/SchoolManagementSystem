import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import NepaliDate from 'nepali-date-converter';
import '@testing-library/jest-dom';
import { BSDatePicker, BSDatePickerField } from './BSDatePicker';

/**
 * Test suite for BS Date Picker Component
 * 
 * Tests:
 * - Basic rendering and interaction
 * - BS/AD calendar view toggling
 * - Date selection and formatting
 * - React Hook Form integration
 * - Nepali month name display
 * - Min/max date validation
 * - Dual date format display
 * 
 * Requirements: N4.2, N4.3, N4.4, N4.8
 */

describe('BSDatePicker', () => {
  describe('Basic Rendering', () => {
    it('should render with label', () => {
      const handleChange = jest.fn();
      render(<BSDatePicker label="Birth Date" onChange={handleChange} />);

      expect(screen.getByLabelText('Birth Date')).toBeInTheDocument();
    });

    it('should render with required indicator', () => {
      const handleChange = jest.fn();
      render(
        <BSDatePicker label="Birth Date" required onChange={handleChange} />
      );

      const input = screen.getByLabelText(/Birth Date/);
      expect(input).toBeRequired();
    });

    it('should render with error state', () => {
      const handleChange = jest.fn();
      render(
        <BSDatePicker
          label="Birth Date"
          error
          helperText="Date is required"
          onChange={handleChange}
        />
      );

      expect(screen.getByText('Date is required')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      const handleChange = jest.fn();
      render(<BSDatePicker label="Birth Date" disabled onChange={handleChange} />);

      const input = screen.getByLabelText('Birth Date');
      expect(input).toBeDisabled();
    });
  });

  describe('Date Display Format', () => {
    it('should display date in dual format: "YYYY-MM-DD BS (YYYY-MM-DD AD)"', () => {
      const handleChange = jest.fn();
      const testDate = new Date('2023-04-14'); // 2080-01-01 BS

      render(
        <BSDatePicker label="Birth Date" value={testDate} onChange={handleChange} />
      );

      const input = screen.getByLabelText('Birth Date') as HTMLInputElement;
      expect(input.value).toMatch(/^\d{4}-\d{2}-\d{2} BS \(\d{4}-\d{2}-\d{2} AD\)$/);
      expect(input.value).toContain('2080-01-01 BS');
      expect(input.value).toContain('2023-04-14 AD');
    });

    it('should display empty string when value is null', () => {
      const handleChange = jest.fn();
      render(<BSDatePicker label="Birth Date" value={null} onChange={handleChange} />);

      const input = screen.getByLabelText('Birth Date') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle date formatting errors gracefully', () => {
      const handleChange = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Invalid date
      const invalidDate = new Date('invalid');
      render(
        <BSDatePicker label="Birth Date" value={invalidDate} onChange={handleChange} />
      );

      const input = screen.getByLabelText('Birth Date') as HTMLInputElement;
      expect(input.value).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Calendar Popup', () => {
    it('should open calendar popup when clicking the input', async () => {
      const handleChange = jest.fn();
      render(<BSDatePicker label="Birth Date" onChange={handleChange} />);

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('presentation')).toBeInTheDocument();
      });
    });

    it('should not open calendar when disabled', async () => {
      const handleChange = jest.fn();
      render(<BSDatePicker label="Birth Date" disabled onChange={handleChange} />);

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
      });
    });

    it('should close calendar after selecting a date', async () => {
      const handleChange = jest.fn();
      render(<BSDatePicker label="Birth Date" onChange={handleChange} />);

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('presentation')).toBeInTheDocument();
      });

      // Click on a day button (find first available day)
      const dayButtons = screen.getAllByRole('button').filter((btn) => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && !btn.disabled;
      });

      if (dayButtons.length > 0) {
        await userEvent.click(dayButtons[0]);

        await waitFor(() => {
          expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('BS/AD Calendar View Toggle', () => {
    it('should default to BS calendar view', async () => {
      const handleChange = jest.fn();
      render(
        <BSDatePicker
          label="Birth Date"
          defaultCalendarView="BS"
          onChange={handleChange}
        />
      );

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      await waitFor(() => {
        const bsButton = screen.getByRole('button', { name: /BS/i });
        expect(bsButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('should allow toggling between BS and AD views', async () => {
      const handleChange = jest.fn();
      render(<BSDatePicker label="Birth Date" onChange={handleChange} />);

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('presentation')).toBeInTheDocument();
      });

      // Find toggle buttons
      const bsButton = screen.getByRole('button', { name: /BS/i });
      const adButton = screen.getByRole('button', { name: /AD/i });

      // Initially BS should be selected
      expect(bsButton).toHaveAttribute('aria-pressed', 'true');

      // Toggle to AD
      await userEvent.click(adButton);

      await waitFor(() => {
        expect(adButton).toHaveAttribute('aria-pressed', 'true');
        expect(bsButton).toHaveAttribute('aria-pressed', 'false');
      });

      // Toggle back to BS
      await userEvent.click(bsButton);

      await waitFor(() => {
        expect(bsButton).toHaveAttribute('aria-pressed', 'true');
        expect(adButton).toHaveAttribute('aria-pressed', 'false');
      });
    });

    it('should display Nepali month names in BS view', async () => {
      const handleChange = jest.fn();
      const testDate = new Date('2023-04-14'); // 2080-01-01 BS (Baisakh)

      render(
        <BSDatePicker
          label="Birth Date"
          value={testDate}
          defaultCalendarView="BS"
          onChange={handleChange}
        />
      );

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      await waitFor(() => {
        // Should display Nepali month name
        expect(screen.getByText(/बैशाख/)).toBeInTheDocument();
      });
    });

    it('should display English month names in AD view', async () => {
      const handleChange = jest.fn();
      const testDate = new Date('2023-04-14'); // Baisakh in BS

      render(
        <BSDatePicker
          label="Birth Date"
          value={testDate}
          defaultCalendarView="AD"
          onChange={handleChange}
        />
      );

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      // Toggle to AD view
      await waitFor(() => {
        const adButton = screen.getByRole('button', { name: /AD/i });
        userEvent.click(adButton);
      });

      await waitFor(() => {
        // Should display English month name
        expect(screen.getByText(/Baisakh/)).toBeInTheDocument();
      });
    });
  });

  describe('Date Selection', () => {
    it('should call onChange when a date is selected', async () => {
      const handleChange = jest.fn();
      render(<BSDatePicker label="Birth Date" onChange={handleChange} />);

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('presentation')).toBeInTheDocument();
      });

      // Click on a day button
      const dayButtons = screen.getAllByRole('button').filter((btn) => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && !btn.disabled;
      });

      if (dayButtons.length > 0) {
        await userEvent.click(dayButtons[0]);

        await waitFor(() => {
          expect(handleChange).toHaveBeenCalledWith(expect.any(Date));
        });
      }
    });

    it('should highlight selected date', async () => {
      const handleChange = jest.fn();
      const testDate = new Date('2023-04-14'); // 2080-01-01 BS

      render(
        <BSDatePicker label="Birth Date" value={testDate} onChange={handleChange} />
      );

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      await waitFor(() => {
        // Find the button with day 1 (since testDate is 1st of month)
        const dayButtons = screen.getAllByRole('button').filter((btn) => {
          return btn.textContent === '1';
        });

        // At least one should have selected styling (check via class or aria attributes)
        const selectedButton = dayButtons.find((btn) => {
          const classes = btn.className;
          return classes.includes('selected') || btn.getAttribute('aria-selected');
        });

        expect(selectedButton).toBeDefined();
      });
    });

    it('should highlight today\'s date', async () => {
      const handleChange = jest.fn();
      render(<BSDatePicker label="Birth Date" onChange={handleChange} />);

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      await waitFor(() => {
        const today = new Date();
        const todayDay = today.getDate();

        // Find button with today's day number
        const dayButtons = screen.getAllByRole('button').filter((btn) => {
          return btn.textContent === String(todayDay);
        });

        // Should have at least one button for today
        expect(dayButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Month Navigation', () => {
    it('should navigate to previous month', async () => {
      const handleChange = jest.fn();
      const testDate = new Date('2023-05-15'); // 2080-02-01 BS (Jestha)

      render(
        <BSDatePicker label="Birth Date" value={testDate} onChange={handleChange} />
      );

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByText(/जेठ/)).toBeInTheDocument();
      });

      // Click previous month button
      const prevButton = screen.getAllByRole('button').find((btn) => {
        return btn.querySelector('svg'); // ChevronLeft icon
      });

      if (prevButton) {
        await userEvent.click(prevButton);

        await waitFor(() => {
          // Should show Baisakh (previous month)
          expect(screen.getByText(/बैशाख/)).toBeInTheDocument();
        });
      }
    });

    it('should navigate to next month', async () => {
      const handleChange = jest.fn();
      const testDate = new Date('2023-04-14'); // 2080-01-01 BS (Baisakh)

      render(
        <BSDatePicker label="Birth Date" value={testDate} onChange={handleChange} />
      );

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByText(/बैशाख/)).toBeInTheDocument();
      });

      // Click next month button (second chevron button)
      const buttons = screen.getAllByRole('button');
      const chevronButtons = buttons.filter((btn) => btn.querySelector('svg'));
      const nextButton = chevronButtons[1]; // Second chevron is next

      if (nextButton) {
        await userEvent.click(nextButton);

        await waitFor(() => {
          // Should show Jestha (next month)
          expect(screen.getByText(/जेठ/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Today Button', () => {
    it('should have a Today button', async () => {
      const handleChange = jest.fn();
      render(<BSDatePicker label="Birth Date" onChange={handleChange} />);

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Today/i })).toBeInTheDocument();
      });
    });

    it('should select today\'s date when Today button is clicked', async () => {
      const handleChange = jest.fn();
      render(<BSDatePicker label="Birth Date" onChange={handleChange} />);

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      await waitFor(() => {
        const todayButton = screen.getByRole('button', { name: /Today/i });
        expect(todayButton).toBeInTheDocument();
      });

      const todayButton = screen.getByRole('button', { name: /Today/i });
      await userEvent.click(todayButton);

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(expect.any(Date));
        const calledDate = handleChange.mock.calls[0][0] as Date;
        const today = new Date();

        // Check if the date is today (same day)
        expect(calledDate.getDate()).toBe(today.getDate());
        expect(calledDate.getMonth()).toBe(today.getMonth());
        expect(calledDate.getFullYear()).toBe(today.getFullYear());
      });
    });
  });

  describe('Min/Max Date Validation', () => {
    it('should disable dates before minDate', async () => {
      const handleChange = jest.fn();
      const minDate = new Date('2023-04-14'); // 2080-01-01 BS
      const testDate = new Date('2023-04-20'); // A few days later

      render(
        <BSDatePicker
          label="Birth Date"
          value={testDate}
          minDate={minDate}
          onChange={handleChange}
        />
      );

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      await waitFor(() => {
        // Navigate to previous month where dates should be disabled
        const prevButton = screen.getAllByRole('button').find((btn) => {
          return btn.querySelector('svg');
        });

        if (prevButton) {
          userEvent.click(prevButton);
        }
      });

      // Check that some day buttons are disabled
      await waitFor(() => {
        const dayButtons = screen.getAllByRole('button').filter((btn) => {
          const text = btn.textContent;
          return text && /^\d+$/.test(text);
        });

        const disabledButtons = dayButtons.filter((btn) => btn.disabled);
        expect(disabledButtons.length).toBeGreaterThan(0);
      });
    });

    it('should disable dates after maxDate', async () => {
      const handleChange = jest.fn();
      const maxDate = new Date('2023-04-30'); // 2080-01-17 BS
      const testDate = new Date('2023-04-14'); // 2080-01-01 BS

      render(
        <BSDatePicker
          label="Birth Date"
          value={testDate}
          maxDate={maxDate}
          onChange={handleChange}
        />
      );

      const input = screen.getByLabelText('Birth Date');
      await userEvent.click(input);

      await waitFor(() => {
        // Navigate to next month where dates should be disabled
        const buttons = screen.getAllByRole('button');
        const chevronButtons = buttons.filter((btn) => btn.querySelector('svg'));
        const nextButton = chevronButtons[1];

        if (nextButton) {
          userEvent.click(nextButton);
        }
      });

      // Check that some day buttons are disabled
      await waitFor(() => {
        const dayButtons = screen.getAllByRole('button').filter((btn) => {
          const text = btn.textContent;
          return text && /^\d+$/.test(text);
        });

        const disabledButtons = dayButtons.filter((btn) => btn.disabled);
        expect(disabledButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('React Hook Form Integration', () => {
    // Test component that uses React Hook Form
    const TestFormComponent: React.FC = () => {
      const { control, handleSubmit } = useForm({
        defaultValues: {
          birthDate: null as Date | null
        }
      });

      const onSubmit = jest.fn();

      return (
        <form onSubmit={handleSubmit(onSubmit)}>
          <BSDatePickerField
            name="birthDate"
            control={control}
            label="Birth Date"
            required
          />
          <button type="submit">Submit</button>
        </form>
      );
    };

    it('should integrate with React Hook Form', () => {
      render(<TestFormComponent />);

      expect(screen.getByLabelText(/Birth Date/)).toBeInTheDocument();
    });

    it('should update form value when date is selected', async () => {
      const { container } = render(<TestFormComponent />);

      const input = screen.getByLabelText(/Birth Date/);
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByRole('presentation')).toBeInTheDocument();
      });

      // Click on a day button
      const dayButtons = screen.getAllByRole('button').filter((btn) => {
        const text = btn.textContent;
        return text && /^\d+$/.test(text) && !btn.disabled;
      });

      if (dayButtons.length > 0) {
        await userEvent.click(dayButtons[0]);

        await waitFor(() => {
          const inputElement = screen.getByLabelText(/Birth Date/) as HTMLInputElement;
          expect(inputElement.value).not.toBe('');
        });
      }
    });
  });

  describe('Nepali Month Names', () => {
    const nepaliMonths = [
      'बैशाख',
      'जेठ',
      'असार',
      'श्रावण',
      'भाद्र',
      'आश्विन',
      'कार्तिक',
      'मंसिर',
      'पौष',
      'माघ',
      'फाल्गुन',
      'चैत्र'
    ];

    it('should display all 12 Nepali month names correctly', async () => {
      const handleChange = jest.fn();

      for (let month = 0; month < 12; month++) {
        const nepaliDate = new NepaliDate(2080, month, 1);
        const jsDate = nepaliDate.toJsDate();

        const { unmount } = render(
          <BSDatePicker
            label="Birth Date"
            value={jsDate}
            defaultCalendarView="BS"
            onChange={handleChange}
          />
        );

        const input = screen.getByLabelText('Birth Date');
        await userEvent.click(input);

        await waitFor(() => {
          expect(screen.getByText(nepaliMonths[month])).toBeInTheDocument();
        });

        unmount();
      }
    });
  });
});
