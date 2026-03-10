/**
 * Behavior Tracking - Record and monitor student behavior
 * For Class Teachers to track discipline and conduct
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Grid,
  Card,
  CardContent,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface BehaviorRecord {
  id: number;
  studentId: number;
  studentName: string;
  type: 'positive' | 'negative' | 'neutral';
  category: string;
  description: string;
  actionTaken?: string;
  date: string;
  recordedBy: string;
}

interface Student {
  studentId: number;
  firstNameEn: string;
  lastNameEn: string;
  rollNumber: string;
}

export function BehaviorTracking() {
  const [records, setRecords] = useState<BehaviorRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    studentId: null as number | null,
    type: 'neutral' as 'positive' | 'negative' | 'neutral',
    category: '',
    description: '',
    actionTaken: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, studentsRes] = await Promise.all([
        api.get('/teacher/behavior-records'),
        api.get('/teacher/my-class'),
      ]);
      setRecords(recordsRes.data?.data || []);
      setStudents(studentsRes.data?.data?.students || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post('/teacher/behavior-records', formData);
      setSuccess('Behavior record added successfully');
      setOpenDialog(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
      setFormData({
        studentId: null,
        type: 'neutral',
        category: '',
        description: '',
        actionTaken: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add record');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      default: return 'default';
    }
  };

  const stats = {
    total: records.length,
    positive: records.filter((r) => r.type === 'positive').length,
    negative: records.filter((r) => r.type === 'negative').length,
    neutral: records.filter((r) => r.type === 'neutral').length,
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Behavior Tracking
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Record Behavior
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total Records</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main' }} />
              <Typography variant="h4" fontWeight={700} color="success.main">{stats.positive}</Typography>
              <Typography variant="body2" color="text.secondary">Positive</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingDownIcon sx={{ fontSize: 32, color: 'error.main' }} />
              <Typography variant="h4" fontWeight={700} color="error.main">{stats.negative}</Typography>
              <Typography variant="body2" color="text.secondary">Negative</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>{stats.neutral}</Typography>
              <Typography variant="body2" color="text.secondary">Neutral</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Action Taken</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No behavior records found
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>{record.studentName}</TableCell>
                  <TableCell>
                    <Chip
                      label={record.type}
                      color={getTypeColor(record.type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{record.category}</TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>{record.actionTaken || '—'}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" title="View Details">
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Student Behavior</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Autocomplete
              options={students}
              getOptionLabel={(option) => `${option.rollNumber} - ${option.firstNameEn} ${option.lastNameEn}`}
              onChange={(_, value) => setFormData({ ...formData, studentId: value?.studentId || null })}
              renderInput={(params) => (
                <TextField {...params} label="Student" required />
              )}
            />

            <TextField
              label="Type"
              select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              required
              fullWidth
            >
              <MenuItem value="positive">Positive</MenuItem>
              <MenuItem value="negative">Negative</MenuItem>
              <MenuItem value="neutral">Neutral</MenuItem>
            </TextField>

            <TextField
              label="Category"
              select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              fullWidth
            >
              <MenuItem value="discipline">Discipline</MenuItem>
              <MenuItem value="participation">Participation</MenuItem>
              <MenuItem value="homework">Homework</MenuItem>
              <MenuItem value="attendance">Attendance</MenuItem>
              <MenuItem value="conduct">Conduct</MenuItem>
              <MenuItem value="achievement">Achievement</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>

            <TextField
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              fullWidth
              helperText="Describe the behavior or incident"
            />

            <TextField
              label="Action Taken"
              multiline
              rows={2}
              value={formData.actionTaken}
              onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
              fullWidth
              helperText="What action was taken (if any)"
            />

            <TextField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.studentId || !formData.description}
          >
            Record Behavior
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BehaviorTracking;
