/**
 * Student Detail Page
 * 
 * Displays comprehensive student information with tabs
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Tabs,
  Tab,
  Button,
  Chip,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  EventAvailable as AttendanceIcon,
  Payment as PaymentIcon,
  EmojiEvents as CertificateIcon,
  Sports as SportsIcon,
  Star as GoodIcon,
  Warning as BadIcon,
  TrendingUp as GradeIcon,
  Description as DocumentIcon,
  SwapHoriz as TransferIcon,
  MenuBook as LibraryIcon,
  EmojiEvents,
  CalendarMonth as CalendarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Badge as BadgeIcon,
  SupervisedUserCircle as GuardianIcon,
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';
import { motion } from 'framer-motion';
import { useNepaliNumbers } from '../../hooks/useNepaliNumbers';
import StudentDocuments from './StudentDocuments';
import StudentLibrary from './StudentLibrary';
import { PromoteDialog, TransferDialog } from './PromoteTransferDialogs';

const MotionCard = motion.create(Card);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface AttendanceRecord {
  id: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  period?: number;
}

interface GradeRecord {
  id: number;
  examName: string;
  subjectName: string;
  fullMarks: number;
  obtainedMarks: number;
  grade?: string;
}

interface FeeRecord {
  id: number;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
}

interface ECARecord {
  id: number;
  activityName: string;
  position?: string;
  achievement?: string;
}

interface CertificateRecord {
  id: number;
  certificateNumber: string;
  type: string;
  issuedDate: string;
  status: 'active' | 'revoked';
}

interface RemarkRecord {
  id: number;
  type: 'good' | 'bad';
  remark: string;
  teacherName: string;
  date: string;
  subject: string;
}

const InfoCard = ({ icon, title, children, color = 'primary' }: { icon: React.ReactNode; title: string; children: React.ReactNode; color?: string }) => {
  const theme = useTheme();
  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      sx={{ 
        borderRadius: 3, 
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        transition: 'all 0.3s ease',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 40, 
            height: 40, 
            borderRadius: 2.5,
            bgcolor: alpha((theme.palette as any)[color]?.main || theme.palette.primary.main, 0.1),
          }}>
            {icon}
          </Box>
          {title}
        </Typography>
        {children}
      </CardContent>
    </MotionCard>
  );
};

const StatCard = ({ value, label, color }: { value: string | number; label: string; color: string }) => {
  const theme = useTheme();
  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      sx={{ 
        borderRadius: 3, 
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: color,
        }
      }}
    >
      <CardContent sx={{ py: 2.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: color, mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
      </CardContent>
    </MotionCard>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | undefined }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
      <Box sx={{ color: 'text.secondary', minWidth: 24 }}>
        {icon}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
        {label}:
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
        {value || '-'}
      </Typography>
    </Box>
  );
};

export const StudentDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { formatNumber } = useNepaliNumbers();
  const [tabValue, setTabValue] = useState(0);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [attendance, setAttendance] = useState<{ records: AttendanceRecord[]; summary: any } | null>(null);
  const [grades, setGrades] = useState<{ grades: GradeRecord[]; summary: any } | null>(null);
  const [fees, setFees] = useState<{ invoices: FeeRecord[]; summary: any } | null>(null);
  const [eca, setEca] = useState<{ eca: ECARecord[]; sports: ECARecord[]; summary: any } | null>(null);
  const [certificates, setCertificates] = useState<{ certificates: CertificateRecord[]; summary: any } | null>(null);
  const [remarks, setRemarks] = useState<{ remarks: RemarkRecord[]; summary: any } | null>(null);
  
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchStudent = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get(`/api/v1/students/${id}`);
      const studentData = response.data.data;
      
      setStudent({
        ...studentData,
        section: studentData.class?.section || '-'
      });
    } catch (err: any) {
      console.error('Failed to fetch student:', err);
      setError(err.response?.data?.message || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await apiClient.get(`/api/v1/students/${id}/attendance`);
      setAttendance(response.data.data);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await apiClient.get(`/api/v1/students/${id}/grades`);
      setGrades(response.data.data);
    } catch (err) {
      console.error('Failed to fetch grades:', err);
    }
  };

  const fetchFees = async () => {
    try {
      const response = await apiClient.get(`/api/v1/students/${id}/fees`);
      setFees(response.data.data);
    } catch (err) {
      console.error('Failed to fetch fees:', err);
    }
  };

  const fetchECA = async () => {
    try {
      const response = await apiClient.get(`/api/v1/students/${id}/eca`);
      setEca(response.data.data);
    } catch (err) {
      console.error('Failed to fetch ECA:', err);
    }
  };

  const fetchCertificates = async () => {
    try {
      const response = await apiClient.get(`/api/v1/students/${id}/certificates`);
      setCertificates(response.data.data);
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
    }
  };

  const fetchRemarks = async () => {
    try {
      const response = await apiClient.get(`/api/v1/students/${id}/remarks`);
      setRemarks(response.data.data);
    } catch (err) {
      console.error('Failed to fetch remarks:', err);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  useEffect(() => {
    if (!loading && student) {
      fetchAttendance();
      fetchGrades();
      fetchFees();
      fetchECA();
      fetchCertificates();
      fetchRemarks();
    }
  }, [loading, student]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePromoteSuccess = () => {
    setSuccessMessage(t('promote.promoteSuccess'));
    fetchStudent();
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleTransferSuccess = () => {
    setSuccessMessage(t('promote.transferSuccess'));
    fetchStudent();
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      default: return 'default';
    }
  };

  const getFeeStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ mt: 2, mb: 4, p: 3 }}>
        <LinearProgress sx={{ borderRadius: 1 }} />
        <Typography sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
          {t('common.loading')}
        </Typography>
      </Box>
    );
  }

  if (error || !student) {
    return (
      <Box sx={{ mt: 2, mb: 4, p: 3 }}>
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="error" gutterBottom>
            {error || t('messages.noData')}
          </Typography>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/students')}>
            {t('common.back')}
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }} key={i18n.language}>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Header */}
      <MotionCard 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        elevation={0}
        sx={{ 
          mb: 4,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
        }}
      >
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                src={student.photoUrl}
                sx={{ 
                  width: 110, 
                  height: 110, 
                  border: '4px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              >
                <PersonIcon sx={{ fontSize: 52 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {student.firstNameEn} {student.middleNameEn} {student.lastNameEn}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 1.5 }}>
                  {t('students.studentId')}: <strong>{student.studentCode}</strong>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`${t('students.class')} ${formatNumber(student.currentClassId)}`}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontWeight: 600,
                      borderRadius: 2,
                    }} 
                  />
                  <Chip 
                    label={`${t('students.section')} ${student.section}`}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontWeight: 600,
                      borderRadius: 2,
                    }} 
                  />
                  <Chip 
                    label={student.status ? t(`students.${student.status}`) : '-'}
                    color={student.status === 'active' ? 'success' : 'default'}
                    sx={{ fontWeight: 600, borderRadius: 2 }}
                  />
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={() => navigate('/students')}
                sx={{ 
                  borderRadius: 2.5,
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': { 
                    borderColor: 'rgba(255,255,255,0.5)', 
                    bgcolor: 'rgba(255,255,255,0.1)' 
                  }
                }}
              >
                {t('common.back')}
              </Button>
              {student.status === 'active' && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<TransferIcon />}
                    onClick={() => setTransferDialogOpen(true)}
                    sx={{ 
                      borderRadius: 2.5,
                      borderColor: 'rgba(255,255,255,0.3)',
                      color: 'white',
                      '&:hover': { 
                        borderColor: 'rgba(255,255,255,0.5)', 
                        bgcolor: 'rgba(255,255,255,0.1)' 
                      }
                    }}
                  >
                    {t('promote.transfer')}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<GradeIcon />}
                    onClick={() => setPromoteDialogOpen(true)}
                    sx={{ 
                      borderRadius: 2.5,
                      borderColor: 'rgba(255,255,255,0.3)',
                      color: 'white',
                      '&:hover': { 
                        borderColor: 'rgba(255,255,255,0.5)', 
                        bgcolor: 'rgba(255,255,255,0.1)' 
                      }
                    }}
                  >
                    {t('promote.promote')}
                  </Button>
                </>
              )}
              <Button
                variant="outlined"
                startIcon={<DocumentIcon />}
                onClick={() => navigate(`/students/${id}/cv`)}
                sx={{ 
                  borderRadius: 2.5,
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': { 
                    borderColor: 'rgba(255,255,255,0.5)', 
                    bgcolor: 'rgba(255,255,255,0.1)' 
                  }
                }}
              >
                {t('common.viewCV')}
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/students/${id}/edit`)}
                sx={{ 
                  borderRadius: 2.5,
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  fontWeight: 700,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.95)',
                  }
                }}
              >
                {t('common.edit')}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </MotionCard>

      {/* Tabs */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ borderRadius: 4, overflow: 'hidden', border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}
      >
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
              minHeight: 56,
              fontSize: '0.85rem',
              borderRadius: '12px 12px 0 0',
              mx: 0.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
              '&.Mui-selected': {
                bgcolor: 'background.paper',
                boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
              }
            }
          }}
        >
          <Tab icon={<PersonIcon />} iconPosition="start" label={t('students.personalInfo')} />
          <Tab icon={<SchoolIcon />} iconPosition="start" label={t('students.academicInfo')} />
          <Tab icon={<AttendanceIcon />} iconPosition="start" label={t('attendance.title')} />
          <Tab icon={<GradeIcon />} iconPosition="start" label={t('examinations.title')} />
          <Tab icon={<PaymentIcon />} iconPosition="start" label={t('finance.title')} />
          <Tab icon={<SportsIcon />} iconPosition="start" label={t('sportsECA.title')} />
          <Tab icon={<CertificateIcon />} iconPosition="start" label={t('certificates.title')} />
          <Tab icon={<GoodIcon />} iconPosition="start" label={t('students.remarks')} />
          <Tab icon={<LibraryIcon />} iconPosition="start" label={t('library.title')} />
          <Tab icon={<DocumentIcon />} iconPosition="start" label={t('documents.documents')} />
        </Tabs>

        {/* Personal Info Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <InfoCard icon={<PersonIcon sx={{ color: theme.palette.primary.main }} />} title={t('students.personalInfo')}>
                <InfoRow icon={<CalendarIcon fontSize="small" />} label={t('students.dateOfBirth')} value={student.dateOfBirthBS} />
                <InfoRow icon={<PersonIcon fontSize="small" />} label={t('students.gender')} value={student.gender && ['male', 'female', 'other'].includes(student.gender) ? t(`students.${student.gender}`) : (student.gender || '-')} />
                <InfoRow icon={<BadgeIcon fontSize="small" />} label={t('students.bloodGroup')} value={student.bloodGroup} />
              </InfoCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <InfoCard icon={<PhoneIcon sx={{ color: theme.palette.primary.main }} />} title={t('students.contactInfo')}>
                <InfoRow icon={<PhoneIcon fontSize="small" />} label={t('students.contactNumber')} value={student.phone} />
                <InfoRow icon={<EmailIcon fontSize="small" />} label={t('students.email')} value={student.email} />
                <InfoRow icon={<LocationIcon fontSize="small" />} label={t('students.address')} value={student.addressEn} />
              </InfoCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <InfoCard icon={<GuardianIcon sx={{ color: theme.palette.secondary.main }} />} title={t('students.guardianInfo')}>
                <InfoRow icon={<PersonIcon fontSize="small" />} label={t('students.fatherName')} value={student.fatherName} />
                <InfoRow icon={<PhoneIcon fontSize="small" />} label={t('students.fatherPhone')} value={student.fatherPhone} />
                <InfoRow icon={<PersonIcon fontSize="small" />} label={t('students.motherName')} value={student.motherName} />
              </InfoCard>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Academic Info Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <InfoCard icon={<SchoolIcon sx={{ color: theme.palette.primary.main }} />} title={t('students.academicInfo')}>
                <InfoRow icon={<SchoolIcon fontSize="small" />} label={t('students.class')} value={formatNumber(student.currentClassId)} />
                <InfoRow icon={<BadgeIcon fontSize="small" />} label={t('students.section')} value={student.section} />
                <InfoRow icon={<BadgeIcon fontSize="small" />} label={t('students.rollNumber')} value={student.rollNumber} />
                <InfoRow icon={<CalendarIcon fontSize="small" />} label={t('students.admissionDate')} value={student.admissionDate} />
              </InfoCard>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Attendance Tab */}
        <TabPanel value={tabValue} index={2}>
          {attendance ? (
            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <StatCard value={`${attendance.summary?.percentage || 0}%`} label={t('attendance.present')} color={theme.palette.success.main} />
              </Grid>
              <Grid item xs={6} md={3}>
                <StatCard value={formatNumber(attendance.summary?.present || 0)} label={t('attendance.present')} color="#10b981" />
              </Grid>
              <Grid item xs={6} md={3}>
                <StatCard value={formatNumber(attendance.summary?.absent || 0)} label={t('attendance.absent')} color={theme.palette.error.main} />
              </Grid>
              <Grid item xs={6} md={3}>
                <StatCard value={formatNumber(attendance.summary?.late || 0)} label={t('attendance.late')} color={theme.palette.warning.main} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  {t('attendance.title')}
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                  <Table>
                    <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>{t('attendance.date')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('attendance.status')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendance.records?.slice(0, 10).map((record) => (
                        <TableRow key={record.id} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{record.date}</TableCell>
                          <TableCell>
                            <Chip 
                              label={t(`attendance.${record.status}`)}
                              color={getStatusColor(record.status)}
                              size="small"
                              sx={{ fontWeight: 600, borderRadius: 2 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">{t('messages.noData')}</Typography>
          )}
        </TabPanel>

        {/* Grades Tab */}
        <TabPanel value={tabValue} index={3}>
          {grades ? (
            <Grid container spacing={3}>
              <Grid item xs={6} md={4}>
                <StatCard value={formatNumber(grades.summary?.totalExams || 0)} label={t('examinations.title')} color={theme.palette.primary.main} />
              </Grid>
              <Grid item xs={6} md={4}>
                <StatCard value={grades.summary?.averageMarks || 0} label={t('reports.averageMarks')} color="#10b981" />
              </Grid>
              <Grid item xs={6} md={4}>
                <StatCard value={formatNumber(grades.summary?.totalMarks || 0)} label={t('reports.totalCollected')} color={theme.palette.info.main} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  {t('examinations.gradeEntry')}
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                  <Table>
                    <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>{t('examinations.examName')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('examinations.subject')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('examinations.fullMarks')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('examinations.obtainedMarks')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('examinations.grade')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {grades.grades?.slice(0, 10).map((grade) => (
                        <TableRow key={grade.id} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{grade.examName}</TableCell>
                          <TableCell>{grade.subjectName}</TableCell>
                          <TableCell>{grade.fullMarks}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{grade.obtainedMarks}</TableCell>
                          <TableCell>
                            <Chip label={grade.grade || '-'} size="small" sx={{ fontWeight: 600, borderRadius: 2 }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">{t('messages.noData')}</Typography>
          )}
        </TabPanel>

        {/* Fees Tab */}
        <TabPanel value={tabValue} index={4}>
          {fees ? (
            <Grid container spacing={3}>
              <Grid item xs={6} md={4}>
                <StatCard value={`रू ${formatNumber(fees.summary?.totalAmount || 0)}`} label={t('finance.totalExpected')} color={theme.palette.primary.main} />
              </Grid>
              <Grid item xs={6} md={4}>
                <StatCard value={`रू ${formatNumber(fees.summary?.paidAmount || 0)}`} label={t('finance.paid')} color="#10b981" />
              </Grid>
              <Grid item xs={6} md={4}>
                <StatCard value={`रू ${formatNumber(fees.summary?.pendingAmount || 0)}`} label={t('finance.unpaid')} color={theme.palette.error.main} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  {t('finance.invoices')}
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                  <Table>
                    <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>{t('finance.invoices')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('finance.amount')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('finance.dueDate')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('students.status')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fees.invoices?.slice(0, 10).map((invoice) => (
                        <TableRow key={invoice.id} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{invoice.invoiceNumber}</TableCell>
                          <TableCell>रू {invoice.amount}</TableCell>
                          <TableCell>{invoice.dueDate}</TableCell>
                          <TableCell>
                            <Chip 
                              label={t(`finance.${invoice.status}`)}
                              color={getFeeStatusColor(invoice.status)}
                              size="small"
                              sx={{ fontWeight: 600, borderRadius: 2 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">{t('messages.noData')}</Typography>
          )}
        </TabPanel>

        {/* ECA/Sports Tab */}
        <TabPanel value={tabValue} index={5}>
          {eca ? (
            <Grid container spacing={3}>
              {(eca.eca?.some(a => a.achievement) || eca.sports?.some(s => s.achievement)) && (
                <Grid item xs={12}>
                  <Card sx={{ 
                    borderRadius: 3, 
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                    border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                        <EmojiEvents sx={{ color: theme.palette.success.main, fontSize: 28 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                          {t('students.achievements')}
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        {eca.eca?.filter(a => a.achievement).map((activity) => (
                          <Grid item xs={12} md={6} key={activity.id}>
                            <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'white', borderRadius: 2, border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <EmojiEvents sx={{ color: theme.palette.success.main, mt: 0.5 }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                                    {t('students.ecaAchievement')}
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                                    {activity.activityName}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {activity.achievement}
                                  </Typography>
                                  {activity.position && (
                                    <Chip label={activity.position} size="small" sx={{ mt: 1, fontWeight: 600 }} color="success" variant="outlined" />
                                  )}
                                </Box>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                        {eca.sports?.filter(s => s.achievement).map((sport) => (
                          <Grid item xs={12} md={6} key={sport.id}>
                            <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'white', borderRadius: 2, border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <EmojiEvents sx={{ color: theme.palette.warning.main, mt: 0.5 }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.warning.main }}>
                                    {t('students.sportsAchievement')}
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                                    {sport.activityName}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {sport.achievement}
                                  </Typography>
                                  {sport.position && (
                                    <Chip label={sport.position} size="small" sx={{ mt: 1, fontWeight: 600 }} color="warning" variant="outlined" />
                                  )}
                                </Box>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <InfoCard icon={<SportsIcon sx={{ color: '#f59e0b' }} />} title={t('reports.ecaActivities')}>
                  {eca.eca?.length > 0 ? (
                    <List dense>
                      {eca.eca.map((activity) => (
                        <ListItem key={activity.id} sx={{ px: 0 }}>
                          <ListItemIcon><SportsIcon sx={{ color: '#f59e0b' }} /></ListItemIcon>
                          <ListItemText primary={activity.activityName} secondary={activity.achievement || activity.position} primaryTypographyProps={{ fontWeight: 600 }} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">{t('messages.noData')}</Typography>
                  )}
                </InfoCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoCard icon={<SportsIcon sx={{ color: '#3b82f6' }} />} title={t('sportsECA.sports')}>
                  {eca.sports?.length > 0 ? (
                    <List dense>
                      {eca.sports.map((sport) => (
                        <ListItem key={sport.id} sx={{ px: 0 }}>
                          <ListItemIcon><SportsIcon sx={{ color: '#3b82f6' }} /></ListItemIcon>
                          <ListItemText primary={sport.activityName} secondary={sport.achievement || sport.position} primaryTypographyProps={{ fontWeight: 600 }} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">{t('messages.noData')}</Typography>
                  )}
                </InfoCard>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">{t('messages.noData')}</Typography>
          )}
        </TabPanel>

        {/* Certificates Tab */}
        <TabPanel value={tabValue} index={6}>
          {certificates ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  {t('certificates.title')}
                </Typography>
                {certificates.certificates?.length > 0 ? (
                  <TableContainer component={Paper} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <Table>
                      <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>{t('certificates.certificateNumber')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{t('certificates.certificateType')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{t('certificates.issuedDate')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{t('students.status')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {certificates.certificates.map((cert) => (
                          <TableRow key={cert.id} hover>
                            <TableCell sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{cert.certificateNumber}</TableCell>
                            <TableCell>{cert.type}</TableCell>
                            <TableCell>{cert.issuedDate}</TableCell>
                            <TableCell>
                              <Chip 
                                label={t(`certificates.${cert.status}`)}
                                color={cert.status === 'active' ? 'success' : 'error'}
                                size="small"
                                sx={{ fontWeight: 600, borderRadius: 2 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">{t('messages.noData')}</Typography>
                )}
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">{t('messages.noData')}</Typography>
          )}
        </TabPanel>

        {/* Remarks Tab */}
        <TabPanel value={tabValue} index={7}>
          {remarks ? (
            <Grid container spacing={3}>
              <Grid item xs={6} md={6}>
                <StatCard value={formatNumber(remarks.summary?.goodRemarks || 0)} label={t('students.goodRemarks')} color="#10b981" />
              </Grid>
              <Grid item xs={6} md={6}>
                <StatCard value={formatNumber(remarks.summary?.badRemarks || 0)} label={t('students.needsImprovement')} color={theme.palette.error.main} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  {t('students.remarks')}
                </Typography>
                <Box>
                  {remarks.remarks?.map((remark) => (
                    <Paper key={remark.id} variant="outlined" sx={{ mb: 2, p: 2.5, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        {remark.type === 'good' ? (
                          <GoodIcon sx={{ color: '#10b981', mt: 0.5 }} />
                        ) : (
                          <BadIcon sx={{ color: theme.palette.error.main, mt: 0.5 }} />
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {remark.remark}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {remark.subject} - {remark.teacherName} | {remark.date}
                          </Typography>
                        </Box>
                        <Chip 
                          label={remark.type === 'good' ? t('students.goodRemarks') : t('students.needsImprovement')}
                          color={remark.type === 'good' ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 600, borderRadius: 2 }}
                        />
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">{t('messages.noData')}</Typography>
          )}
        </TabPanel>

        {/* Library Tab */}
        <TabPanel value={tabValue} index={8}>
          <StudentLibrary studentId={Number(id)} />
        </TabPanel>

        {/* Documents Tab */}
        <TabPanel value={tabValue} index={9}>
          <StudentDocuments studentId={Number(id)} />
        </TabPanel>
      </MotionCard>

      {/* Promote Dialog */}
      <PromoteDialog
        open={promoteDialogOpen}
        onClose={() => setPromoteDialogOpen(false)}
        studentId={Number(id)}
        currentClass={student.currentClassId}
        studentName={`${student.firstNameEn} ${student.lastNameEn}`}
        onSuccess={handlePromoteSuccess}
      />

      {/* Transfer Dialog */}
      <TransferDialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        studentId={Number(id)}
        currentClass={student.currentClassId}
        currentSection={student.section}
        studentName={`${student.firstNameEn} ${student.lastNameEn}`}
        onSuccess={handleTransferSuccess}
      />
    </Box>
  );
};
