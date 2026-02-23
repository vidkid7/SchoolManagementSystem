import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Divider,
  Alert
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { BSDatePicker, BSDatePickerField } from './BSDatePicker';

/**
 * BS Date Picker Examples
 * 
 * This file demonstrates various usage patterns for the BS Date Picker component.
 * Use this as a reference for implementing date pickers in your forms.
 */

interface StudentFormData {
  birthDate: Date | null;
  admissionDate: Date | null;
  examDate: Date | null;
}

export const BSDatePickerExamples: React.FC = () => {
  // Example 1: Basic usage with state
  const [basicDate, setBasicDate] = useState<Date | null>(null);

  // Example 2: With min/max dates
  const [restrictedDate, setRestrictedDate] = useState<Date | null>(null);
  const minDate = new Date('2000-01-01');
  const maxDate = new Date();

  // Example 3: With React Hook Form
  const { control, handleSubmit, watch } = useForm<StudentFormData>({
    defaultValues: {
      birthDate: null,
      admissionDate: null,
      examDate: null
    }
  });

  const formValues = watch();

  const onSubmit = (data: StudentFormData) => {
    console.log('Form submitted:', data);
    alert('Form submitted! Check console for values.');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        BS Date Picker Examples
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Examples demonstrating various usage patterns for the BS Date Picker
        component.
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* Example 1: Basic Usage */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Example 1: Basic Usage
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Simple date picker with state management
        </Typography>

        <Box sx={{ maxWidth: 400 }}>
          <BSDatePicker
            label="Select Date"
            value={basicDate}
            onChange={setBasicDate}
          />
        </Box>

        {basicDate && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Selected Date: {basicDate.toISOString()}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" component="pre">
            {`const [date, setDate] = useState<Date | null>(null);

<BSDatePicker
  label="Select Date"
  value={date}
  onChange={setDate}
/>`}
          </Typography>
        </Box>
      </Paper>

      {/* Example 2: With Min/Max Dates */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Example 2: With Min/Max Date Restrictions
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Date picker with minimum and maximum date constraints
        </Typography>

        <Box sx={{ maxWidth: 400 }}>
          <BSDatePicker
            label="Birth Date"
            value={restrictedDate}
            onChange={setRestrictedDate}
            minDate={minDate}
            maxDate={maxDate}
            helperText="Only dates from 2000 to today are allowed"
          />
        </Box>

        {restrictedDate && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Selected Date: {restrictedDate.toISOString()}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" component="pre">
            {`const minDate = new Date('2000-01-01');
const maxDate = new Date();

<BSDatePicker
  label="Birth Date"
  value={date}
  onChange={setDate}
  minDate={minDate}
  maxDate={maxDate}
/>`}
          </Typography>
        </Box>
      </Paper>

      {/* Example 3: React Hook Form Integration */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Example 3: React Hook Form Integration
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Date picker integrated with React Hook Form for form validation
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <BSDatePickerField
                name="birthDate"
                control={control}
                label="Birth Date"
                required
                maxDate={new Date()}
                helperText="Student's date of birth"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <BSDatePickerField
                name="admissionDate"
                control={control}
                label="Admission Date"
                required
                helperText="Date of admission to school"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <BSDatePickerField
                name="examDate"
                control={control}
                label="Exam Date"
                minDate={new Date()}
                helperText="Upcoming exam date"
              />
            </Grid>

            <Grid item xs={12}>
              <button type="submit">Submit Form</button>
            </Grid>
          </Grid>
        </form>

        {(formValues.birthDate || formValues.admissionDate || formValues.examDate) && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Current Form Values:</Typography>
            <Typography variant="body2" component="pre">
              {JSON.stringify(
                {
                  birthDate: formValues.birthDate?.toISOString(),
                  admissionDate: formValues.admissionDate?.toISOString(),
                  examDate: formValues.examDate?.toISOString()
                },
                null,
                2
              )}
            </Typography>
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" component="pre">
            {`const { control, handleSubmit } = useForm<FormData>();

<BSDatePickerField
  name="birthDate"
  control={control}
  label="Birth Date"
  required
/>`}
          </Typography>
        </Box>
      </Paper>

      {/* Example 4: Different Calendar Views */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Example 4: Default Calendar View
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Date picker with different default calendar views
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <BSDatePicker
              label="BS Calendar (Default)"
              value={null}
              onChange={() => {}}
              defaultCalendarView="BS"
              helperText="Opens with BS calendar view"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <BSDatePicker
              label="AD Calendar"
              value={null}
              onChange={() => {}}
              defaultCalendarView="AD"
              helperText="Opens with AD calendar view"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" component="pre">
            {`<BSDatePicker
  defaultCalendarView="BS" // or "AD"
  ...
/>`}
          </Typography>
        </Box>
      </Paper>

      {/* Example 5: Required and Error States */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Example 5: Required and Error States
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Date picker with required and error states
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <BSDatePicker
              label="Required Field"
              value={null}
              onChange={() => {}}
              required
              helperText="This field is required"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <BSDatePicker
              label="Error State"
              value={null}
              onChange={() => {}}
              error
              helperText="Please select a valid date"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <BSDatePicker
              label="Disabled Field"
              value={new Date()}
              onChange={() => {}}
              disabled
              helperText="This field is disabled"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" component="pre">
            {`<BSDatePicker
  required
  error
  disabled
  helperText="Error message"
  ...
/>`}
          </Typography>
        </Box>
      </Paper>

      {/* Features Summary */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Features Summary
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <li>
            <Typography variant="body2">
              ✅ Display Nepali month names (बैशाख, जेठ, असार, etc.)
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              ✅ Toggle between BS and AD calendar views
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              ✅ Integration with React Hook Form
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              ✅ Material-UI design patterns
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              ✅ Dual date display format: "2081-10-24 BS (2025-02-06 AD)"
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              ✅ Min/max date validation
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              ✅ Today button for quick selection
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              ✅ Responsive and accessible
            </Typography>
          </li>
        </Box>
      </Paper>
    </Container>
  );
};

export default BSDatePickerExamples;
