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
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  InputAdornment,
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
import { RootState } from '../../store';
import { communicationApi, Announcement, CreateAnnouncementRequest } from '../../services/api/communication';
import { formatDistanceToNow, format } from 'date-fns';

export const Announcements: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state: RootState) => state.auth);

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
  const canCreateAnnouncement = user?.role === 'School_Admin' || 
    user?.role === 'Class_Teacher' || 
    user?.role === 'Subject_Teacher' ||
    user?.role === 'Department_Head';

  // Check if user is a student
  const isStudent = user?.role === 'Student';
  const isParent = user?.role === 'Parent';

  // Auto-set filter based on user role
  const getDefaultFilter = () => {
    if (isStudent) return 'students';
    if (isParent) return 'parents';
    return 'all';
  };

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
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon color="primary" />
          <Typography variant="h5">{t('communication.announcements')}</Typography>
        </Box>
        {canCreateAnnouncement && (
          <Button
            variant="contained"
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
          >
            {t('communication.createAnnouncement')}
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={isStudent || isParent ? 9 : 6}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('communication.searchAnnouncements')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          {!isStudent && !isParent && (
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('communication.filterByAudience')}</InputLabel>
                <Select
                  value={filterAudience}
                  label={t('communication.filterByAudience')}
                  onChange={(e) => setFilterAudience(e.target.value)}
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
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              {filteredAnnouncements.length} {t('communication.announcements').toLowerCase()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Announcements List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredAnnouncements.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {t('communication.noAnnouncements')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('communication.noAnnouncementsDesc')}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredAnnouncements.map((announcement) => (
            <Grid item xs={12} key={announcement.id}>
              <Card
                sx={{
                  borderLeft: 4,
                  borderColor: `${getPriorityColor(announcement.priority)}.main`,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {announcement.publishedByName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(announcement.publishedAt), { addSuffix: true })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={getAudienceLabel(announcement.targetAudience)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={announcement.priority}
                        size="small"
                        color={getPriorityColor(announcement.priority)}
                      />
                    </Box>
                  </Box>

                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    {announcement.title}
                  </Typography>

                  <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {announcement.content}
                  </Typography>

                  {announcement.targetClasses && announcement.targetClasses.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('communication.targetClasses')}:
                      </Typography>
                      {announcement.targetClasses.map((classNum) => (
                        <Chip key={classNum} label={`Class ${classNum}`} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}

                  {announcement.expiresAt && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {t('communication.expiresOn')}: {format(new Date(announcement.expiresAt), 'PPP')}
                    </Typography>
                  )}
                </CardContent>

                {(user?.userId === announcement.publishedBy || user?.role === 'school_admin') && (
                  <>
                    <Divider />
                    <CardActions>
                      <IconButton size="small" onClick={() => handleEdit(announcement)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(announcement.id)}>
                        <DeleteIcon />
                      </IconButton>
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingAnnouncement
            ? t('communication.editAnnouncement')
            : t('communication.createAnnouncement')}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label={t('communication.announcementTitle')}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label={t('communication.announcementContent')}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            margin="normal"
            multiline
            rows={4}
            required
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>{t('communication.targetAudience')}</InputLabel>
            <Select
              value={formData.targetAudience}
              label={t('communication.targetAudience')}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
            >
              <MenuItem value="all">{t('communication.audienceAll')}</MenuItem>
              <MenuItem value="students">{t('communication.audienceStudents')}</MenuItem>
              <MenuItem value="parents">{t('communication.audienceParents')}</MenuItem>
              <MenuItem value="teachers">{t('communication.audienceTeachers')}</MenuItem>
              <MenuItem value="staff">{t('communication.audienceStaff')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>{t('communication.priority')}</InputLabel>
            <Select
              value={formData.priority}
              label={t('communication.priority')}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            >
              <MenuItem value="low">{t('communication.priorityLow')}</MenuItem>
              <MenuItem value="medium">{t('communication.priorityMedium')}</MenuItem>
              <MenuItem value="high">{t('communication.priorityHigh')}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={t('communication.expiryDate')}
            type="date"
            value={formData.expiresAt || ''}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateDialogOpen(false);
              setEditingAnnouncement(null);
              setError(null);
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};