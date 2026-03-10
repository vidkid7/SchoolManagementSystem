/**
 * Invoice Generation Page
 * Create single or bulk invoices
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Group as GroupIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface FeeStructure {
  feeStructureId: number;
  name: string;
  amount: number;
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
  const navigate = useNavigate();
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
        api.get('/finance/fee-structures'),
        api.get('/students?limit=1000'),
        api.get('/academic/classes'),
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

      const response = await api.post('/finance/invoices', {
        studentId: Number(singleForm.studentId),
        feeStructureId: Number(singleForm.feeStructureId),
        dueDate: singleForm.dueDate,
        discount: singleForm.discount,
        discountReason: singleForm.discountReason,
        remarks: singleForm.remarks,
      });

      setSuccess(`Invoice generated successfully! Invoice #${response.data?.data?.invoiceNumber}`);
      setTimeout(() => {
        navigate('/finance/invoices');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBulk = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.post('/finance/invoices/bulk-generate', {
        classId: bulkForm.classId ? Number(bulkForm.classId) : undefined,
        studentIds: bulkForm.studentIds.length > 0 ? bulkForm.studentIds : undefined,
        feeStructureId: Number(bulkForm.feeStructureId),
        dueDate: bulkForm.dueDate,
      });

      const result = response.data?.data;
      setSuccess(
        `Bulk generation completed! Successful: ${result?.successful || 0}, Failed: ${result?.failed || 0}`
      );
      setTimeout(() => {
        navigate('/finance/invoices');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate bulk invoices');
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
          Generate Invoices
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/finance/invoices')}>
          Back to Invoices
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Generation Type</FormLabel>
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
                  <PersonIcon /> Single Invoice
                </Box>
              }
            />
            <FormControlLabel
              value="bulk"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupIcon /> Bulk Generation
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>
      </Paper>

      {generationType === 'single' ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Single Invoice Generation
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Student</InputLabel>
                <Select
                  value={singleForm.studentId}
                  label="Student"
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
                <InputLabel>Fee Structure</InputLabel>
                <Select
                  value={singleForm.feeStructureId}
                  label="Fee Structure"
                  onChange={(e) => setSingleForm({ ...singleForm, feeStructureId: e.target.value })}
                >
                  {feeStructures.map((fee) => (
                    <MenuItem key={fee.feeStructureId} value={fee.feeStructureId}>
                      {fee.name} - NPR {fee.amount.toLocaleString()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Due Date"
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
                label="Discount (NPR)"
                type="number"
                value={singleForm.discount}
                onChange={(e) => setSingleForm({ ...singleForm, discount: Number(e.target.value) })}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Discount Reason"
                value={singleForm.discountReason}
                onChange={(e) => setSingleForm({ ...singleForm, discountReason: e.target.value })}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Remarks"
                multiline
                rows={3}
                value={singleForm.remarks}
                onChange={(e) => setSingleForm({ ...singleForm, remarks: e.target.value })}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ReceiptIcon />}
                onClick={handleGenerateSingle}
                disabled={loading || !singleForm.studentId || !singleForm.feeStructureId || !singleForm.dueDate}
                fullWidth
              >
                {loading ? 'Generating...' : 'Generate Invoice'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Bulk Invoice Generation
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Class (Optional)</InputLabel>
                <Select
                  value={bulkForm.classId}
                  label="Class (Optional)"
                  onChange={(e) => setBulkForm({ ...bulkForm, classId: e.target.value, studentIds: [] })}
                >
                  <MenuItem value="">All Classes</MenuItem>
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
                <InputLabel>Fee Structure</InputLabel>
                <Select
                  value={bulkForm.feeStructureId}
                  label="Fee Structure"
                  onChange={(e) => setBulkForm({ ...bulkForm, feeStructureId: e.target.value })}
                >
                  {feeStructures.map((fee) => (
                    <MenuItem key={fee.feeStructureId} value={fee.feeStructureId}>
                      {fee.name} - NPR {fee.amount.toLocaleString()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Due Date"
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
                    label="Select Specific Students (Optional)"
                    helperText="Leave empty to generate for all students in selected class"
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
                    Summary
                  </Typography>
                  <Typography variant="body1">
                    {bulkForm.classId
                      ? `Class: ${classes.find((c) => c.classId === Number(bulkForm.classId))?.name}`
                      : 'All Classes'}
                  </Typography>
                  <Typography variant="body1">
                    Students: {bulkForm.studentIds.length > 0 ? bulkForm.studentIds.length : 'All'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                size="large"
                startIcon={<GroupIcon />}
                onClick={handleGenerateBulk}
                disabled={loading || !bulkForm.feeStructureId || !bulkForm.dueDate}
                fullWidth
              >
                {loading ? 'Generating...' : 'Generate Bulk Invoices'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}

export default InvoiceGeneration;
