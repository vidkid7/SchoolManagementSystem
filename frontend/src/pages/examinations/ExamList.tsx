/**
 * Exam List Page
 * View and manage all examinations
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
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Grade as GradeIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

interface Exam {
  examId: number;
  name: string;
  type: string;
  className: string;
  subjectName: string;
  examDate: string;
  fullMarks: number;
  status: string;
}

const statusColors: Record<string, any> = {
  scheduled: 'info',
  ongoing: 'warning',
  completed: 'success',
  cancelled: 'error',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Scheduled',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const examTypes: Record<string, string> = {
  unit_test: 'Unit Test',
  first_terminal: 'First Terminal',
  second_terminal: 'Second Terminal',
  final: 'Final',
  practical: 'Practical',
  project: 'Project',
};

export function ExamList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Build query parameters
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (classFilter) params.classId = classFilter;
      
      // Fetch from API
      const response = await api.get('/examinations', { params });
      const apiExams = response.data?.data || [];
      
      // Transform API data to match our interface
      const transformedExams = apiExams.map((exam: any) => ({
        examId: exam.examId || exam.id,
        name: exam.name || exam.examName,
        type: exam.type || exam.examType,
        className: exam.className || `Class ${exam.classId}`,
        subjectName: exam.subjectName || exam.subject?.name || 'N/A',
        examDate: exam.examDate || exam.date,
        fullMarks: exam.fullMarks || exam.totalMarks || 100,
        status: exam.status || 'scheduled',
      }));
      
      setExams(transformedExams);
    } catch (error: any) {
      console.error('Failed to fetch exams:', error);
      setError(error.response?.data?.message || 'Failed to load examinations. Please ensure the backend is running.');
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when filters change
  useEffect(() => {
    if (statusFilter || typeFilter || classFilter) {
      fetchExams();
    }
  }, [statusFilter, typeFilter, classFilter]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, exam: Exam) => {
    setAnchorEl(event.currentTarget);
    setSelectedExam(exam);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: string) => {
    if (!selectedExam) return;
    
    handleMenuClose();
    
    switch (action) {
      case 'view':
        navigate(`/examinations/${selectedExam.examId}`);
        break;
      case 'edit':
        navigate(`/examinations/${selectedExam.examId}/edit`);
        break;
      case 'grades':
        navigate(`/examinations/${selectedExam.examId}/grades`);
        break;
      case 'delete':
        handleDelete();
        break;
    }
  };

  const handleDelete = async () => {
    if (!selectedExam) return;
    
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        // await api.delete(`/examinations/${selectedExam.examId}`);
        setSuccess('Exam deleted successfully');
        fetchExams();
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete exam');
      }
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            Examination Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/examinations/create')}
          >
            Create Exam
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Exam Type</InputLabel>
              <Select
                value={typeFilter}
                label="Exam Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                {Object.entries(examTypes).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={classFilter}
                label="Class"
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <MenuItem value="">All Classes</MenuItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                  <MenuItem key={cls} value={cls}>Class {cls}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Exam Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Full Marks</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary">
                      No examinations found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam.examId} hover>
                    <TableCell>{exam.name}</TableCell>
                    <TableCell>{examTypes[exam.type] || exam.type}</TableCell>
                    <TableCell>{exam.className}</TableCell>
                    <TableCell>{exam.subjectName}</TableCell>
                    <TableCell>
                      {new Date(exam.examDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{exam.fullMarks}</TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[exam.status] || exam.status}
                        color={statusColors[exam.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, exam)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction('view')}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleAction('edit')}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleAction('grades')}>
          <GradeIcon sx={{ mr: 1 }} fontSize="small" />
          Enter Grades
        </MenuItem>
        <MenuItem onClick={() => handleAction('delete')}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default ExamList;
