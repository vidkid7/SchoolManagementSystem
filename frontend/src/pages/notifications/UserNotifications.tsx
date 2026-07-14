/**
 * UserNotifications — full-page list of the current user's in-app notifications.
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Paper,
  useTheme,
} from '@mui/material';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import {
  CheckCircleOutline as CheckAllIcon,
  DeleteOutline as DeleteIcon,
  NotificationsNone as EmptyIcon,
  School as ExamIcon,
  AttachMoney as FeeIcon,
  LibraryBooks as LibraryIcon,
  HowToReg as AttendanceIcon,
  Grade as GradeIcon,
  Campaign as AnnouncementIcon,
  ExitToApp as LeaveIcon,
  Circle as GeneralIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNotifications, Notification } from '../../hooks/useNotifications';
import { formatDistanceToNow } from '../../utils/dateUtils';

import { useTranslation } from 'react-i18next';

function categoryIcon(category: Notification['category']) {
  switch (category) {
    case 'exam':         return <ExamIcon />;
    case 'fee':          return <FeeIcon />;
    case 'library':      return <LibraryIcon />;
    case 'attendance':   return <AttendanceIcon />;
    case 'grade':        return <GradeIcon />;
    case 'announcement': return <AnnouncementIcon />;
    case 'leave':        return <LeaveIcon />;
    default:             return <GeneralIcon />;
  }
}

function typeColor(type: Notification['type']): string {
  switch (type) {
    case 'warning': return C.warning;
    case 'success': return C.success;
    case 'error':   return C.danger;
    default:        return C.primary;
  }
}

export function UserNotifications() {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const { notifications, unreadCount, loading, hasMore, fetchMore, markRead, markAllRead, deleteNotification } =
    useNotifications();

  const [tabValue, setTabValue] = useState<'all' | 'unread'>('all');
  const [category, setCategory] = useState('all');

  const CATEGORY_LABELS: Record<string, string> = {
    all: t('notifications.categories.all'),
    attendance: t('notifications.categories.attendance'),
    exam: t('notifications.categories.exam'),
    fee: t('notifications.categories.fee'),
    grade: t('notifications.categories.grade'),
    announcement: t('notifications.categories.announcement'),
    leave: t('notifications.categories.leave'),
    library: t('notifications.categories.library'),
    general: t('notifications.categories.general'),
  };

  const filtered = notifications.filter((n) => {
    if (tabValue === 'unread' && n.isRead) return false;
    if (category !== 'all' && n.category !== category) return false;
    return true;
  });

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotificationsIcon sx={{ fontSize: 32, color: C.primary }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {t('notifications.myNotifications')}
              </Typography>
              {unreadCount > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {unreadCount} {t('notifications.unread')}
                </Typography>
              )}
            </Box>
          </Box>
          {unreadCount > 0 && (
            <Button
              startIcon={<CheckAllIcon />}
              onClick={markAllRead}
              variant="outlined"
              size="small"
              sx={{ ...S.BTN_OUTLINE, borderRadius: R.lg, textTransform: 'none', fontWeight: 600 }}
            >
              {t('notifications.markAllRead')}
            </Button>
          )}
        </Box>
      </Paper>

      <Box sx={{ ...S.GLASS, p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Tabs
          value={tabValue}
          onChange={(_e, v) => setTabValue(v)}
          sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, textTransform: 'none', fontWeight: 600, fontSize: '0.82rem' } }}
        >
          <Tab label={t('notifications.all')} value="all" />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {t('notifications.unreadTab')}
                {unreadCount > 0 && (
                  <Chip label={unreadCount} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, background: C.primary, color: '#fff', '& .MuiChip-label': { px: 0.5 } }} />
                )}
              </Box>
            }
            value="unread"
          />
        </Tabs>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            sx={{ borderRadius: R.lg, fontSize: '0.82rem' }}
          >
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <MenuItem key={val} value={val} sx={{ fontSize: '0.82rem' }}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={S.GLASS}>
        {loading && notifications.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <EmptyIcon sx={{ fontSize: 56, color: theme.palette.text.disabled, mb: 2 }} />
            <Typography color="text.secondary">
              {tabValue === 'unread' ? t('notifications.noUnread') : t('notifications.noNotificationsYet')}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filtered.map((n, idx) => {
              const persistedId = n.notificationId;

              return (
                <Box key={`${n.clientKey}-${idx}`}>
                  {idx > 0 && <Divider sx={{ opacity: 0.06 }} />}
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      py: 2, px: 3,
                      background: n.isRead ? 'transparent' : 'rgba(0,122,255,0.04)',
                      cursor: n.isRead ? 'default' : 'pointer',
                      transition: 'background 0.2s',
                      '&:hover': { background: 'rgba(0,122,255,0.04)' },
                      position: 'relative',
                    }}
                    onClick={() => !n.isRead && persistedId && markRead(persistedId)}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {!n.isRead && persistedId && (
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); markRead(persistedId); }}
                            sx={{ opacity: 0.5, '&:hover': { opacity: 1, color: C.success } }}
                          >
                            <CheckAllIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                        {persistedId && (
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); deleteNotification(persistedId); }}
                            sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: C.danger } }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                    }
                  >
                  {!n.isRead && (
                    <Box sx={{
                      position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                      width: 6, height: 6, borderRadius: '50%', background: C.primary,
                    }} />
                  )}
                  <ListItemAvatar>
                    <Avatar sx={{ background: `${typeColor(n.type)}20`, color: typeColor(n.type), width: 40, height: 40 }}>
                      {categoryIcon(n.category)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    disableTypography
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: n.isRead ? 400 : 700, fontSize: '0.88rem' }}>
                        {n.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', color: theme.palette.text.secondary, mt: 0.25 }}>
                          {n.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                          <Chip
                            label={n.category}
                            size="small"
                            sx={{
                              height: 18, fontSize: '0.62rem', fontWeight: 600, textTransform: 'capitalize',
                              background: `${typeColor(n.type)}18`, color: typeColor(n.type),
                              border: `1px solid ${typeColor(n.type)}30`,
                              '& .MuiChip-label': { px: 0.75 },
                            }}
                          />
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                            {formatDistanceToNow(n.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  </ListItem>
                </Box>
              );
            })}
          </List>
        )}

        {hasMore && (
          <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
            <Button fullWidth onClick={fetchMore} disabled={loading} sx={{ borderRadius: R.lg, textTransform: 'none' }}>
              {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
              {t('notifications.loadMore')}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
