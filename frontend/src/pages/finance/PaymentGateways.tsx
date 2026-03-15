/**
 * Payment Gateway Configuration
 * Configure eSewa, Khalti, IME Pay integrations
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Switch,
  TextField,
  Button,
  Alert,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface GatewayConfig {
  name: string;
  enabled: boolean;
  merchantId: string;
  secretKey: string;
  testMode: boolean;
}

interface Transaction {
  id: number;
  gateway: string;
  transactionId: string;
  amount: number;
  status: string;
  date: string;
  studentName: string;
}

export function PaymentGateways() {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [gateways, setGateways] = useState<Record<string, GatewayConfig>>({
    esewa: {
      name: 'eSewa',
      enabled: false,
      merchantId: '',
      secretKey: '',
      testMode: true,
    },
    khalti: {
      name: 'Khalti',
      enabled: false,
      merchantId: '',
      secretKey: '',
      testMode: true,
    },
    imepay: {
      name: 'IME Pay',
      enabled: false,
      merchantId: '',
      secretKey: '',
      testMode: true,
    },
  });

  useEffect(() => {
    fetchGatewayConfigs();
    fetchTransactions();
  }, []);

  const fetchGatewayConfigs = async () => {
    try {
      const response = await apiClient.get('/finance/payment-gateways/config');
      if (response.data?.data) {
        setGateways(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch gateway configs:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await apiClient.get('/finance/payment-gateways/transactions?limit=10');
      setTransactions(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
    }
  };

  const handleToggleGateway = (gatewayKey: string) => {
    setGateways({
      ...gateways,
      [gatewayKey]: {
        ...gateways[gatewayKey],
        enabled: !gateways[gatewayKey].enabled,
      },
    });
  };

  const handleUpdateConfig = (gatewayKey: string, field: string, value: string | boolean) => {
    setGateways({
      ...gateways,
      [gatewayKey]: {
        ...gateways[gatewayKey],
        [field]: value,
      },
    });
  };

  const handleSaveConfig = async (gatewayKey: string) => {
    try {
      await apiClient.put(`/finance/payment-gateways/${gatewayKey}`, gateways[gatewayKey]);
      setSuccess(t('finance.configSavedSuccess', { name: gateways[gatewayKey].name }));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('finance.failedToSaveConfig'));
    }
  };

  const handleTestConnection = async (gatewayKey: string) => {
    try {
      const response = await apiClient.post(`/finance/payment-gateways/${gatewayKey}/test`);
      if (response.data?.success) {
        setSuccess(t('finance.connectionTestSuccess', { name: gateways[gatewayKey].name }));
      } else {
        setError(t('finance.connectionTestFailed', { name: gateways[gatewayKey].name }));
      }
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('finance.connectionTestFailed', { name: '' }));
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        {t('finance.paymentGateways')}
      </Typography>
      <Typography color="text.secondary" paragraph>
        {t('finance.gatewaySettings')}
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        {Object.entries(gateways).map(([key, gateway]) => (
          <Grid item xs={12} md={4} key={key}>
            <Card sx={{ ...S.GLASS }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon color="primary" />
                    <Typography variant="h6">{gateway.name}</Typography>
                  </Box>
                  <Switch
                    checked={gateway.enabled}
                    onChange={() => handleToggleGateway(key)}
                    color="primary"
                  />
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label={t('finance.merchantId')}
                    value={gateway.merchantId}
                    onChange={(e) => handleUpdateConfig(key, 'merchantId', e.target.value)}
                    disabled={!gateway.enabled}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label={t('finance.secretKey')}
                    type="password"
                    value={gateway.secretKey}
                    onChange={(e) => handleUpdateConfig(key, 'secretKey', e.target.value)}
                    disabled={!gateway.enabled}
                    fullWidth
                    size="small"
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{t('finance.testMode')}</Typography>
                    <Switch
                      checked={gateway.testMode}
                      onChange={(e) => handleUpdateConfig(key, 'testMode', e.target.checked)}
                      disabled={!gateway.enabled}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained" sx={S.BTN_PRIMARY}
                      size="small"
                      fullWidth
                      onClick={() => handleSaveConfig(key)}
                      disabled={!gateway.enabled}
                    >
                      {t('common.save')}
                    </Button>
                    <Button
                      variant="outlined" sx={S.BTN_OUTLINE}
                      size="small"
                      fullWidth
                      onClick={() => handleTestConnection(key)}
                      disabled={!gateway.enabled}
                    >
                      {t('finance.testGateway')}
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {gateway.enabled ? (
                    <>
                      <CheckIcon color="success" fontSize="small" />
                      <Typography variant="caption" color="success.main">
                        {t('common.active')}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <CancelIcon color="disabled" fontSize="small" />
                      <Typography variant="caption" color="text.secondary">
                        {t('finance.inactive')}
                      </Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ ...S.GLASS, mt: 4, p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {t('finance.gatewayTransactions')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: S.TH_BG }}>
              <TableRow>
                <TableCell>{t('finance.transactionId')}</TableCell>
                <TableCell>{t('finance.gateway')}</TableCell>
                <TableCell>{t('finance.student')}</TableCell>
                <TableCell align="right">{t('finance.amount')}</TableCell>
                <TableCell>{t('finance.status')}</TableCell>
                <TableCell>{t('finance.date')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={6} align="center" sx={S.TD}>
                    {t('finance.noTransactions')}
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{transaction.transactionId}</TableCell>
                    <TableCell sx={S.TD}>
                      <Chip label={transaction.gateway} size="small" />
                    </TableCell>
                    <TableCell sx={S.TD}>{transaction.studentName}</TableCell>
                    <TableCell align="right" sx={S.TD}>NPR {transaction.amount.toLocaleString()}</TableCell>
                    <TableCell sx={S.TD}>
                      <Chip
                        label={transaction.status}
                        color={transaction.status === 'success' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={S.TD}>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ ...S.GLASS, mt: 3, p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {t('finance.integrationGuide')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              {t('finance.esewaIntegration')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('finance.esewaStep1')}
              <br />
              {t('finance.esewaStep2')}
              <br />
              {t('finance.esewaStep3')}
              <br />
              {t('finance.esewaStep4')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              {t('finance.khaltiIntegration')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('finance.khaltiStep1')}
              <br />
              {t('finance.khaltiStep2')}
              <br />
              {t('finance.khaltiStep3')}
              <br />
              {t('finance.khaltiStep4')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              {t('finance.imepayIntegration')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('finance.imepayStep1')}
              <br />
              {t('finance.imepayStep2')}
              <br />
              {t('finance.imepayStep3')}
              <br />
              {t('finance.imepayStep4')}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default PaymentGateways;
