/**
 * Invoice Generation Page
 * Create single or bulk invoices
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Autocomplete,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  useTheme,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Group as GroupIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface FeeStructure {
  feeStructureId: number;
  name: string;
  amount: number;
  totalAmount?: number;
  academicYearId: number;
}

interface Student {
  studentId: number;
  firstNameEn: string;
  lastNameEn: string;
  classId: number;
  className: string;
}

interface Class {
  classId: number;
  name: string;
  gradeLevel: number;
}

export function InvoiceGeneration() {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const navigate = useSlugNavigate();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [generationType, setGenerationType] = useState<'single' | 'bulk'>('single');

  // Data
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  // Single invoice form
  const [singleForm, setSingleForm] = useState({
    studentId: '',
    feeStructureId: '',
    dueDate: '',
    discount: 0,
    discountReason: '',
    remarks: '',
  });

  // Bulk invoice form
  const [bulkForm, setBulkForm] = useState({
    classId: '',
    feeStructureId: '',
    dueDate: '',
    studentIds: [] as number[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [feeRes, studentsRes, classesRes] = await Promise.all([
        apiClient.get('/finance/fee-structures'),
        apiClient.get('/students?limit=1000'),
        apiClient.get('/academic/classes'),
      ]);

      setFeeStructures(feeRes.data?.data || []);
      setStudents(studentsRes.data?.data || []);
      setClasses(classesRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  const handleGenerateSingle = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient.post('/finance/invoices', {
        studentId: Number(singleForm.studentId),
        feeStructureId: Number(singleForm.feeStructureId),
        dueDate: singleForm.dueDate,
        discount: singleForm.discount,
        discountReason: singleForm.discountReason,
        remarks: singleForm.remarks,
      });

      setSuccess(t('finance.invoiceGeneratedSuccess', { number: response.data?.data?.invoiceNumber }));
      setTimeout(() => {
        navigate(`/finance/invoices`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('finance.failedToGenerateInvoice'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBulk = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient.post('/finance/invoices/bulk-generate', {
        classId: bulkForm.classId ? Number(bulkForm.classId) : undefined,
        studentIds: bulkForm.studentIds.length > 0 ? bulkForm.studentIds : undefined,
        feeStructureId: Number(bulkForm.feeStructureId),
        dueDate: bulkForm.dueDate,
      });

      const result = response.data?.data;
      setSuccess(
        `${t('finance.generateInvoices')}! ${t('finance.success')}: ${result?.successful || 0}, ${t('finance.error')}: ${result?.failed || 0}`
      );
      setTimeout(() => {
        navigate(`/finance/invoices`);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('finance.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = bulkForm.classId
    ? students.filter((s) => s.classId === Number(bulkForm.classId))
    : students;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          {t('finance.generateInvoices')}
        </Typography>
        <Button variant="outlined" sx={S.BTN_OUTLINE} onClick={() => navigate(`/finance/invoices`)}>
          {t('finance.invoices')}
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ ...S.GLASS, p: 3, mb: 3 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">{t('finance.generateInvoices')}</FormLabel>
          <RadioGroup
            row
            value={generationType}
            onChange={(e) => setGenerationType(e.target.value as 'single' | 'bulk')}
          >
            <FormControlLabel
              value="single"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon /> {t('finance.createInvoice')}
                </Box>
              }
            />
            <FormControlLabel
              value="bulk"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupIcon /> {t('finance.generateInvoices')}
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>
      </Paper>

      {generationType === 'single' ? (
        <Paper sx={{ ...S.GLASS, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('finance.createInvoice')}
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('finance.student')}</InputLabel>
                <Select
                  value={singleForm.studentId}
                  label={t('finance.student')}
                  onChange={(e) => setSingleForm({ ...singleForm, studentId: e.target.value })}
                >
                  {students.map((student) => (
                    <MenuItem key={student.studentId} value={student.studentId}>
                      {student.firstNameEn} {student.lastNameEn} - {student.className}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('finance.feeStructure')}</InputLabel>
                <Select
                  value={singleForm.feeStructureId}
                  label={t('finance.feeStructure')}
                  onChange={(e) => setSingleForm({ ...singleForm, feeStructureId: e.target.value })}
                >
                  {feeStructures.map((fee) => (
                    <MenuItem key={fee.feeStructureId} value={fee.feeStructureId}>
                      {fee.name} - NPR {fee.totalAmount?.toLocaleString() || '0'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t('finance.dueDate')}
                type="date"
                value={singleForm.dueDate}
                onChange={(e) => setSingleForm({ ...singleForm, dueDate: e.target.value })}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t('finance.discount')}
                type="number"
                value={singleForm.discount}
                onChange={(e) => setSingleForm({ ...singleForm, discount: Number(e.target.value) })}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label={t('finance.refundReason')}
                value={singleForm.discountReason}
                onChange={(e) => setSingleForm({ ...singleForm, discountReason: e.target.value })}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label={t('finance.paymentNotes')}
                multiline
                rows={3}
                value={singleForm.remarks}
                onChange={(e) => setSingleForm({ ...singleForm, remarks: e.target.value })}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained" sx={S.BTN_PRIMARY}
                size="large"
                startIcon={<ReceiptIcon />}
                onClick={handleGenerateSingle}
                disabled={loading || !singleForm.studentId || !singleForm.feeStructureId || !singleForm.dueDate}
                fullWidth
              >
                {loading ? t('finance.processing') : t('finance.generateInvoice')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <Paper sx={{ ...S.GLASS, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('finance.generateInvoices')}
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('finance.selectClassOptional')}</InputLabel>
                <Select
                  value={bulkForm.classId}
                  label={t('finance.selectClassOptional')}
                  onChange={(e) => setBulkForm({ ...bulkForm, classId: e.target.value, studentIds: [] })}
                >
                  <MenuItem value="">{t('finance.allClasses')}</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls.classId} value={cls.classId}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('finance.feeStructure')}</InputLabel>
                <Select
                  value={bulkForm.feeStructureId}
                  label={t('finance.feeStructure')}
                  onChange={(e) => setBulkForm({ ...bulkForm, feeStructureId: e.target.value })}
                >
                  {feeStructures.map((fee) => (
                    <MenuItem key={fee.feeStructureId} value={fee.feeStructureId}>
                      {fee.name} - NPR {fee.totalAmount?.toLocaleString() || '0'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label={t('finance.dueDate')}
                type="date"
                value={bulkForm.dueDate}
                onChange={(e) => setBulkForm({ ...bulkForm, dueDate: e.target.value })}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={filteredStudents}
                getOptionLabel={(option) => `${option.firstNameEn} ${option.lastNameEn} - ${option.className}`}
                value={filteredStudents.filter((s) => bulkForm.studentIds.includes(s.studentId))}
                onChange={(_, newValue) => {
                  setBulkForm({ ...bulkForm, studentIds: newValue.map((s) => s.studentId) });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('finance.selectStudent')}
                    helperText={t('finance.pleaseWait')}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={`${option.firstNameEn} ${option.lastNameEn}`}
                      {...getTagProps({ index })}
                      size="small"
                    />
                  ))
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('finance.summary')}
                  </Typography>
                  <Typography variant="body1">
                    {bulkForm.classId
                      ? `${t('finance.className')}: ${classes.find((c) => c.classId === Number(bulkForm.classId))?.name}`
                      : t('finance.allClasses')}
                  </Typography>
                  <Typography variant="body1">
                    {t('finance.studentName')}: {bulkForm.studentIds.length > 0 ? bulkForm.studentIds.length : t('finance.allClasses')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained" sx={S.BTN_PRIMARY}
                size="large"
                startIcon={<GroupIcon />}
                onClick={handleGenerateBulk}
                disabled={loading || !bulkForm.feeStructureId || !bulkForm.dueDate}
                fullWidth
              >
                {loading ? t('finance.processing') : t('finance.generateInvoices')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}

export default InvoiceGeneration;
