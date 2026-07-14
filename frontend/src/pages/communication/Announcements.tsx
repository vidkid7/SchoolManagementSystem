/**
 * Announcements Page
 * 
 * Displays announcements and supports creating announcements for admin/teacher
 * 
 * Requirements: 24.8
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  InputAdornment,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { RootState } from '../../store';
import { communicationApi, Announcement, CreateAnnouncementRequest } from '../../services/api/communication';
import { formatDistanceToNow, format } from 'date-fns';

export const Announcements: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const S = useAdminStyles(theme);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAudience, setFilterAudience] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<CreateAnnouncementRequest>({
    title: '',
    content: '',
    targetAudience: 'all',
    priority: 'medium',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user can create announcements
  const canCreateAnnouncement = [
    'School_Admin',
    'Municipality_Admin',
    'Class_Teacher',
    'Subject_Teacher',
    'Department_Head',
  ].includes(user?.role || '');

  // Check if user is a student
  const isStudent = user?.role === 'Student';
  const isParent = user?.role === 'Parent';

  // Load announcements
  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const audienceFilter = isStudent ? 'students' : isParent ? 'parents' : filterAudience !== 'all' ? filterAudience : undefined;
      const result = await communicationApi.getAnnouncements({
        targetAudience: audienceFilter,
      });
      setAnnouncements(result.announcements ?? []);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setLoading(false);
    }
  }, [filterAudience, isStudent, isParent]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // Handle create/update
  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError(t('validation.required'));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingAnnouncement) {
        await communicationApi.updateAnnouncement(editingAnnouncement.id, formData);
      } else {
        await communicationApi.createAnnouncement(formData);
      }

      setCreateDialogOpen(false);
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        content: '',
        targetAudience: 'all',
        priority: 'medium',
      });
      loadAnnouncements();
    } catch (error) {
      setError(t('messages.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (announcementId: number) => {
    if (window.confirm(t('messages.confirmDelete'))) {
      try {
        await communicationApi.deleteAnnouncement(announcementId);
        loadAnnouncements();
      } catch (error) {
        console.error('Failed to delete announcement:', error);
      }
    }
  };

  // Handle edit
  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      targetAudience: announcement.targetAudience,
      priority: announcement.priority,
      targetClasses: announcement.targetClasses,
      expiresAt: announcement.expiresAt,
    });
    setCreateDialogOpen(true);
  };

  // Get priority color
  const getPriorityColor = (priority: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  // Get audience label
  const getAudienceLabel = (audience: string): string => {
    switch (audience) {
      case 'all': return t('communication.audienceAll');
      case 'students': return t('communication.audienceStudents');
      case 'parents': return t('communication.audienceParents');
      case 'teachers': return t('communication.audienceTeachers');
      case 'staff': return t('communication.audienceStaff');
      default: return audience;
    }
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      announcement.title.toLowerCase().includes(searchLower) ||
      announcement.content.toLowerCase().includes(searchLower) ||
      announcement.publishedByName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ ...S.PAGE_HEADER, display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <NotificationsIcon sx={{ fontSize: 32, color: C.primary }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {t('communication.announcements')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredAnnouncements.length} {t('communication.announcements').toLowerCase()}
            </Typography>
          </Box>
        </Box>
        {canCreateAnnouncement && (
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingAnnouncement(null);
              setFormData({
                title: '',
                content: '',
                targetAudience: 'all',
                priority: 'medium',
              });
              setCreateDialogOpen(true);
            }}
            sx={{
              ...S.BTN_PRIMARY,
              px: 3,
            }}
          >
            {t('communication.createAnnouncement')}
          </Button>
        )}
      </Paper>

      {/* Filters */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 3,
          ...S.GLASS,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={isStudent || isParent ? 12 : 8}>
            <TextField
              fullWidth
              size="medium"
              placeholder={t('communication.searchAnnouncements')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: R.sm,
                  bgcolor: 'action.hover',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          {!isStudent && !isParent && (
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="medium">
                <InputLabel>{t('communication.filterByAudience')}</InputLabel>
                <Select
                  value={filterAudience}
                  label={t('communication.filterByAudience')}
                  onChange={(e) => setFilterAudience(e.target.value)}
                  sx={{ ...S.SELECT }}
                >
                  <MenuItem value="all">{t('communication.allAudiences')}</MenuItem>
                  <MenuItem value="students">{t('communication.audienceStudents')}</MenuItem>
                  <MenuItem value="parents">{t('communication.audienceParents')}</MenuItem>
                  <MenuItem value="teachers">{t('communication.audienceTeachers')}</MenuItem>
                  <MenuItem value="staff">{t('communication.audienceStaff')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Announcements List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress size={48} />
        </Box>
      ) : filteredAnnouncements.length === 0 ? (
        <Paper 
          elevation={0}
          sx={{ 
            p: 8, 
            textAlign: 'center',
            ...S.GLASS,
          }}
        >
          <NotificationsIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
          <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
            {t('communication.noAnnouncements')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('communication.noAnnouncementsDesc')}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredAnnouncements.map((announcement) => (
            <Grid item xs={12} key={announcement.id}>
              <Card
                elevation={0}
                sx={{
                  ...S.GLASS,
                  borderLeft: 6,
                  borderLeftColor: `${getPriorityColor(announcement.priority)}.main`,
                  '&:hover': {
                    boxShadow: 2,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {announcement.publishedByName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDistanceToNow(new Date(announcement.publishedAt), { addSuffix: true })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <Chip
                        label={getAudienceLabel(announcement.targetAudience)}
                        size="medium"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={announcement.priority.toUpperCase()}
                        size="medium"
                        color={getPriorityColor(announcement.priority)}
                      />
                    </Box>
                  </Box>

                  <Typography variant="h5" fontWeight={600} sx={{ mt: 2, mb: 1.5 }}>
                    {announcement.title}
                  </Typography>

                  <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                    {announcement.content}
                  </Typography>

                  {announcement.targetClasses && announcement.targetClasses.length > 0 && (
                    <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={500} color="text.secondary">
                        {t('communication.targetClasses')}:
                      </Typography>
                      {announcement.targetClasses.map((classNum) => (
                        <Chip key={classNum} label={`Class ${classNum}`} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}

                  {announcement.expiresAt && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                      <Typography variant="body2" color="warning.main" fontWeight={500}>
                        {t('communication.expiresOn')}: {format(new Date(announcement.expiresAt), 'PPP')}
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                {(user?.userId === announcement.publishedBy || user?.role === 'School_Admin' || user?.role === 'Municipality_Admin') && (
                  <>
                    <Divider />
                    <CardActions sx={{ px: 3, py: 2 }}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(announcement)}
                        sx={{ textTransform: 'none' }}
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(announcement.id)}
                        sx={{ textTransform: 'none' }}
                      >
                        {t('common.delete')}
                      </Button>
                    </CardActions>
                  </>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditingAnnouncement(null);
          setError(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: R.lg },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography component="span" variant="h5" fontWeight={600}>
            {editingAnnouncement
              ? t('communication.editAnnouncement')
              : t('communication.createAnnouncement')}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: R.sm }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label={t('communication.announcementTitle')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder={t('communication.enterTitle')}
              sx={S.TF}
            />

            <TextField
              fullWidth
              label={t('communication.announcementContent')}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              multiline
              rows={6}
              required
              placeholder={t('communication.enterContent')}
              sx={S.TF}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('communication.targetAudience')}</InputLabel>
                  <Select
                    value={formData.targetAudience}
                    label={t('communication.targetAudience')}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                    sx={{ ...S.SELECT }}
                  >
                    <MenuItem value="all">{t('communication.audienceAll')}</MenuItem>
                    <MenuItem value="students">{t('communication.audienceStudents')}</MenuItem>
                    <MenuItem value="parents">{t('communication.audienceParents')}</MenuItem>
                    <MenuItem value="teachers">{t('communication.audienceTeachers')}</MenuItem>
                    <MenuItem value="staff">{t('communication.audienceStaff')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('communication.priority')}</InputLabel>
                  <Select
                    value={formData.priority}
                    label={t('communication.priority')}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    sx={{ ...S.SELECT }}
                  >
                    <MenuItem value="low">{t('communication.priorityLow')}</MenuItem>
                    <MenuItem value="medium">{t('communication.priorityMedium')}</MenuItem>
                    <MenuItem value="high">{t('communication.priorityHigh')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label={t('communication.expiryDate')}
              type="date"
              value={formData.expiresAt || ''}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={S.TF}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={() => {
              setCreateDialogOpen(false);
              setEditingAnnouncement(null);
              setError(null);
            }}
            size="large"
            sx={{ textTransform: 'none', px: 3 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            size="large"
            sx={{ ...S.BTN_PRIMARY, px: 4, minWidth: 120 }}
          >
            {submitting ? <CircularProgress size={24} /> : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
