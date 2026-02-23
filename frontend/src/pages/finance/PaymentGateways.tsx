/**
 * Payment Gateway Configuration
 * Configure eSewa, Khalti, IME Pay integrations
 */

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import api from '../../config/api';

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
      const response = await api.get('/finance/payment-gateways/config');
      if (response.data?.data) {
        setGateways(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch gateway configs:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/finance/payment-gateways/transactions?limit=10');
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
      await api.put(`/finance/payment-gateways/${gatewayKey}`, gateways[gatewayKey]);
      setSuccess(`${gateways[gatewayKey].name} configuration saved successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save configuration');
    }
  };

  const handleTestConnection = async (gatewayKey: string) => {
    try {
      const response = await api.post(`/finance/payment-gateways/${gatewayKey}/test`);
      if (response.data?.success) {
        setSuccess(`${gateways[gatewayKey].name} connection test successful`);
      } else {
        setError(`${gateways[gatewayKey].name} connection test failed`);
      }
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection test failed');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Payment Gateway Configuration
      </Typography>
      <Typography color="text.secondary" paragraph>
        Configure and manage payment gateway integrations for online fee collection
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        {Object.entries(gateways).map(([key, gateway]) => (
          <Grid item xs={12} md={4} key={key}>
            <Card>
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
                    label="Merchant ID"
                    value={gateway.merchantId}
                    onChange={(e) => handleUpdateConfig(key, 'merchantId', e.target.value)}
                    disabled={!gateway.enabled}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Secret Key"
                    type="password"
                    value={gateway.secretKey}
                    onChange={(e) => handleUpdateConfig(key, 'secretKey', e.target.value)}
                    disabled={!gateway.enabled}
                    fullWidth
                    size="small"
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Test Mode</Typography>
                    <Switch
                      checked={gateway.testMode}
                      onChange={(e) => handleUpdateConfig(key, 'testMode', e.target.checked)}
                      disabled={!gateway.enabled}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      onClick={() => handleSaveConfig(key)}
                      disabled={!gateway.enabled}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={() => handleTestConnection(key)}
                      disabled={!gateway.enabled}
                    >
                      Test
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {gateway.enabled ? (
                    <>
                      <CheckIcon color="success" fontSize="small" />
                      <Typography variant="caption" color="success.main">
                        Active
                      </Typography>
                    </>
                  ) : (
                    <>
                      <CancelIcon color="disabled" fontSize="small" />
                      <Typography variant="caption" color="text.secondary">
                        Inactive
                      </Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Recent Gateway Transactions
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Gateway</TableCell>
                <TableCell>Student</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.transactionId}</TableCell>
                    <TableCell>
                      <Chip label={transaction.gateway} size="small" />
                    </TableCell>
                    <TableCell>{transaction.studentName}</TableCell>
                    <TableCell align="right">NPR {transaction.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        color={transaction.status === 'success' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Integration Guide
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              eSewa Integration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              1. Register at esewa.com.np
              <br />
              2. Get Merchant ID and Secret Key
              <br />
              3. Configure webhook URL
              <br />
              4. Test in sandbox mode first
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Khalti Integration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              1. Register at khalti.com
              <br />
              2. Get Public and Secret Keys
              <br />
              3. Configure return URL
              <br />
              4. Enable test mode for testing
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              IME Pay Integration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              1. Contact IME Pay for merchant account
              <br />
              2. Get Merchant Code and credentials
              <br />
              3. Configure callback URL
              <br />
              4. Test with provided test credentials
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default PaymentGateways;
