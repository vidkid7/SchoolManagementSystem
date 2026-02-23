/**
 * Messaging Page
 * 
 * Displays conversation list, one-on-one chat, and group chat
 * 
 * Requirements: 24.1, 24.2, 24.3
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Badge,
  Tab,
  Tabs,
  InputAdornment,
  CircularProgress,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Circle as CircleIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { RootState } from '../../store';
import { communicationApi, Message, Conversation, GroupConversation, GroupMessage } from '../../services/api/communication';
import { socketService } from '../../services/socket';
import { formatDistanceToNow } from 'date-fns';

interface MessagingProps {
  onSelectConversation?: (conversationId: number) => void;
}

export const Messaging: React.FC<MessagingProps> = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state: RootState) => state.auth);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groupConversations, setGroupConversations] = useState<GroupConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [newConversationDialogOpen, setNewConversationDialogOpen] = useState(false);
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const [convsResult, groupsResult] = await Promise.all([
        communicationApi.getConversations(),
        communicationApi.getGroupConversations(),
      ]);
      setConversations(convsResult.conversations);
      setGroupConversations(groupsResult.groupConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: number) => {
    try {
      const result = await communicationApi.getConversationMessages(conversationId);
      setMessages(result.messages.reverse());
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  // Load group messages
  const loadGroupMessages = useCallback(async (groupId: number) => {
    try {
      const result = await communicationApi.getGroupMessages(groupId);
      setGroupMessages(result.messages.reverse());
    } catch (error) {
      console.error('Failed to load group messages:', error);
    }
  }, []);

  // Initialize socket connection and event listeners
  useEffect(() => {
    socketService.connect();

    const unsubscribeOnline = socketService.on('users:online', (users: number[]) => {
      setOnlineUsers(new Set(users));
    });

    const unsubscribeStatus = socketService.on('user:status', (data: { userId: number; status: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (data.status === 'online') {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    });

    const unsubscribeNewMessage = socketService.on('message:new', (message: Message) => {
      if (selectedConversation && message.conversationId === selectedConversation.id) {
        setMessages((prev) => [...prev, message]);
        // Mark as read
        communicationApi.markMessageAsRead(message.id);
        socketService.markMessageRead({
          messageId: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
        });
      }
      // Refresh conversation list to update last message
      loadConversations();
    });

    const unsubscribeTypingStart = socketService.on('typing:start', (data: { conversationId: number; userId: number }) => {
      if (selectedConversation && data.conversationId === selectedConversation.id) {
        setTypingUsers((prev) => new Set([...prev, data.userId]));
      }
    });

    const unsubscribeTypingStop = socketService.on('typing:stop', (data: { conversationId: number; userId: number }) => {
      if (selectedConversation && data.conversationId === selectedConversation.id) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    });

    const unsubscribeGroupMessage = socketService.on('group:message:new', (message: GroupMessage) => {
      if (selectedGroup && message.groupConversationId === selectedGroup.id) {
        setGroupMessages((prev) => [...prev, message]);
      }
      loadConversations();
    });

    loadConversations();

    return () => {
      unsubscribeOnline();
      unsubscribeStatus();
      unsubscribeNewMessage();
      unsubscribeTypingStart();
      unsubscribeTypingStop();
      unsubscribeGroupMessage();
      socketService.disconnect();
    };
  }, [loadConversations, selectedConversation, selectedGroup]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, groupMessages]);

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setSelectedGroup(null);
    setMobileView('chat');
    loadMessages(conversation.id);
    setTypingUsers(new Set());
  };

  // Handle group selection
  const handleSelectGroup = (group: GroupConversation) => {
    setSelectedGroup(group);
    setSelectedConversation(null);
    setMobileView('chat');
    loadGroupMessages(group.id);
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const message = await communicationApi.sendMessage({
        recipientId: selectedConversation.participants.find(p => p.id !== user?.userId)?.id || 0,
        content: newMessage.trim(),
      });

      setMessages((prev) => [...prev, message]);
      socketService.sendMessage({
        recipientId: message.recipientId,
        conversationId: message.conversationId,
        messageId: message.id,
        content: message.content,
        sentAt: message.sentAt,
      });

      setNewMessage('');
      socketService.stopTyping(message.recipientId, message.conversationId);
      loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle send group message
  const handleSendGroupMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return;

    try {
      setSending(true);
      const message = await communicationApi.sendGroupMessage({
        groupConversationId: selectedGroup.id,
        content: newMessage.trim(),
      });

      setGroupMessages((prev) => [...prev, message]);
      const memberIds = selectedGroup.members.map(m => m.userId);
      socketService.sendGroupMessage({
        groupConversationId: message.groupConversationId,
        groupMessageId: message.id,
        content: message.content,
        sentAt: message.sentAt,
        memberIds,
      });

      setNewMessage('');
      socketService.stopGroupTyping(selectedGroup.id, memberIds);
      loadConversations();
    } catch (error) {
      console.error('Failed to send group message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle typing
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (selectedConversation) {
      socketService.startTyping(
        selectedConversation.participants.find(p => p.id !== user?.userId)?.id || 0,
        selectedConversation.id
      );

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(
          selectedConversation.participants.find(p => p.id !== user?.userId)?.id || 0,
          selectedConversation.id
        );
      }, 2000);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (selectedConversation) {
        handleSendMessage();
      } else if (selectedGroup) {
        handleSendGroupMessage();
      }
    }
  };

// Get other participant name
  const getOtherParticipantName = (conversation: Conversation): string => {
    if (!conversation.participants || !Array.isArray(conversation.participants)) {
      return 'Unknown';
    }
    const other = conversation.participants.find(p => p.id !== user?.userId);
    return other ? `${other.firstName} ${other.lastName}` : 'Unknown';
  };

  // Filter conversations
  const filteredConversations = (conversations || []).filter((conv) => {
    const name = getOtherParticipantName(conv).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  // Filter groups
  const filteredGroups = (groupConversations || []).filter((group) => {
    return (group.name || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 128px)', gap: 2 }}>
      {/* Conversation List */}
      {mobileView === 'list' && (
        <Paper sx={{ width: 360, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">{t('communication.messages')}</Typography>
              <Box>
                <IconButton size="small" onClick={() => setNewConversationDialogOpen(true)}>
                  <AddIcon />
                </IconButton>
                <IconButton size="small" onClick={() => setNewGroupDialogOpen(true)}>
                  <GroupIcon />
                </IconButton>
              </Box>
            </Box>
            <TextField
              fullWidth
              size="small"
              placeholder={t('communication.searchConversations')}
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
          </Box>

          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label={t('communication.chats')} />
            <Tab label={t('communication.groups')} />
          </Tabs>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {tabValue === 0 && filteredConversations.map((conversation) => {
                const otherUser = conversation.participants.find(p => p.id !== user?.userId);
                const isOnline = otherUser && onlineUsers.has(otherUser.id);

                return (
                  <ListItem
                    key={conversation.id}
                    button
                    selected={selectedConversation?.id === conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    sx={{
                      borderLeft: selectedConversation?.id === conversation.id ? 3 : 0,
                      borderColor: 'primary.main',
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={isOnline ? <CircleIcon color="success" sx={{ fontSize: 12 }} /> : null}
                      >
                        <Avatar>{getOtherParticipantName(conversation)[0]}</Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={getOtherParticipantName(conversation)}
                      secondary={
                        conversation.lastMessage
                          ? `${conversation.lastMessage.content.substring(0, 30)}...`
                          : t('communication.noMessages')
                      }
                      primaryTypographyProps={{ noWrap: true }}
                      secondaryTypographyProps={{ noWrap: true }}
                    />
                    {conversation.unreadCount > 0 && (
                      <Chip label={conversation.unreadCount} size="small" color="primary" />
                    )}
                  </ListItem>
                );
              })}

              {tabValue === 1 && filteredGroups.map((group) => (
                <ListItem
                  key={group.id}
                  button
                  selected={selectedGroup?.id === group.id}
                  onClick={() => handleSelectGroup(group)}
                  sx={{
                    borderLeft: selectedGroup?.id === group.id ? 3 : 0,
                    borderColor: 'primary.main',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <GroupIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={group.name}
                    secondary={
                      group.lastMessage
                        ? `${group.lastMessage.content.substring(0, 30)}...`
                        : t('communication.noMessages')
                    }
                    primaryTypographyProps={{ noWrap: true }}
                    secondaryTypographyProps={{ noWrap: true }}
                  />
                  {group.unreadCount > 0 && (
                    <Chip label={group.unreadCount} size="small" color="primary" />
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Chat Area */}
      {(selectedConversation || selectedGroup) && mobileView === 'chat' && (
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Chat Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
            {mobileView === 'chat' && (
              <IconButton onClick={() => setMobileView('list')}>
                <ArrowBackIcon />
              </IconButton>
            )}
            {selectedConversation ? (
              <>
                <Avatar>
                  {getOtherParticipantName(selectedConversation)[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1">
                    {getOtherParticipantName(selectedConversation)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {onlineUsers.has(selectedConversation.participants.find(p => p.id !== user?.userId)?.id || 0)
                      ? t('communication.online')
                      : t('communication.offline')}
                  </Typography>
                </Box>
              </>
            ) : selectedGroup ? (
              <>
                <Avatar>
                  <GroupIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1">{selectedGroup.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedGroup.members.length} {t('communication.members')}
                  </Typography>
                </Box>
              </>
            ) : null}
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <MoreVertIcon />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {selectedConversation ? (
              <>
                {messages.map((message) => {
                  const isOwn = message.senderId === user?.userId;
                  return (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1.5,
                          maxWidth: '70%',
                          bgcolor: isOwn ? 'primary.main' : 'grey.100',
                          color: isOwn ? 'white' : 'text.primary',
                        }}
                      >
                        <Typography variant="body1">{message.content}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                        </Typography>
                      </Paper>
                    </Box>
                  );
                })}
                {typingUsers.size > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {t('communication.typing')}
                  </Typography>
                )}
                <div ref={messagesEndRef} />
              </>
            ) : selectedGroup ? (
              <>
                {groupMessages.map((message) => {
                  const isOwn = message.senderId === user?.userId;
                  return (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwn ? 'flex-end' : 'flex-start',
                        mb: 1,
                      }}
                    >
                      {!isOwn && (
                        <Typography variant="caption" color="text.secondary">
                          {message.senderName}
                        </Typography>
                      )}
                      <Paper
                        sx={{
                          p: 1.5,
                          maxWidth: '70%',
                          bgcolor: isOwn ? 'primary.main' : 'grey.100',
                          color: isOwn ? 'white' : 'text.primary',
                        }}
                      >
                        <Typography variant="body1">{message.content}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                        </Typography>
                      </Paper>
                    </Box>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            ) : null}
          </Box>

          {/* Message Input */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton>
                <AttachFileIcon />
              </IconButton>
              <TextField
                fullWidth
                size="small"
                placeholder={t('communication.typeMessage')}
                value={newMessage}
                onChange={handleTyping}
                onKeyPress={handleKeyPress}
              />
              <IconButton
                color="primary"
                onClick={selectedConversation ? handleSendMessage : handleSendGroupMessage}
                disabled={!newMessage.trim() || sending}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Empty State */}
      {!selectedConversation && !selectedGroup && mobileView === 'list' && (
        <Paper sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {t('communication.selectConversation')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('communication.startChatting')}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          {t('communication.viewProfile')}
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          {t('communication.clearChat')}
        </MenuItem>
      </Menu>

      {/* New Conversation Dialog */}
      <Dialog open={newConversationDialogOpen} onClose={() => setNewConversationDialogOpen(false)}>
        <DialogTitle>{t('communication.newConversation')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('communication.newConversationDesc')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewConversationDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={() => setNewConversationDialogOpen(false)}>
            {t('common.add')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Group Dialog */}
      <Dialog open={newGroupDialogOpen} onClose={() => setNewGroupDialogOpen(false)}>
        <DialogTitle>{t('communication.newGroup')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('communication.newGroupDesc')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewGroupDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={() => setNewGroupDialogOpen(false)}>
            {t('common.add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};