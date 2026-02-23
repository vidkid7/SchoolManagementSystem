/**
 * ECA Management - Enrollments, Attendance, Events, Achievements
 */

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Alert, Grid } from '@mui/material';
import { Add as AddIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';
import api from '../../config/api';

function TabPanel({ children, value, index }: any) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>;
}

export function ECAManagement() {
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, [tabValue]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoints = ['/eca/enrollments', '/eca/attendance', '/eca/events', '/eca/achievements'];
      const response = await api.get(endpoints[tabValue]);
      setData(response.data?.data || []);
    } catch (err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const endpoints = ['/eca/enrollments', '/eca/attendance', '/eca/events', '/eca/achievements'];
      await api.post(endpoints[tabValue], formData);
      setSuccess('Operation successful');
      setOpenDialog(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const openEnrollDialog = () => {
    setFormData({ ecaId: '', studentId: '', enrollmentDate: new Date().toISOString().split('T')[0] });
    setOpenDialog(true);
  };

  const openAttendanceDialog = () => {
    setFormData({ ecaId: '', date: new Date().toISOString().split('T')[0], students: [] });
    setOpenDialog(true);
  };

  const openEventDialog = () => {
    setFormData({ ecaId: '', title: '', description: '', eventDate: '', venue: '' });
    setOpenDialog(true);
  };

  const openAchievementDialog = () => {
    setFormData({ studentId: '', ecaId: '', achievement: '', date: new Date().toISOString().split('T')[0], description: '' });
    setOpenDialog(true);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>ECA Management</Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Enrollments" />
          <Tab label="Attendance" />
          <Tab label="Events" />
          <Tab label="Achievements" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openEnrollDialog}>Enroll Student</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>ECA</TableCell>
                  <TableCell>Enrollment Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={4} align="center">Loading...</TableCell></TableRow> : data.length === 0 ? <TableRow><TableCell colSpan={4} align="center">No enrollments</TableCell></TableRow> : data.map((item: any, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.studentName}</TableCell>
                    <TableCell>{item.ecaName}</TableCell>
                    <TableCell>{new Date(item.enrollmentDate).toLocaleDateString()}</TableCell>
                    <TableCell><Chip label={item.status} color="success" size="small" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAttendanceDialog}>Mark Attendance</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ECA</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Present</TableCell>
                  <TableCell>Absent</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={4} align="center">Loading...</TableCell></TableRow> : data.length === 0 ? <TableRow><TableCell colSpan={4} align="center">No attendance records</TableCell></TableRow> : data.map((item: any, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.ecaName}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell>{item.presentCount}</TableCell>
                    <TableCell>{item.absentCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openEventDialog}>Create Event</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event Title</TableCell>
                  <TableCell>ECA</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Venue</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={5} align="center">Loading...</TableCell></TableRow> : data.length === 0 ? <TableRow><TableCell colSpan={5} align="center">No events</TableCell></TableRow> : data.map((item: any, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.ecaName}</TableCell>
                    <TableCell>{new Date(item.eventDate).toLocaleDateString()}</TableCell>
                    <TableCell>{item.venue}</TableCell>
                    <TableCell><Chip label={item.status} size="small" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<TrophyIcon />} onClick={openAchievementDialog}>Record Achievement</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>ECA</TableCell>
                  <TableCell>Achievement</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={4} align="center">Loading...</TableCell></TableRow> : data.length === 0 ? <TableRow><TableCell colSpan={4} align="center">No achievements</TableCell></TableRow> : data.map((item: any, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.studentName}</TableCell>
                    <TableCell>{item.ecaName}</TableCell>
                    <TableCell>{item.achievement}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {tabValue === 0 && 'Enroll Student'}
          {tabValue === 1 && 'Mark Attendance'}
          {tabValue === 2 && 'Create Event'}
          {tabValue === 3 && 'Record Achievement'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {tabValue === 0 && (
              <>
                <Grid item xs={12}><TextField label="ECA ID" type="number" value={formData.ecaId} onChange={(e) => setFormData({ ...formData, ecaId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label="Student ID" type="number" value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label="Enrollment Date" type="date" value={formData.enrollmentDate} onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              </>
            )}
            {tabValue === 1 && (
              <>
                <Grid item xs={12}><TextField label="ECA ID" type="number" value={formData.ecaId} onChange={(e) => setFormData({ ...formData, ecaId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label="Date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              </>
            )}
            {tabValue === 2 && (
              <>
                <Grid item xs={12}><TextField label="ECA ID" type="number" value={formData.ecaId} onChange={(e) => setFormData({ ...formData, ecaId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label="Event Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label="Event Date" type="date" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={12}><TextField label="Venue" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label="Description" multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth /></Grid>
              </>
            )}
            {tabValue === 3 && (
              <>
                <Grid item xs={12}><TextField label="Student ID" type="number" value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label="ECA ID" type="number" value={formData.ecaId} onChange={(e) => setFormData({ ...formData, ecaId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label="Achievement" value={formData.achievement} onChange={(e) => setFormData({ ...formData, achievement: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label="Date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={12}><TextField label="Description" multiline rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth /></Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ECAManagement;
