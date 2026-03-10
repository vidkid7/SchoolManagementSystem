/**
 * Sports Management - Comprehensive sports, teams, tournaments, achievements
 */

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip, Alert, Grid, IconButton } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, EmojiEvents as TrophyIcon, Groups as TeamIcon, PersonAdd as EnrollIcon, HowToReg as AttendanceIcon, History as HistoryIcon } from '@mui/icons-material';
import api from '../../config/api';

function TabPanel({ children, value, index }: any) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>;
}

export function SportsManagement() {
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<any>({});

  // Enroll dialog
  const [enrollDialog, setEnrollDialog] = useState(false);
  const [enrollSportId, setEnrollSportId] = useState<number | null>(null);
  const [enrollForm, setEnrollForm] = useState({ studentId: '', teamId: '' });

  // Enrollments & Attendance tab
  const [sportsList, setSportsList] = useState<any[]>([]);
  const [selectedSportId, setSelectedSportId] = useState('');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [attendancePresence, setAttendancePresence] = useState<Record<number, boolean>>({});
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  // Student history tab
  const [historyStudentId, setHistoryStudentId] = useState('');
  const [studentHistory, setStudentHistory] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (tabValue < 4) fetchData();
    if (tabValue === 4 && !sportsList.length) {
      api.get('/sports/list', { params: { limit: 500 } }).then((r) => setSportsList(r.data?.data || [])).catch(() => {});
    }
  }, [tabValue, page, rowsPerPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoints = ['/sports/list', '/sports/teams', '/sports/tournaments', '/sports/achievements'];
      const response = await api.get(endpoints[tabValue], { params: { page: page + 1, limit: rowsPerPage } });
      setData(response.data?.data || []);
      setTotal(response.data?.meta?.total || 0);
    } catch (err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    if (!selectedSportId) return;
    setEnrollmentsLoading(true);
    try {
      const res = await api.get(`/sports/${selectedSportId}/enrollments`, { params: { status: 'active' } });
      const list = res.data?.data || [];
      setEnrollments(list);
      const next: Record<number, boolean> = {};
      list.forEach((e: any) => { next[e.enrollmentId ?? e.id] = true; });
      setAttendancePresence(next);
    } catch {
      setEnrollments([]);
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedSportId) return;
    const attendanceData = enrollments.map((e: any) => ({
      enrollmentId: e.enrollmentId ?? e.id,
      present: attendancePresence[e.enrollmentId ?? e.id] ?? false,
    }));
    try {
      await api.post(`/sports/${selectedSportId}/mark-attendance`, { attendanceData });
      setSuccess('Attendance marked');
      fetchEnrollments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const fetchStudentHistory = async () => {
    if (!historyStudentId) return;
    setHistoryLoading(true);
    try {
      const res = await api.get(`/sports/student/${historyStudentId}`);
      setStudentHistory(res.data?.data ?? null);
    } catch {
      setStudentHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (enrollSportId == null || !enrollForm.studentId) return;
    try {
      await api.post(`/sports/${enrollSportId}/enroll`, {
        studentId: parseInt(enrollForm.studentId, 10),
        teamId: enrollForm.teamId ? parseInt(enrollForm.teamId, 10) : undefined,
      });
      setSuccess('Student enrolled');
      setEnrollDialog(false);
      setEnrollSportId(null);
      setEnrollForm({ studentId: '', teamId: '' });
      if (selectedSportId && String(enrollSportId) === selectedSportId) fetchEnrollments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Enroll failed');
    }
  };

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      if (tabValue === 0) setFormData({ name: '', category: '', coach: '', status: 'active' });
      else if (tabValue === 1) setFormData({ name: '', sportId: '', coach: '', captain: '' });
      else if (tabValue === 2) setFormData({ name: '', sportId: '', startDate: '', endDate: '', venue: '' });
      else setFormData({ studentId: '', sportId: '', achievement: '', date: new Date().toISOString().split('T')[0] });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      const endpoints = ['/sports', '/sports/teams', '/sports/tournaments', '/sports/achievements'];
      const id = editingItem?.sportId ?? editingItem?.id;
      if (editingItem) {
        await api.put(`${endpoints[tabValue]}/${id}`, formData);
        setSuccess('Updated successfully');
      } else {
        await api.post(endpoints[tabValue], formData);
        setSuccess('Created successfully');
      }
      setOpenDialog(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (item: any) => {
    const id = item?.sportId ?? item?.id;
    if (!id || !confirm('Are you sure?')) return;
    try {
      const endpoints = ['/sports', '/sports/teams', '/sports/tournaments', '/sports/achievements'];
      await api.delete(`${endpoints[tabValue]}/${id}`);
      setSuccess('Deleted successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>Sports Management</Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Sports" />
          <Tab label="Teams" />
          <Tab label="Tournaments" />
          <Tab label="Achievements" />
          <Tab label="Enrollments & Attendance" />
          <Tab label="Student History" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Create Sport</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sport Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Coach</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Enroll</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow> : data.length === 0 ? <TableRow><TableCell colSpan={6} align="center">No sports found</TableCell></TableRow> : data.map((item: any) => (
                  <TableRow key={item.sportId ?? item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell><Chip label={item.category} size="small" /></TableCell>
                    <TableCell>{item.coach}</TableCell>
                    <TableCell><Chip label={item.status} color={item.status === 'active' ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell align="center">
                      <Button size="small" startIcon={<EnrollIcon />} onClick={() => { setEnrollSportId(item.sportId ?? item.id); setEnrollDialog(true); }}>Enroll</Button>
                      <IconButton size="small" onClick={() => handleOpenDialog(item)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(item)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<TeamIcon />} onClick={() => handleOpenDialog()}>Create Team</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Team Name</TableCell>
                  <TableCell>Sport</TableCell>
                  <TableCell>Coach</TableCell>
                  <TableCell>Captain</TableCell>
                  <TableCell align="center">Players</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow> : data.length === 0 ? <TableRow><TableCell colSpan={6} align="center">No teams found</TableCell></TableRow> : data.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.sportName}</TableCell>
                    <TableCell>{item.coach}</TableCell>
                    <TableCell>{item.captain}</TableCell>
                    <TableCell align="center">{item.playerCount || 0}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleOpenDialog(item)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(item.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<TrophyIcon />} onClick={() => handleOpenDialog()}>Create Tournament</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tournament Name</TableCell>
                  <TableCell>Sport</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Venue</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} align="center">Loading...</TableCell></TableRow> : data.length === 0 ? <TableRow><TableCell colSpan={7} align="center">No tournaments found</TableCell></TableRow> : data.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.sportName}</TableCell>
                    <TableCell>{new Date(item.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(item.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{item.venue}</TableCell>
                    <TableCell><Chip label={item.status} size="small" /></TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleOpenDialog(item)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(item.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<TrophyIcon />} onClick={() => handleOpenDialog()}>Record Achievement</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Sport</TableCell>
                  <TableCell>Achievement</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={4} align="center">Loading...</TableCell></TableRow> : data.length === 0 ? <TableRow><TableCell colSpan={4} align="center">No achievements found</TableCell></TableRow> : data.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.studentName}</TableCell>
                    <TableCell>{item.sportName}</TableCell>
                    <TableCell>{item.achievement}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
            <TextField
              select
              size="small"
              label="Sport"
              value={selectedSportId}
              onChange={(e) => setSelectedSportId(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Select sport</MenuItem>
              {(sportsList.length ? sportsList : data).map((s: any) => (
                <MenuItem key={s.sportId ?? s.id} value={String(s.sportId ?? s.id)}>{s.name}</MenuItem>
              ))}
            </TextField>
            <Button variant="contained" startIcon={<AttendanceIcon />} onClick={fetchEnrollments} disabled={!selectedSportId || enrollmentsLoading}>Load Enrollments</Button>
            {enrollments.length > 0 && (
              <Button variant="outlined" onClick={handleMarkAttendance}>Mark Attendance</Button>
            )}
          </Box>
          {enrollmentsLoading ? <Typography>Loading...</Typography> : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Enrollment ID</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Attendance</TableCell>
                    <TableCell>Present today</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {enrollments.length === 0 ? (
                    <TableRow><TableCell colSpan={4} align="center">Select a sport and click Load Enrollments</TableCell></TableRow>
                  ) : (
                    enrollments.map((e: any) => (
                      <TableRow key={e.enrollmentId ?? e.id}>
                        <TableCell>{e.enrollmentId ?? e.id}</TableCell>
                        <TableCell>{e.studentId}</TableCell>
                        <TableCell>{e.attendanceCount ?? 0} / {e.totalSessions ?? 0}</TableCell>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={attendancePresence[e.enrollmentId ?? e.id] ?? false}
                            onChange={(ev) => setAttendancePresence((prev) => ({ ...prev, [e.enrollmentId ?? e.id]: ev.target.checked }))}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField size="small" label="Student ID" value={historyStudentId} onChange={(e) => setHistoryStudentId(e.target.value)} placeholder="Student ID" sx={{ width: 140 }} />
            <Button variant="contained" startIcon={<HistoryIcon />} onClick={fetchStudentHistory} disabled={!historyStudentId || historyLoading}>Load History</Button>
          </Box>
          {historyLoading && <Typography>Loading...</Typography>}
          {studentHistory && !historyLoading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {studentHistory.enrollments?.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>Enrollments</Typography>
                  <TableContainer><Table size="small">
                    <TableHead><TableRow><TableCell>Sport</TableCell><TableCell>Status</TableCell><TableCell>Attendance</TableCell></TableRow></TableHead>
                    <TableBody>
                      {studentHistory.enrollments.map((e: any) => (
                        <TableRow key={e.enrollmentId ?? e.id}>
                          <TableCell>{e.Sport?.name ?? e.sportId}</TableCell>
                          <TableCell><Chip label={e.status} size="small" /></TableCell>
                          <TableCell>{e.attendanceCount ?? 0} / {e.totalSessions ?? 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></TableContainer>
                </Box>
              )}
              {studentHistory.achievements?.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>Achievements</Typography>
                  <TableContainer><Table size="small">
                    <TableHead><TableRow><TableCell>Achievement</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
                    <TableBody>
                      {studentHistory.achievements.map((a: any, i: number) => (
                        <TableRow key={i}><TableCell>{a.achievement ?? a.description}</TableCell><TableCell>{a.date ? new Date(a.date).toLocaleDateString() : '-'}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table></TableContainer>
                </Box>
              )}
              {studentHistory && !studentHistory.enrollments?.length && !studentHistory.achievements?.length && <Typography color="text.secondary">No enrollments or achievements found.</Typography>}
            </Box>
          )}
        </TabPanel>

        <TablePagination component="div" count={total} page={page} onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingItem ? 'Edit' : 'Create'} {['Sport', 'Team', 'Tournament', 'Achievement'][tabValue]}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {tabValue === 0 && (
              <>
                <Grid item xs={12}><TextField label="Sport Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}>
                  <TextField select label="Category" value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} fullWidth>
                    <MenuItem value="Indoor">Indoor</MenuItem>
                    <MenuItem value="Outdoor">Outdoor</MenuItem>
                    <MenuItem value="Team">Team</MenuItem>
                    <MenuItem value="Individual">Individual</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}><TextField label="Coach" value={formData.coach || ''} onChange={(e) => setFormData({ ...formData, coach: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}>
                  <TextField select label="Status" value={formData.status || 'active'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} fullWidth>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </TextField>
                </Grid>
              </>
            )}
            {tabValue === 1 && (
              <>
                <Grid item xs={12}><TextField label="Team Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label="Sport ID" type="number" value={formData.sportId || ''} onChange={(e) => setFormData({ ...formData, sportId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label="Coach" value={formData.coach || ''} onChange={(e) => setFormData({ ...formData, coach: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label="Captain" value={formData.captain || ''} onChange={(e) => setFormData({ ...formData, captain: e.target.value })} fullWidth /></Grid>
              </>
            )}
            {tabValue === 2 && (
              <>
                <Grid item xs={12}><TextField label="Tournament Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label="Sport ID" type="number" value={formData.sportId || ''} onChange={(e) => setFormData({ ...formData, sportId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label="Venue" value={formData.venue || ''} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label="Start Date" type="date" value={formData.startDate || ''} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={12} md={6}><TextField label="End Date" type="date" value={formData.endDate || ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              </>
            )}
            {tabValue === 3 && (
              <>
                <Grid item xs={12} md={6}><TextField label="Student ID" type="number" value={formData.studentId || ''} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label="Sport ID" type="number" value={formData.sportId || ''} onChange={(e) => setFormData({ ...formData, sportId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label="Achievement" value={formData.achievement || ''} onChange={(e) => setFormData({ ...formData, achievement: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label="Date" type="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={enrollDialog} onClose={() => { setEnrollDialog(false); setEnrollSportId(null); setEnrollForm({ studentId: '', teamId: '' }); }} maxWidth="xs" fullWidth>
        <DialogTitle>Enroll Student</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField label="Student ID" type="number" value={enrollForm.studentId} onChange={(e) => setEnrollForm({ ...enrollForm, studentId: e.target.value })} fullWidth required />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Team ID (optional)" type="number" value={enrollForm.teamId} onChange={(e) => setEnrollForm({ ...enrollForm, teamId: e.target.value })} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollDialog(false)}>Cancel</Button>
          <Button onClick={handleEnroll} variant="contained" disabled={!enrollForm.studentId}>Enroll</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SportsManagement;
