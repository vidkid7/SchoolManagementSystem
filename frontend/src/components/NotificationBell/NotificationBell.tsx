/**
 * NotificationBell
 *
 * Navbar bell icon with unread badge.  Clicking opens a popover panel that
 * lists recent notifications with mark-read / delete actions.
 */

import { useState, useRef } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  Tooltip,
  CircularProgress,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Notifications as BellIcon,
  NotificationsNone as BellEmptyIcon,
  CheckCircleOutline as CheckIcon,
  DeleteOutline as DeleteIcon,
  InfoOutlined as InfoIcon,
  WarningAmberOutlined as WarnIcon,
  CheckCircle as SuccessIcon,
  ErrorOutline as ErrorIcon,
  School as ExamIcon,
  AttachMoney as FeeIcon,
  LibraryBooks as LibraryIcon,
  HowToReg as AttendanceIcon,
  Grade as GradeIcon,
  Campaign as AnnouncementIcon,
  ExitToApp as LeaveIcon,
  Circle as GeneralIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotifications, Notification } from '../../hooks/useNotifications';
import { formatDistanceToNow } from '../../utils/dateUtils';

function categoryIcon(category: Notification['category']) {
  switch (category) {
    case 'exam':        return <ExamIcon fontSize="small" />;
    case 'fee':         return <FeeIcon fontSize="small" />;
    case 'library':     return <LibraryIcon fontSize="small" />;
    case 'attendance':  return <AttendanceIcon fontSize="small" />;
    case 'grade':       return <GradeIcon fontSize="small" />;
    case 'announcement':return <AnnouncementIcon fontSize="small" />;
    case 'leave':       return <LeaveIcon fontSize="small" />;
    default:            return <GeneralIcon fontSize="small" />;
  }
}

function typeColor(type: Notification['type']): string {
  switch (type) {
    case 'warning': return '#FF9500';
    case 'success': return '#34C759';
    case 'error':   return '#FF3B30';
    default:        return '#007AFF';
  }
}

function typeIcon(type: Notification['type']) {
  switch (type) {
    case 'warning': return <WarnIcon fontSize="small" />;
    case 'success': return <SuccessIcon fontSize="small" />;
    case 'error':   return <ErrorIcon fontSize="small" />;
    default:        return <InfoIcon fontSize="small" />;
  }
}

export function NotificationBell() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchMore,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotifications();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead && n.notificationId) await markRead(n.notificationId);
  };

  const handleViewAll = () => {
    handleClose();
    navigate(municipalitySlug ? `/${municipalitySlug}/my-notifications` : '/my-notifications');
  };

  const glass = {
    background: theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(20,20,20,0.9) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(245,245,247,0.95) 100%)',
    backdropFilter: 'blur(40px) saturate(180%)',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
    boxShadow: theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset'
      : '0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.6) inset',
  };

  return (
    <>
      <Tooltip title="Notifications" arrow>
        <IconButton
          ref={anchorRef}
          onClick={handleOpen}
          size="small"
          sx={{
            position: 'relative',
            width: 36,
            height: 36,
            borderRadius: 2,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
            transition: 'all 0.2s ease',
            '&:hover': {
              background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,122,255,0.06)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,122,255,0.2)'}`,
            },
          }}
        >
          <Badge
            badgeContent={unreadCount > 99 ? '99+' : unreadCount}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.6rem',
                height: 16,
                minWidth: 16,
                fontWeight: 700,
              },
            }}
          >
            {unreadCount > 0
              ? <BellIcon sx={{ fontSize: 18, color: '#007AFF' }} />
              : <BellEmptyIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          elevation: 0,
          sx: {
            ...glass,
            borderRadius: 2,
            mt: 1,
            width: 380,
            maxWidth: '95vw',
            overflow: 'hidden',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2.5, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  background: 'rgba(0,122,255,0.12)',
                  color: '#007AFF',
                  border: '1px solid rgba(0,122,255,0.25)',
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            )}
          </Box>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
              onClick={markAllRead}
              sx={{ fontSize: '0.72rem', color: '#007AFF', textTransform: 'none', fontWeight: 600, px: 1, py: 0.5, borderRadius: 1.5 }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        <Divider sx={{ opacity: 0.08 }} />

        {/* Notification list */}
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {loading && notifications.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <BellEmptyIcon sx={{ fontSize: 40, color: theme.palette.text.disabled, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {notifications.slice(0, 15).map((n, idx) => {
                const persistedId = n.notificationId;

                return (
                  <Box key={`${n.clientKey}-${idx}`}>
                    {idx > 0 && <Divider sx={{ opacity: 0.05, mx: 2 }} />}
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        py: 1.5,
                        px: 2,
                        background: n.isRead
                          ? 'transparent'
                          : theme.palette.mode === 'dark'
                            ? 'rgba(0,122,255,0.06)'
                            : 'rgba(0,122,255,0.04)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        '&:hover': {
                          background: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,122,255,0.06)',
                        },
                        position: 'relative',
                      }}
                      onClick={() => handleNotificationClick(n)}
                      secondaryAction={persistedId ? (
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => { e.stopPropagation(); deleteNotification(persistedId); }}
                          sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: '#FF3B30' } }}
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      ) : null}
                    >
                    {/* Unread dot */}
                    {!n.isRead && (
                      <Box sx={{
                        position: 'absolute',
                        left: 6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#007AFF',
                      }} />
                    )}

                    <ListItemAvatar sx={{ minWidth: 40, mt: 0.5 }}>
                      <Avatar sx={{
                        width: 32,
                        height: 32,
                        background: `${typeColor(n.type)}20`,
                        color: typeColor(n.type),
                      }}>
                        {categoryIcon(n.category)}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      disableTypography
                      primary={
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: n.isRead ? 400 : 600, fontSize: '0.82rem', lineHeight: 1.3, pr: 2 }}
                        >
                          {n.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', display: 'block', mt: 0.25 }}>
                            {n.message}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: typeColor(n.type), opacity: 0.7 }}>
                              {typeIcon(n.type)}
                              <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'capitalize' }}>
                                {n.type}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontSize: '0.65rem' }}>
                              · {formatDistanceToNow(n.createdAt)}
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

          {hasMore && notifications.length > 0 && (
            <Box sx={{ px: 2, pb: 1.5 }}>
              <Button
                fullWidth
                size="small"
                onClick={fetchMore}
                disabled={loading}
                sx={{ fontSize: '0.75rem', textTransform: 'none', borderRadius: 2, py: 0.5 }}
              >
                {loading ? <CircularProgress size={14} /> : 'Load more'}
              </Button>
            </Box>
          )}
        </Box>

        <Divider sx={{ opacity: 0.08 }} />

        {/* Footer */}
        <Box sx={{ px: 2, py: 1.25 }}>
          <Button
            fullWidth
            size="small"
            onClick={handleViewAll}
            sx={{
              fontSize: '0.78rem',
              textTransform: 'none',
              borderRadius: 2,
              color: '#007AFF',
              fontWeight: 600,
              py: 0.75,
              background: 'rgba(0,122,255,0.06)',
              '&:hover': { background: 'rgba(0,122,255,0.12)' },
            }}
          >
            View all notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
}
