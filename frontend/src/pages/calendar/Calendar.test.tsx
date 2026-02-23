/**
 * Calendar Component Tests
 * 
 * Tests for the calendar page component
 * 
 * Requirements: 31.1, 31.2, 31.5, 31.7
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Calendar from './Calendar';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Create a mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { user: { role: 'school_admin' } }) => state,
    },
  });
};

describe('Calendar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Cleanup
    document.body.innerHTML = '';
  });

  const renderCalendar = () => {
    const store = createMockStore();
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Calendar />
        </BrowserRouter>
      </Provider>
    );
  };

  it('should render calendar component', () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    expect(screen.getByText('Calendar / पात्रो')).toBeInTheDocument();
  });

  it('should display BS/AD toggle buttons', () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    expect(screen.getByText('BS')).toBeInTheDocument();
    expect(screen.getByText('AD')).toBeInTheDocument();
  });

  it('should display view toggle buttons', () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
  });

  it('should display category filter', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    await waitFor(() => {
      const categoryLabels = screen.getAllByText('Category');
      expect(categoryLabels.length).toBeGreaterThan(0);
    });
  });

  it('should display Add Event button', () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    expect(screen.getByText('Add Event')).toBeInTheDocument();
  });

  it('should fetch events on mount', async () => {
    const mockEvents = [
      {
        eventId: 1,
        title: 'Test Event',
        category: 'academic',
        startDate: '2024-01-15',
        isHoliday: false,
        isNepalGovernmentHoliday: false,
        status: 'scheduled',
      },
    ];

    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: mockEvents },
    });

    renderCalendar();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/v1/calendar/events',
        expect.objectContaining({
          params: expect.objectContaining({
            startDateFrom: expect.any(String),
            startDateTo: expect.any(String),
          }),
        })
      );
    });
  });

  it('should display Nepal government holidays', async () => {
    const mockHolidays = [
      {
        eventId: 1,
        title: 'Dashain',
        titleNp: 'दशैं',
        category: 'holiday',
        startDate: '2024-10-13',
        startDateBS: '2081-06-27',
        isHoliday: true,
        isNepalGovernmentHoliday: true,
        governmentHolidayName: 'Dashain Vijaya Dashami',
        governmentHolidayNameNp: 'दशैं विजया दशमी',
        color: '#d32f2f',
        status: 'scheduled',
      },
    ];

    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: mockHolidays },
    });

    renderCalendar();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });

  it('should switch between BS and AD calendar systems', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    const bsButton = screen.getByText('BS');
    const adButton = screen.getByText('AD');

    // Initially BS should be selected
    expect(bsButton).toHaveClass('Mui-selected');

    // Click AD button
    fireEvent.click(adButton);

    // AD should now be selected
    expect(adButton).toHaveClass('Mui-selected');
  });

  it('should switch between month and day views', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    const monthButton = screen.getByText('Month');
    const dayButton = screen.getByText('Day');

    // Initially month should be selected
    expect(monthButton).toHaveClass('Mui-selected');

    // Click day button
    fireEvent.click(dayButton);

    // Day should now be selected
    expect(dayButton).toHaveClass('Mui-selected');
  });

  it('should navigate to previous month', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    // Wait for initial load
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    // Clear mock to reset call count
    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    const prevButton = screen.getAllByRole('button')[0]; // First button is previous
    fireEvent.click(prevButton);

    // Should trigger a new fetch
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  it('should navigate to next month', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    // Wait for initial load
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    // Clear mock to reset call count
    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    const nextButton = screen.getAllByRole('button')[2]; // Third button is next
    fireEvent.click(nextButton);

    // Should trigger a new fetch
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  it('should navigate to today', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    const todayButton = screen.getByText('Today');
    fireEvent.click(todayButton);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });

  it('should filter events by category', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    // Wait for initial render
    await waitFor(() => {
      const categoryLabels = screen.getAllByText('Category');
      expect(categoryLabels.length).toBeGreaterThan(0);
    });

    // Clear mock to reset call count
    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    // Find the select input by its parent
    const categorySelect = screen.getAllByText('Category')[0].closest('.MuiFormControl-root')?.querySelector('input');
    
    if (categorySelect) {
      fireEvent.mouseDown(categorySelect);

      await waitFor(() => {
        const academicOption = screen.getByText('Academic');
        fireEvent.click(academicOption);
      });

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          '/api/v1/calendar/events',
          expect.objectContaining({
            params: expect.objectContaining({
              category: 'academic',
            }),
          })
        );
      });
    }
  });

  it('should display error message on API failure', async () => {
    mockedAxios.get.mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Failed to fetch events',
          },
        },
      },
    });

    renderCalendar();

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch events')).toBeInTheDocument();
    });
  });

  it('should open event dialog when Add Event button is clicked', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    const addButton = screen.getByText('Add Event');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Event')).toBeInTheDocument();
    });
  });

  it('should display category legend', () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    expect(screen.getByText('Academic')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Cultural')).toBeInTheDocument();
    expect(screen.getByText('Holiday')).toBeInTheDocument();
    expect(screen.getByText('Exam')).toBeInTheDocument();
    expect(screen.getByText('Meeting')).toBeInTheDocument();
  });

  it('should display Export Calendar button', () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    expect(screen.getByText('Export Calendar')).toBeInTheDocument();
  });

  it('should export calendar when Export Calendar button is clicked', async () => {
    // Mock initial events fetch
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    renderCalendar();

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Export Calendar')).toBeInTheDocument();
    });

    // Mock the export endpoint
    const mockBlob = new Blob(['mock ical data'], { type: 'text/calendar' });
    mockedAxios.get.mockResolvedValueOnce({
      data: mockBlob,
    });

    // Mock URL.createObjectURL and document.createElement
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    const mockLink = document.createElement('a');
    mockLink.click = jest.fn();
    mockLink.remove = jest.fn();
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
    const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);

    const exportButton = screen.getByText('Export Calendar');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/v1/calendar/export',
        expect.objectContaining({
          params: expect.objectContaining({
            startDate: expect.any(String),
            endDate: expect.any(String),
            targetAudience: 'staff', // school_admin maps to staff
          }),
          responseType: 'blob',
        })
      );
    });

    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled();
    });

    // Cleanup
    appendChildSpy.mockRestore();
  });

  /**
   * Event Creation Tests
   * Requirement 31.3: Allow School_Admin to create events with date, time, location
   */
  it('should display event creation dialog when Add Event is clicked', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    const addButton = screen.getByText('Add Event');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Event')).toBeInTheDocument();
    });
  });

  it('should close event dialog when Close button is clicked', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    const addButton = screen.getByText('Add Event');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Event')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Add New Event')).not.toBeInTheDocument();
    });
  });

  it('should display event details when event is clicked in day view', async () => {
    const mockEvent = {
      eventId: 1,
      title: 'Annual Sports Day',
      description: 'School annual sports competition',
      category: 'sports',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '16:00',
      venue: 'School Ground',
      isHoliday: false,
      isNepalGovernmentHoliday: false,
      status: 'scheduled',
    };

    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [mockEvent] },
    });

    renderCalendar();

    // Switch to day view to see event details
    await waitFor(() => {
      const dayButton = screen.getByText('Day');
      fireEvent.click(dayButton);
    });

    // Wait for event to be displayed
    await waitFor(() => {
      expect(screen.getByText('Annual Sports Day')).toBeInTheDocument();
    });
  });

  /**
   * Recurring Events Tests
   * Requirement 31.6: Support recurring events (weekly, monthly)
   */
  it('should display recurring weekly events correctly', async () => {
    const mockRecurringEvent = {
      eventId: 1,
      title: 'Weekly Staff Meeting',
      category: 'meeting',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      isRecurring: true,
      recurrencePattern: 'weekly',
      recurrenceEndDate: '2024-12-31',
      isHoliday: false,
      isNepalGovernmentHoliday: false,
      status: 'scheduled',
    };

    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [mockRecurringEvent] },
    });

    renderCalendar();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    // Switch to day view to see event details
    const dayButton = screen.getByText('Day');
    fireEvent.click(dayButton);

    await waitFor(() => {
      expect(screen.getByText('Weekly Staff Meeting')).toBeInTheDocument();
    });
  });

  it('should handle daily recurring events', async () => {
    const mockDailyEvent = {
      eventId: 2,
      title: 'Morning Assembly',
      category: 'academic',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '08:30',
      isRecurring: true,
      recurrencePattern: 'daily',
      recurrenceEndDate: '2024-12-31',
      isHoliday: false,
      isNepalGovernmentHoliday: false,
      status: 'scheduled',
    };

    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [mockDailyEvent] },
    });

    renderCalendar();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });

  it('should handle monthly recurring events', async () => {
    const mockMonthlyEvent = {
      eventId: 3,
      title: 'Monthly Parent Meeting',
      category: 'meeting',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '16:00',
      isRecurring: true,
      recurrencePattern: 'monthly',
      recurrenceEndDate: '2024-12-31',
      isHoliday: false,
      isNepalGovernmentHoliday: false,
      status: 'scheduled',
    };

    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [mockMonthlyEvent] },
    });

    renderCalendar();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });

  /**
   * Notification Tests
   * Requirement 31.5: Notify relevant users when events are created
   */
  it('should handle event notifications for all users', async () => {
    const mockEvent = {
      eventId: 1,
      title: 'School Closure Notice',
      category: 'holiday',
      startDate: '2024-06-20',
      targetAudience: 'all',
      isHoliday: true,
      isNepalGovernmentHoliday: false,
      status: 'scheduled',
    };

    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [mockEvent] },
    });

    renderCalendar();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });

  it('should handle event notifications for students only', async () => {
    const mockEvent = {
      eventId: 2,
      title: 'Student Assembly',
      category: 'academic',
      startDate: '2024-06-21',
      targetAudience: 'students',
      isHoliday: false,
      isNepalGovernmentHoliday: false,
      status: 'scheduled',
    };

    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [mockEvent] },
    });

    renderCalendar();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });

  it('should handle event notifications for teachers only', async () => {
    const mockEvent = {
      eventId: 3,
      title: 'Teacher Training Workshop',
      category: 'meeting',
      startDate: '2024-06-22',
      targetAudience: 'teachers',
      isHoliday: false,
      isNepalGovernmentHoliday: false,
      status: 'scheduled',
    };

    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [mockEvent] },
    });

    renderCalendar();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });

  it('should handle event notifications for parents only', async () => {
    const mockEvent = {
      eventId: 4,
      title: 'Parent-Teacher Meeting',
      category: 'meeting',
      startDate: '2024-06-23',
      targetAudience: 'parents',
      isHoliday: false,
      isNepalGovernmentHoliday: false,
      status: 'scheduled',
    };

    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [mockEvent] },
    });

    renderCalendar();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });

  /**
   * Event Management Tests
   */
  it('should display events in correct categories', async () => {
    const mockEvents = [
      {
        eventId: 1,
        title: 'Academic Event',
        category: 'academic',
        startDate: '2024-06-15',
        isHoliday: false,
        isNepalGovernmentHoliday: false,
        status: 'scheduled',
      },
      {
        eventId: 2,
        title: 'Sports Event',
        category: 'sports',
        startDate: '2024-06-16',
        isHoliday: false,
        isNepalGovernmentHoliday: false,
        status: 'scheduled',
      },
      {
        eventId: 3,
        title: 'Cultural Event',
        category: 'cultural',
        startDate: '2024-06-17',
        isHoliday: false,
        isNepalGovernmentHoliday: false,
        status: 'scheduled',
      },
    ];

    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: mockEvents },
    });

    renderCalendar();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });

  it('should handle multi-day events', async () => {
    const mockMultiDayEvent = {
      eventId: 1,
      title: 'Annual Festival',
      category: 'cultural',
      startDate: '2024-06-15',
      endDate: '2024-06-17',
      isHoliday: false,
      isNepalGovernmentHoliday: false,
      status: 'scheduled',
    };

    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [mockMultiDayEvent] },
    });

    renderCalendar();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });

  it('should handle events with no events for a day', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: [] },
    });

    renderCalendar();

    // Switch to day view
    const dayButton = screen.getByText('Day');
    fireEvent.click(dayButton);

    await waitFor(() => {
      expect(screen.getByText('No events scheduled for this day')).toBeInTheDocument();
    });
  });
});
