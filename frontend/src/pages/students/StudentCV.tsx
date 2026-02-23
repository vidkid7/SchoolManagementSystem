/**
 * Student CV Page
 * 
 * Displays CV preview, supports customization options, and PDF download
 * Requirements: 26.3, 26.5
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  alpha,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Visibility as PreviewIcon,
  School as SchoolIcon,
  EventAvailable as AttendanceIcon,
  EmojiEvents as ECAIcon,
  SportsBasketball as SportsIcon,
  Description as CertificateIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../services/apiClient';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

interface PersonalInfo {
  studentId: number;
  studentCode: string;
  fullNameEn: string;
  fullNameNp?: string;
  dateOfBirthBS: string;
  dateOfBirthAD: Date;
  gender: string;
  bloodGroup?: string;
  addressEn: string;
  addressNp: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}

interface AcademicYearData {
  yearId: number;
  yearName: string;
  className: string;
  section?: string;
  gpa: number;
  subjects: SubjectGradeData[];
  rank: number;
  totalStudents: number;
}

interface SubjectGradeData {
  subjectId: number;
  subjectName: string;
  creditHours: number;
  theoryMarks: number;
  practicalMarks: number;
  totalMarks: number;
  fullMarks: number;
  grade: string;
  gradePoint: number;
}

interface AcademicPerformance {
  academicYears: AcademicYearData[];
  overallGPA: number;
  totalSubjects: number;
  averageGrade: string;
}

interface AttendanceData {
  overallPercentage: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  yearWise: YearAttendanceData[];
}

interface YearAttendanceData {
  yearId: number;
  yearName: string;
  percentage: number;
  totalDays: number;
  presentDays: number;
}

interface ECAParticipation {
  ecaName: string;
  category: string;
  duration: string;
  attendancePercentage: number;
  status: string;
}

interface ECAAchievement {
  title: string;
  ecaName: string;
  type: string;
  level: string;
  position?: string;
  date: Date;
}

interface ECACVData {
  participations: ECAParticipation[];
  achievements: ECAAchievement[];
  summary: {
    totalECAs: number;
    totalAchievements: number;
    highLevelAchievements: number;
    averageAttendance: number;
  };
}

interface SportsParticipation {
  sportName: string;
  category: string;
  duration: string;
  attendancePercentage: number;
  status: string;
}

interface SportsAchievement {
  title: string;
  sportName: string;
  type: string;
  level: string;
  position?: string;
  medal?: string;
  date: Date;
}

interface SportsCVData {
  participations: SportsParticipation[];
  achievements: SportsAchievement[];
  summary: {
    totalSports: number;
    totalAchievements: number;
    highLevelAchievements: number;
    medalCount: { gold: number; silver: number; bronze: number };
    recordsSet: number;
    averageAttendance: number;
  };
}

interface CertificateInfo {
  certificateNumber: string;
  type: string;
  name: string;
  issuedDate: Date;
  issuedDateBS: string;
}

interface CertificateData {
  certificates: CertificateInfo[];
  totalCount: number;
}

interface TeacherRemark {
  academicYear: string;
  term: string;
  remark: string;
  teacherName: string;
  date: Date;
}

interface TeacherRemarksData {
  remarks: TeacherRemark[];
}

interface CustomFields {
  skills: string[];
  hobbies: string[];
  careerGoals: string;
  personalStatement: string;
}

interface FullCVData {
  studentId: number;
  generatedAt: Date;
  verificationUrl: string;
  personalInfo?: PersonalInfo;
  academicPerformance?: AcademicPerformance;
  attendance?: AttendanceData;
  eca?: ECACVData;
  sports?: SportsCVData;
  certificates?: CertificateData;
  awards?: CertificateData;
  teacherRemarks?: TeacherRemarksData;
  customFields: CustomFields;
}

interface CVCustomization {
  studentId: number;
  showPersonalInfo: boolean;
  showAcademicPerformance: boolean;
  showAttendance: boolean;
  showECA: boolean;
  showSports: boolean;
  showCertificates: boolean;
  showAwards: boolean;
  showTeacherRemarks: boolean;
  skills: string[];
  hobbies: string[];
  careerGoals: string;
  personalStatement: string;
  templateId: string;
  schoolBrandingEnabled: boolean;
  lastGeneratedAt?: Date;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`cv-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const InfoSection = ({ icon, title, children, color = 'primary' }: { icon: React.ReactNode; title: string; children: React.ReactNode; color?: string }) => {
  const theme = useTheme();
  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      sx={{ 
        mb: 3, 
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

const StatBox = ({ value, label, color }: { value: string | number; label: string; color: string }) => {
  return (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: color, mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
  );
};

export const StudentCV = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  
  const [tabValue, setTabValue] = useState(0);
  const [cvData, setCvData] = useState<FullCVData | null>(null);
  const [customization, setCustomization] = useState<CVCustomization | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsRegeneration, setNeedsRegeneration] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [hobbyInput, setHobbyInput] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const CV_FEATURE_ENABLED = true;

  useEffect(() => {
    if (id && CV_FEATURE_ENABLED) {
      fetchCVData();
      fetchCustomization();
      checkNeedsRegeneration();
    } else if (id && !CV_FEATURE_ENABLED) {
      setLoading(false);
    }
  }, [id]);

  const fetchCVData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/v1/cv/${id}/data`);
      setCvData(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        console.warn('CV endpoints not yet implemented');
        setError('CV feature is not yet available');
      } else {
        setError(err.response?.data?.error?.message || 'Failed to load CV data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomization = async () => {
    try {
      const response = await apiClient.get(`/api/v1/cv/${id}`);
      setCustomization(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        console.warn('CV customization endpoint not yet implemented');
      } else {
        console.error('Failed to load customization:', err);
      }
    }
  };

  const checkNeedsRegeneration = async () => {
    try {
      const response = await apiClient.get(`/api/v1/cv/${id}/needs-regeneration`);
      setNeedsRegeneration(response.data.data.needsRegeneration);
    } catch (err: any) {
      if (err.response?.status === 404) {
        console.warn('CV regeneration check endpoint not yet implemented');
      } else {
        console.error('Failed to check regeneration need:', err);
      }
    }
  };

  const handleCustomizationChange = async (field: keyof CVCustomization, value: any) => {
    if (!customization) return;
    
    const updated = { ...customization, [field]: value };
    setCustomization(updated);
    
    try {
      setSaving(true);
      await apiClient.put(`/api/v1/cv/${id}`, updated);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save customization');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && customization && !customization.skills.includes(skillInput.trim())) {
      const newSkills = [...customization.skills, skillInput.trim()];
      handleCustomizationChange('skills', newSkills);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    if (customization) {
      const newSkills = customization.skills.filter(s => s !== skill);
      handleCustomizationChange('skills', newSkills);
    }
  };

  const handleAddHobby = () => {
    if (hobbyInput.trim() && customization && !customization.hobbies.includes(hobbyInput.trim())) {
      const newHobbies = [...customization.hobbies, hobbyInput.trim()];
      handleCustomizationChange('hobbies', newHobbies);
      setHobbyInput('');
    }
  };

  const handleRemoveHobby = (hobby: string) => {
    if (customization) {
      const newHobbies = customization.hobbies.filter(h => h !== hobby);
      handleCustomizationChange('hobbies', newHobbies);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true);
      const params = new URLSearchParams();
      if (customization?.templateId) params.append('template', customization.templateId);
      if (customization?.schoolBrandingEnabled !== undefined) params.append('branding', customization.schoolBrandingEnabled.toString());
      
      const token = localStorage.getItem('accessToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const downloadUrl = `${API_URL}/api/v1/cv/${id}/download?${params.toString()}`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `CV_${id}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      if (token) {
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to download PDF');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setPdfLoading(true);
      const params = new URLSearchParams();
      if (customization?.templateId) params.append('template', customization.templateId);
      if (customization?.schoolBrandingEnabled !== undefined) params.append('branding', customization.schoolBrandingEnabled.toString());
      
      const token = localStorage.getItem('accessToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const regenerateUrl = `${API_URL}/api/v1/cv/${id}/regenerate?${params.toString()}`;
      
      const response = await fetch(regenerateUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to regenerate CV');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CV_${id}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setNeedsRegeneration(false);
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate CV');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>{t('Loading...')}</Typography>
      </Box>
    );
  }

  if (!CV_FEATURE_ENABLED) {
    return (
      <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
            {t('students.cvComingSoon') || 'CV Feature Coming Soon'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {t('students.cvComingSoonMessage') || 
              'The Student CV generation feature is currently under development. This feature will allow you to generate professional CVs for students including their academic records, achievements, and activities.'}
          </Typography>
        </Alert>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/students')} 
          variant="outlined"
          sx={{ borderRadius: 3 }}
        >
          {t('common.back') || 'Back to List'}
        </Button>
      </Box>
    );
  }

  if (error && !cvData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/students')} sx={{ mt: 2 }}>
          {t('common.back') || 'Back to List'}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          p: 3,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <IconButton 
            onClick={() => navigate(`/students/${id}`)} 
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2), transform: 'translateX(-4px)' }
            }}
          >
            <BackIcon sx={{ color: theme.palette.primary.main }} />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {t('Student CV')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {cvData?.personalInfo?.fullNameEn || `Student ID: ${id}`}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={previewMode ? 'contained' : 'outlined'}
            startIcon={previewMode ? <EditIcon /> : <PreviewIcon />}
            onClick={() => setPreviewMode(!previewMode)}
            sx={{ borderRadius: 3, fontWeight: 600 }}
          >
            {previewMode ? t('Edit Mode') : t('Preview Mode')}
          </Button>
          <Button
            variant="contained"
            startIcon={pdfLoading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            onClick={needsRegeneration ? handleRegenerate : handleDownloadPDF}
            disabled={pdfLoading}
            sx={{ 
              borderRadius: 3, 
              fontWeight: 600,
              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 10px 28px ${alpha(theme.palette.primary.main, 0.45)}`,
              }
            }}
          >
            {t('Download PDF')}
          </Button>
        </Box>
      </MotionBox>

      {needsRegeneration && (
        <Alert 
          severity="info" 
          sx={{ mb: 3, borderRadius: 3 }} 
          icon={<RefreshIcon />}
          action={
            <Button color="inherit" size="small" onClick={handleRegenerate} startIcon={<RefreshIcon />}>
              {t('Regenerate')}
            </Button>
          }
        >
          {t('CV data has been updated. Please regenerate your CV.')}
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

      {/* Tabs */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
        <Tabs
          value={tabValue}
          onChange={(_e, newValue) => setTabValue(newValue)}
          variant="fullWidth"
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              minHeight: 56,
            },
            '& .Mui-selected': {
              color: theme.palette.primary.main,
            }
          }}
        >
          <Tab label={t('Preview')} icon={<PreviewIcon />} iconPosition="start" />
          <Tab label={t('Customization')} icon={<EditIcon />} iconPosition="start" />
        </Tabs>

        {/* Preview Tab */}
        <TabPanel value={tabValue} index={0}>
          {cvData && (
            <Box>
              {/* Personal Info */}
              {cvData.personalInfo && (
                <InfoSection icon={<PersonIcon sx={{ color: theme.palette.primary.main }} />} title={t('Personal Information')}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                      <Avatar
                        src={cvData.personalInfo.photoUrl}
                        sx={{ 
                          width: 120, 
                          height: 120, 
                          mx: 'auto', 
                          mb: 2,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                          border: `3px solid ${theme.palette.background.paper}`,
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {cvData.personalInfo.fullNameEn}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {cvData.personalInfo.studentCode}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">{t('Date of Birth')}</Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {cvData.personalInfo.dateOfBirthBS} BS
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">{t('Gender')}</Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {cvData.personalInfo.gender}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">{t('Address')}</Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {cvData.personalInfo.addressEn}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">{t('Phone')}</Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                            {cvData.personalInfo.phone || '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">{t('Email')}</Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {cvData.personalInfo.email || '-'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </InfoSection>
              )}

              {/* Academic Performance */}
              {cvData.academicPerformance && cvData.academicPerformance.academicYears.length > 0 && (
                <InfoSection icon={<SchoolIcon sx={{ color: theme.palette.primary.main }} />} title={t('Academic Performance')}>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4}>
                      <StatBox value={cvData.academicPerformance.overallGPA.toFixed(2)} label="Overall GPA" color={theme.palette.primary.main} />
                    </Grid>
                    <Grid item xs={4}>
                      <StatBox value={cvData.academicPerformance.averageGrade} label="Average Grade" color="#10b981" />
                    </Grid>
                    <Grid item xs={4}>
                      <StatBox value={cvData.academicPerformance.totalSubjects} label="Total Subjects" color={theme.palette.secondary.main} />
                    </Grid>
                  </Grid>
                  {cvData.academicPerformance.academicYears.map((year) => (
                    <Box key={year.yearId} sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {year.yearName} - {year.className}
                        </Typography>
                        <Chip 
                          label={`Rank: #${year.rank > 0 ? year.rank : '-'}`} 
                          size="small" 
                          color={year.rank <= 3 ? 'primary' : 'default'}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        GPA: <strong>{year.gpa.toFixed(2)}</strong> | Class: {year.totalStudents} students
                      </Typography>
                    </Box>
                  ))}
                </InfoSection>
              )}

              {/* Attendance */}
              {cvData.attendance && (
                <InfoSection icon={<AttendanceIcon sx={{ color: '#10b981' }} />} title={t('Attendance Record')}>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4}>
                      <StatBox value={`${cvData.attendance.overallPercentage}%`} label="Overall" color="#10b981" />
                    </Grid>
                    <Grid item xs={4}>
                      <StatBox value={cvData.attendance.presentDays} label="Present" color={theme.palette.primary.main} />
                    </Grid>
                    <Grid item xs={4}>
                      <StatBox value={cvData.attendance.totalDays} label="Total Days" color={theme.palette.secondary.main} />
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box sx={{ flex: cvData.attendance.presentDays, bgcolor: '#10b981', height: 12, borderRadius: '6px 0 0 6px' }} />
                    <Box sx={{ flex: cvData.attendance.absentDays, bgcolor: '#ef4444', height: 12 }} />
                    <Box sx={{ flex: cvData.attendance.lateDays, bgcolor: '#f59e0b', height: 12 }} />
                    <Box sx={{ flex: cvData.attendance.excusedDays, bgcolor: '#6b7280', height: 12, borderRadius: '0 6px 6px 0' }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">Present</Typography>
                    <Typography variant="caption" color="text.secondary">Absent</Typography>
                    <Typography variant="caption" color="text.secondary">Late</Typography>
                    <Typography variant="caption" color="text.secondary">Excused</Typography>
                  </Box>
                </InfoSection>
              )}

              {/* ECA */}
              {cvData.eca && cvData.eca.participations.length > 0 && (
                <InfoSection icon={<ECAIcon sx={{ color: '#f59e0b' }} />} title={t('Extra-Curricular Activities')}>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4}>
                      <StatBox value={cvData.eca.summary.totalECAs} label="Activities" color="#f59e0b" />
                    </Grid>
                    <Grid item xs={4}>
                      <StatBox value={cvData.eca.summary.totalAchievements} label="Achievements" color="#10b981" />
                    </Grid>
                    <Grid item xs={4}>
                      <StatBox value={cvData.eca.summary.averageAttendance.toFixed(0) + '%'} label="Avg Attendance" color={theme.palette.primary.main} />
                    </Grid>
                  </Grid>
                  <List>
                    {cvData.eca.participations.map((eca, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 1 }}>
                        <ListItemIcon>
                          <Box sx={{ 
                            width: 36, 
                            height: 36, 
                            borderRadius: 2, 
                            bgcolor: alpha('#f59e0b', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <CheckIcon sx={{ color: '#10b981', fontSize: 20 }} />
                          </Box>
                        </ListItemIcon>
                        <ListItemText 
                          primary={eca.ecaName}
                          secondaryTypographyProps={{ component: 'div' }}
                          secondary={
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip label={eca.category} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                              <Chip label={eca.status} size="small" color="success" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                            </Box>
                          } 
                        />
                      </ListItem>
                    ))}
                  </List>
                </InfoSection>
              )}

              {/* Sports */}
              {cvData.sports && cvData.sports.participations.length > 0 && (
                <InfoSection icon={<SportsIcon sx={{ color: '#3b82f6' }} />} title={t('Sports Activities')}>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4}>
                      <StatBox value={cvData.sports.summary.totalSports} label="Sports" color="#3b82f6" />
                    </Grid>
                    <Grid item xs={4}>
                      <StatBox 
                        value={
                          cvData.sports.summary.medalCount.gold + 
                          cvData.sports.summary.medalCount.silver + 
                          cvData.sports.summary.medalCount.bronze
                        } 
                        label="Medals" 
                        color="#f59e0b" 
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <StatBox value={cvData.sports.summary.recordsSet} label="Records" color="#10b981" />
                    </Grid>
                  </Grid>
                  <List>
                    {cvData.sports.participations.map((sport, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 1 }}>
                        <ListItemIcon>
                          <Box sx={{ 
                            width: 36, 
                            height: 36, 
                            borderRadius: 2, 
                            bgcolor: alpha('#3b82f6', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <SportsIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                          </Box>
                        </ListItemIcon>
                        <ListItemText 
                          primary={sport.sportName}
                          secondaryTypographyProps={{ component: 'div' }}
                          secondary={
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip label={sport.category} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                              <Chip label={sport.status} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                            </Box>
                          } 
                        />
                      </ListItem>
                    ))}
                  </List>
                </InfoSection>
              )}

              {/* Certificates */}
              {cvData.certificates && cvData.certificates.totalCount > 0 && (
                <InfoSection icon={<CertificateIcon sx={{ color: '#8b5cf6' }} />} title={t('Certificates')}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {cvData.certificates.certificates.map((cert, index) => (
                      <Chip
                        key={index}
                        icon={<CertificateIcon />}
                        label={cert.name}
                        sx={{ 
                          borderRadius: 2.5,
                          fontWeight: 600,
                          bgcolor: alpha('#8b5cf6', 0.1),
                          color: '#8b5cf6',
                          '& .MuiChip-icon': { color: '#8b5cf6' }
                        }}
                      />
                    ))}
                  </Box>
                </InfoSection>
              )}

              {/* Custom Fields */}
              {cvData.customFields && (
                <InfoSection icon={<PersonIcon sx={{ color: theme.palette.secondary.main }} />} title={t('Custom Fields')}>
                  {cvData.customFields.skills.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                        {t('Skills')}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {cvData.customFields.skills.map((skill, index) => (
                          <Chip 
                            key={index} 
                            label={skill} 
                            sx={{ 
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              fontWeight: 600
                            }} 
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {cvData.customFields.hobbies.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                        {t('Hobbies')}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {cvData.customFields.hobbies.map((hobby, index) => (
                          <Chip 
                            key={index} 
                            label={hobby} 
                            sx={{ 
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.secondary.main, 0.1),
                              color: theme.palette.secondary.main,
                              fontWeight: 600
                            }} 
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {cvData.customFields.careerGoals && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                        {t('Career Goals')}
                      </Typography>
                      <Typography variant="body1">{cvData.customFields.careerGoals}</Typography>
                    </Box>
                  )}
                  
                  {cvData.customFields.personalStatement && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                        {t('Personal Statement')}
                      </Typography>
                      <Typography variant="body1">{cvData.customFields.personalStatement}</Typography>
                    </Box>
                  )}
                </InfoSection>
              )}

              {/* Verification Footer */}
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.03), textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('Generated on')}: {cvData.generatedAt ? new Date(cvData.generatedAt).toLocaleDateString() : '-'}
                </Typography>
                <Typography variant="caption" color="primary" display="block" sx={{ mt: 0.5 }}>
                  {t('Verification')}: {cvData.verificationUrl}
                </Typography>
              </Paper>
            </Box>
          )}
        </TabPanel>

        {/* Customization Tab */}
        <TabPanel value={tabValue} index={1}>
          {customization && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>{t('Section Visibility')}</Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {[
                  { key: 'showPersonalInfo', label: 'Personal Information', default: true },
                  { key: 'showAcademicPerformance', label: 'Academic Performance', default: true },
                  { key: 'showAttendance', label: 'Attendance', default: true },
                  { key: 'showECA', label: 'ECA', default: true },
                  { key: 'showSports', label: 'Sports', default: true },
                  { key: 'showCertificates', label: 'Certificates', default: true },
                  { key: 'showAwards', label: 'Awards', default: false },
                  { key: 'showTeacherRemarks', label: 'Teacher Remarks', default: false },
                ].map((item) => (
                  <Grid item xs={6} sm={3} key={item.key}>
                    <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={customization[item.key as keyof CVCustomization] as boolean}
                            onChange={(e) => handleCustomizationChange(item.key as keyof CVCustomization, e.target.checked)}
                            color="primary"
                          />
                        }
                        label={item.label}
                        sx={{ fontWeight: 600 }}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>{t('Template Options')}</Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('Template')}</InputLabel>
                    <Select
                      value={customization.templateId}
                      label={t('Template')}
                      onChange={(e) => handleCustomizationChange('templateId', e.target.value)}
                      sx={{ borderRadius: 2.5 }}
                    >
                      <MenuItem value="standard">{t('Standard')}</MenuItem>
                      <MenuItem value="professional">{t('Professional')}</MenuItem>
                      <MenuItem value="modern">{t('Modern')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={customization.schoolBrandingEnabled}
                          onChange={(e) => handleCustomizationChange('schoolBrandingEnabled', e.target.checked)}
                          color="primary"
                        />
                      }
                      label={t('Show School Branding')}
                      sx={{ fontWeight: 600 }}
                    />
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>{t('Custom Fields')}</Typography>
              
              {/* Skills */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>{t('Skills')}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder={t('Add a skill')}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={handleAddSkill}
                    sx={{ borderRadius: 2.5 }}
                  >
                    {t('Add')}
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {customization.skills.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      onDelete={() => handleRemoveSkill(skill)}
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Hobbies */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>{t('Hobbies')}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    value={hobbyInput}
                    onChange={(e) => setHobbyInput(e.target.value)}
                    placeholder={t('Add a hobby')}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddHobby()}
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={handleAddHobby}
                    sx={{ borderRadius: 2.5 }}
                  >
                    {t('Add')}
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {customization.hobbies.map((hobby, index) => (
                    <Chip
                      key={index}
                      label={hobby}
                      onDelete={() => handleRemoveHobby(hobby)}
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Career Goals */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>{t('Career Goals')}</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={customization.careerGoals}
                  onChange={(e) => handleCustomizationChange('careerGoals', e.target.value)}
                  placeholder={t('Describe your career goals')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Box>

              {/* Personal Statement */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>{t('Personal Statement')}</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={customization.personalStatement}
                  onChange={(e) => handleCustomizationChange('personalStatement', e.target.value)}
                  placeholder={t('Write your personal statement')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Box>

              {saving && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">{t('Saving...')}</Typography>
                </Box>
              )}
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default StudentCV;
