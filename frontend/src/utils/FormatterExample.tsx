/**
 * Example Component Demonstrating Number and Currency Formatting
 * 
 * Shows how to use the formatting utilities in React components
 * 
 * Requirements: 30.6, 30.8
 */

import React from 'react';
import { Box, Typography, Paper, Grid, Divider } from '@mui/material';
import { useFormatters } from './useFormatters';

/**
 * Example component showing various formatting options
 */
export const FormatterExample: React.FC = () => {
  const {
    formatNumber,
    formatCurrency,
    formatPercentage,
    formatCompactNumber,
    currentLanguage,
  } = useFormatters();

  const sampleAmount = 1234567.89;
  const samplePercentage = 75.5;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Number and Currency Formatting Examples
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Current Language: {currentLanguage === 'ne' ? 'Nepali (नेपाली)' : 'English'}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Currency Formatting */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Currency Formatting
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Standard Format:
              </Typography>
              <Typography variant="h5">
                {formatCurrency(sampleAmount)}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                With Nepali Numerals (optional):
              </Typography>
              <Typography variant="h5">
                {formatCurrency(sampleAmount, 2, true)}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No Decimals:
              </Typography>
              <Typography variant="h5">
                {formatCurrency(sampleAmount, 0)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Small Amount:
              </Typography>
              <Typography variant="h5">
                {formatCurrency(99.50)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Number Formatting */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Number Formatting
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Standard Format:
              </Typography>
              <Typography variant="h5">
                {formatNumber(sampleAmount)}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                With Nepali Numerals:
              </Typography>
              <Typography variant="h5">
                {formatNumber(sampleAmount, 2, true)}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Thousands:
              </Typography>
              <Typography variant="h5">
                {formatNumber(1000)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Lakhs:
              </Typography>
              <Typography variant="h5">
                {formatNumber(100000)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Percentage Formatting */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Percentage Formatting
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Attendance Rate:
              </Typography>
              <Typography variant="h5">
                {formatPercentage(samplePercentage)}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                With Nepali Numerals:
              </Typography>
              <Typography variant="h5">
                {formatPercentage(samplePercentage, 2, true)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Pass Rate:
              </Typography>
              <Typography variant="h5">
                {formatPercentage(92.5)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Compact Number Formatting */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Compact Number Formatting
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Thousands (K):
              </Typography>
              <Typography variant="h5">
                {formatCompactNumber(1500)}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Lakhs (L):
              </Typography>
              <Typography variant="h5">
                {formatCompactNumber(150000)}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Crores (Cr):
              </Typography>
              <Typography variant="h5">
                {formatCompactNumber(15000000)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                With Nepali Numerals:
              </Typography>
              <Typography variant="h5">
                {formatCompactNumber(15000000, 1, true)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Real-world Examples */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Real-world Examples
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="white">
                    Total Students
                  </Typography>
                  <Typography variant="h4" color="white">
                    {formatNumber(1250, 0)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="white">
                    Fee Collection
                  </Typography>
                  <Typography variant="h4" color="white">
                    {formatCompactNumber(2500000)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="white">
                    Pending Fees
                  </Typography>
                  <Typography variant="h4" color="white">
                    {formatCurrency(350000, 0)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="white">
                    Attendance Rate
                  </Typography>
                  <Typography variant="h4" color="white">
                    {formatPercentage(87.5, 1)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FormatterExample;
