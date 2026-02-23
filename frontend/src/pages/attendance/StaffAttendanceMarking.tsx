/**
 * Staff Attendance Marking Page
 * 
 * Mark daily attendance for staff members
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  PersonAdd as StaffIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface Staff {
  staffId: number;
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  designation: string;
  department: string;
  attendance_status?: 'present' | 'absent' | 'late' | 'on_leave';
  remarks?: string;
}

export function StaffAttendanceMarking() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStaff();
  }, [department]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params: any = { status: 'active' };
      if (department !== 'all') params.department = department;

      const response = await api.get('/staff', { params });
      const staffData = response.data?.data || response.data || [];
      
      const staffWithStatus = Array.isArray(staffData)
        ? staffData.map((s: Staff) => ({
            ...s,
            attendance_status: 'present' as const,
            remarks: '',
          }))
        : [];
      
      setStaff(staffWithStatus);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      setError('Failed to load staff members');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (staffId: number, status: string) => {
    setStaff(staff.map(s => 
      s.staffId === staffId 
        ? { ...s, attendance_status: status as any }
        : s
    ));
  };

  const handleRemarksChange = (staffId: number, remarks: string) => {
    setStaff(staff.map(s => 
      s.staffId === staffId 
        ? { ...s, remarks }
        : s
    ));
  };

  const handleMarkAllPresent = () => {
    setStaff(staff.map(s => ({
      ...s,
      attendance_status: 'present' as const,
      remarks: '',
    })));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const attendanceRecords = staff.map(s => ({
        staffId: s.staffId,
        status: s.attendance_status || 'present',
        remarks: s.remarks || '',
      }));

      // Convert date to ISO format
      const dateISO = new Date(selectedDate).toISOString();

      // Save to backend API
      await api.post('/attendance/staff/bulk', {
        date: dateISO,
        records: attendanceRecords,
      });

      setSuccess('Staff attendance marked successfully! / कर्मचारी उपस्थिति सफलतापूर्वक चिन्ह लगाइयो!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error: any) {
      console.error('Failed to mark attendance:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to mark attendance';
      setError(`Error: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const getFullName = (staff: Staff) => {
    return `${staff.firstNameEn} ${staff.middleNameEn || ''} ${staff.lastNameEn}`.trim();
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <StaffIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={600}>
            Mark Staff Attendance
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 200 }}
          />
          <FormControl sx={{ width: 200 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={department}
              label="Department"
              onChange={(e) => setDepartment(e.target.value)}
            >
              <MenuItem value="all">All Departments</MenuItem>
              <MenuItem value="teaching">Teaching</MenuItem>
              <MenuItem value="administration">Administration</MenuItem>
              <MenuItem value="support">Support</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={handleMarkAllPresent}
            disabled={loading || staff.length === 0}
          >
            Mark All Present
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : staff.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No staff members found
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Staff Name</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell width={200}>Status</TableCell>
                  <TableCell width={300}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.staffId}>
                    <TableCell>{getFullName(s)}</TableCell>
                    <TableCell>{s.designation}</TableCell>
                    <TableCell>
                      <Chip label={s.department} size="small" />
                    </TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select
                          value={s.attendance_status}
                          onChange={(e) => handleStatusChange(s.staffId, e.target.value)}
                        >
                          <MenuItem value="present">Present</MenuItem>
                          <MenuItem value="absent">Absent</MenuItem>
                          <MenuItem value="late">Late</MenuItem>
                          <MenuItem value="on_leave">On Leave</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Add remarks..."
                        value={s.remarks}
                        onChange={(e) => handleRemarksChange(s.staffId, e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

export default StaffAttendanceMarking;
