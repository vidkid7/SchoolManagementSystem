# BS Date Picker Component

A custom React date picker component for selecting Bikram Sambat (BS) dates with support for toggling between BS and AD calendar views.

## Features

- ✅ Display Nepali month names (बैशाख, जेठ, असार, etc.)
- ✅ Toggle between BS and AD calendar views
- ✅ Integration with React Hook Form
- ✅ Material-UI design patterns
- ✅ Dual date display format: "2081-10-24 BS (2025-02-06 AD)"
- ✅ Min/max date validation
- ✅ Today button for quick selection
- ✅ Responsive and accessible

## Requirements

This component satisfies the following requirements:
- **N4.2**: Default to BS calendar for Nepal deployment
- **N4.3**: Allow users to toggle between BS and AD display
- **N4.4**: Display dates in format: YYYY-MM-DD BS (YYYY-MM-DD AD)
- **N4.8**: Display Nepali month names

## Installation

The component is already included in the project. No additional installation is required.

## Usage

### Basic Usage

```tsx
import { BSDatePicker } from '@/components/BSDatePicker';
import { useState } from 'react';

function MyComponent() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <BSDatePicker
      label="Birth Date"
      value={date}
      onChange={setDate}
    />
  );
}
```

### With React Hook Form

```tsx
import { BSDatePickerField } from '@/components/BSDatePicker';
import { useForm } from 'react-hook-form';

interface FormData {
  birthDate: Date | null;
  admissionDate: Date | null;
}

function MyForm() {
  const { control, handleSubmit } = useForm<FormData>({
    defaultValues: {
      birthDate: null,
      admissionDate: null
    }
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <BSDatePickerField
        name="birthDate"
        control={control}
        label="Birth Date"
        required
      />
      
      <BSDatePickerField
        name="admissionDate"
        control={control}
        label="Admission Date"
        required
      />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### With Validation

```tsx
import { BSDatePickerField } from '@/components/BSDatePicker';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const schema = yup.object({
  birthDate: yup.date().required('Birth date is required').nullable()
});

function MyForm() {
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(schema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <BSDatePickerField
        name="birthDate"
        control={control}
        label="Birth Date"
        required
      />
    </form>
  );
}
```

### With Min/Max Date

```tsx
import { BSDatePicker } from '@/components/BSDatePicker';

function MyComponent() {
  const [date, setDate] = useState<Date | null>(null);
  
  // Only allow dates from 2000 BS onwards
  const minDate = new Date('1943-04-14'); // 2000-01-01 BS
  
  // Only allow dates up to today
  const maxDate = new Date();

  return (
    <BSDatePicker
      label="Birth Date"
      value={date}
      onChange={setDate}
      minDate={minDate}
      maxDate={maxDate}
    />
  );
}
```

### With Default Calendar View

```tsx
import { BSDatePicker } from '@/components/BSDatePicker';

function MyComponent() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <BSDatePicker
      label="Birth Date"
      value={date}
      onChange={setDate}
      defaultCalendarView="AD" // Start with AD view instead of BS
    />
  );
}
```

## Props

### BSDatePicker Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `Date \| null` | `undefined` | The selected date value |
| `onChange` | `(date: Date \| null) => void` | **required** | Callback when date changes |
| `label` | `string` | `'Date'` | Label for the input field |
| `error` | `boolean` | `false` | Whether the field has an error |
| `helperText` | `string` | `undefined` | Helper text to display below the field |
| `disabled` | `boolean` | `false` | Whether the field is disabled |
| `required` | `boolean` | `false` | Whether the field is required |
| `minDate` | `Date` | `undefined` | Minimum selectable date |
| `maxDate` | `Date` | `undefined` | Maximum selectable date |
| `defaultCalendarView` | `'BS' \| 'AD'` | `'BS'` | Default calendar view to show |

### BSDatePickerField Props

Extends `BSDatePicker` props with additional React Hook Form props:

| Prop | Type | Description |
|------|------|-------------|
| `name` | `Path<T>` | Field name in the form |
| `control` | `Control<T>` | React Hook Form control object |

## Date Format

The component displays dates in the following format:

```
2081-10-24 BS (2025-02-06 AD)
```

This format satisfies requirement **N4.4**: Display dates in format: YYYY-MM-DD BS (YYYY-MM-DD AD)

## Nepali Month Names

The component displays the following Nepali month names:

1. बैशाख (Baisakh)
2. जेठ (Jestha)
3. असार (Asar)
4. श्रावण (Shrawan)
5. भाद्र (Bhadra)
6. आश्विन (Aswin)
7. कार्तिक (Kartik)
8. मंसिर (Mangsir)
9. पौष (Poush)
10. माघ (Magh)
11. फाल्गुन (Falgun)
12. चैत्र (Chaitra)

## Calendar Views

The component supports two calendar views:

1. **BS (Bikram Sambat)**: Displays Nepali month names and BS year
2. **AD (Anno Domini)**: Displays English month names and AD year

Users can toggle between views using the toggle buttons at the top of the calendar.

## Accessibility

The component follows Material-UI accessibility guidelines:

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Testing

Run the test suite:

```bash
npm test -- BSDatePicker.test.tsx
```

The test suite covers:
- Basic rendering and interaction
- BS/AD calendar view toggling
- Date selection and formatting
- React Hook Form integration
- Nepali month name display
- Min/max date validation
- Dual date format display

## Dependencies

- `@mui/material`: Material-UI components
- `@mui/icons-material`: Material-UI icons
- `nepali-date-converter`: BS/AD date conversion
- `react-hook-form`: Form integration
- `date-fns`: Date utilities (optional)

## Browser Support

The component supports all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Future Enhancements

Potential future improvements:

- [ ] Nepali numeral support (optional)
- [ ] Date range picker variant
- [ ] Time picker integration
- [ ] Keyboard shortcuts
- [ ] Custom date formats
- [ ] Localization support for other languages

## License

This component is part of the School Management System project.
