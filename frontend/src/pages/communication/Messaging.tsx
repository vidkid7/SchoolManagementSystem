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
  ListItemButton,
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
  Autocomplete,
  useTheme,
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
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { RootState } from '../../store';
import { communicationApi, Message, Conversation, GroupConversation, GroupMessage } from '../../services/api/communication';
import { userApi, User } from '../../services/api/user';
import { socketService } from '../../services/socket';
import { formatDistanceToNow } from 'date-fns';

interface MessagingProps {
  onSelectConversation?: (conversationId: number) => void;
}

export const Messaging: React.FC<MessagingProps> = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const S = useAdminStyles(theme);

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
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<User[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load available users for new conversation
  const loadAvailableUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const result = await userApi.getUsers({ limit: 100 });
      // Filter out current user
      const filteredUsers = result.users.filter(u => u.userId !== user?.userId);
      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, [user?.userId]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const [convsResult, groupsResult, usersResult] = await Promise.all([
        communicationApi.getConversations(),
        communicationApi.getGroupConversations(),
        userApi.getUsers({ limit: 1000 }), // Get all users for mapping
      ]);
      
      console.log('Raw conversations from API:', convsResult.conversations);
      console.log('Available users:', usersResult.users.length);
      
      // Create a user map for quick lookup
      const userMap = new Map(usersResult.users.map(u => [u.userId, u]));
      
      // Enrich conversations with participant details
      const enrichedConversations = convsResult.conversations.map(conv => {
        const participant1 = userMap.get(conv.participant1Id!);
        const participant2 = userMap.get(conv.participant2Id!);
        
        // Ensure we have a valid ID
        const conversationId = conv.id || conv.conversationId;
        if (!conversationId) {
          console.error('Conversation without ID:', conv);
        }
        
        return {
          ...conv,
          id: conversationId, // Ensure id is set
          participants: [participant1, participant2].filter(Boolean).map(u => ({
            id: u!.userId,
            firstName: u!.firstName || '',
            lastName: u!.lastName || '',
            role: u!.role,
            avatarUrl: u!.avatar,
          })),
        };
      }).filter(conv => conv.id) as Conversation[]; // Filter out conversations without IDs
      
      console.log('Loaded conversations:', enrichedConversations);
      console.log('Loaded groups:', groupsResult.groupConversations);
      setConversations(enrichedConversations);
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
    console.log('Selecting conversation:', conversation);
    
    // Validate conversation has required data
    if (!conversation.id) {
      console.error('Conversation missing ID:', conversation);
      return;
    }
    
    if (!conversation.participants || conversation.participants.length === 0) {
      console.error('Conversation missing participants:', conversation);
      // Still set it as selected but don't try to load messages
      setSelectedConversation(conversation);
      setSelectedGroup(null);
      setMobileView('chat');
      setTypingUsers(new Set());
      return;
    }
    
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
      const recipientId = selectedConversation.participants?.find(p => p.id !== user?.userId)?.id;
      if (!recipientId) {
        console.error('No recipient found in conversation');
        setSending(false);
        return;
      }
      
      const message = await communicationApi.sendMessage({
        recipientId,
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

    if (selectedConversation && selectedConversation.participants) {
      const recipientId = selectedConversation.participants.find(p => p.id !== user?.userId)?.id;
      if (!recipientId) return;

      socketService.startTyping(recipientId, selectedConversation.id);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(recipientId, selectedConversation.id);
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

  // Handle open new conversation dialog
  const handleOpenNewConversation = () => {
    setNewConversationDialogOpen(true);
    loadAvailableUsers();
  };

  // Handle create new conversation
  const handleCreateConversation = async () => {
    if (!selectedUserId) return;

    try {
      setCreatingConversation(true);
      const conversation = await communicationApi.getOrCreateConversation(selectedUserId);
      setNewConversationDialogOpen(false);
      setSelectedUserId(null);
      
      // Reload conversations to get the updated list
      await loadConversations();
      
      // Wait a bit for state to update, then select the conversation
      setTimeout(() => {
        // Use the conversation ID to select it after reload
        setSelectedConversation(conversation);
        setSelectedGroup(null);
        setMobileView('chat');
        if (conversation.id) {
          loadMessages(conversation.id);
        }
        setTypingUsers(new Set());
      }, 100);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setCreatingConversation(false);
    }
  };

  // Handle open new group dialog
  const handleOpenNewGroup = () => {
    setNewGroupDialogOpen(true);
    loadAvailableUsers();
  };

  // Handle create new group
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedGroupMembers.length === 0) return;

    try {
      setCreatingGroup(true);
      const memberIds = selectedGroupMembers.map(u => u.userId);
      
      const group = await communicationApi.createGroupConversation({
        name: groupName.trim(),
        type: 'custom',
        description: groupDescription.trim() || undefined,
        isAnnouncementOnly: false,
        memberIds,
      });
      
      // Reset form
      setNewGroupDialogOpen(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedGroupMembers([]);
      
      // Reload conversations
      await loadConversations();
      
      // Select the new group
      setTimeout(() => {
        handleSelectGroup(group);
      }, 100);
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setCreatingGroup(false);
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
    <Box sx={{ display: 'flex', height: 'calc(100vh - 128px)', gap: 0, bgcolor: 'background.default' }}>
      {/* Conversation List */}
      {(mobileView === 'list' || window.innerWidth > 900) && (
        <Paper 
          elevation={0}
          sx={{ 
            width: { xs: '100%', md: 380 }, 
            display: 'flex', 
            flexDirection: 'column',
            borderRight: 1,
            borderColor: 'divider',
            borderRadius: 0,
          }}
        >
          <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" fontWeight={600}>{t('communication.messages')}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton 
                  size="medium" 
                  onClick={handleOpenNewConversation}
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="medium" 
                  onClick={handleOpenNewGroup}
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <GroupIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <TextField
              fullWidth
              size="small"
              placeholder={t('communication.searchConversations')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: R.sm,
                  bgcolor: 'action.hover',
                  '& fieldset': { border: 'none' },
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
          </Box>

          <Tabs 
            value={tabValue} 
            onChange={(_, v) => setTabValue(v)} 
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              px: 2,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
              },
            }}
          >
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
                const otherUser = conversation.participants?.find(p => p.id !== user?.userId);
                const isOnline = otherUser && onlineUsers.has(otherUser.id);

                return (
                  <ListItemButton
                    key={conversation.id}
                    selected={selectedConversation?.id === conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderRadius: R.sm,
                      mx: 1,
                      my: 0.5,
                      bgcolor: selectedConversation?.id === conversation.id ? 'action.selected' : 'transparent',
                      '&:hover': {
                        bgcolor: selectedConversation?.id === conversation.id ? 'action.selected' : 'action.hover',
                      },
                      transition: 'all 0.2s',
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          isOnline ? (
                            <CircleIcon 
                              sx={{ 
                                fontSize: 12, 
                                color: 'success.main',
                                bgcolor: 'background.paper',
                                borderRadius: '50%',
                              }} 
                            />
                          ) : null
                        }
                      >
                        <Avatar 
                          sx={{ 
                            width: 48, 
                            height: 48,
                            bgcolor: 'primary.main',
                            fontWeight: 600,
                          }}
                        >
                          {getOtherParticipantName(conversation)[0]?.toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {getOtherParticipantName(conversation)}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {conversation.lastMessage
                            ? conversation.lastMessage.content.substring(0, 35) + '...'
                            : t('communication.noMessages')}
                        </Typography>
                      }
                    />
                    {conversation.unreadCount > 0 && (
                      <Chip 
                        label={conversation.unreadCount} 
                        size="small" 
                        color="primary"
                        sx={{ 
                          height: 24,
                          minWidth: 24,
                          '& .MuiChip-label': { px: 1 },
                        }}
                      />
                    )}
                  </ListItemButton>
                );
              })}

              {tabValue === 1 && filteredGroups.map((group) => (
                <ListItemButton
                  key={group.id}
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
                </ListItemButton>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Chat Area */}
      {(selectedConversation || selectedGroup) && (
        <Paper 
          elevation={0}
          sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 0,
            bgcolor: 'background.default',
          }}
        >
          {/* Chat Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: 1, 
            borderColor: 'divider', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            bgcolor: 'background.paper',
          }}>
            {mobileView === 'chat' && window.innerWidth <= 900 && (
              <IconButton onClick={() => setMobileView('list')}>
                <ArrowBackIcon />
              </IconButton>
            )}
            {selectedConversation ? (
              <>
                <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontWeight: 600 }}>
                  {getOtherParticipantName(selectedConversation)[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {getOtherParticipantName(selectedConversation)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedConversation.participants && onlineUsers.has(selectedConversation.participants.find(p => p.id !== user?.userId)?.id || 0)
                      ? t('communication.online')
                      : t('communication.offline')}
                  </Typography>
                </Box>
              </>
            ) : selectedGroup ? (
              <>
                <Avatar sx={{ width: 44, height: 44, bgcolor: 'secondary.main' }}>
                  <GroupIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>{selectedGroup.name}</Typography>
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
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 3,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.default' : 'grey.50',
          }}>
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
                        mb: 1.5,
                      }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          maxWidth: '70%',
                          bgcolor: isOwn ? 'primary.main' : 'background.paper',
                          color: isOwn ? 'primary.contrastText' : 'text.primary',
                          borderRadius: R.sm,
                          borderTopRightRadius: isOwn ? 0 : R.sm,
                          borderTopLeftRadius: isOwn ? R.sm : 0,
                        }}
                      >
                        <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                          {message.content}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            opacity: 0.7, 
                            display: 'block', 
                            mt: 0.5,
                            fontSize: '0.7rem',
                          }}
                        >
                          {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                        </Typography>
                      </Paper>
                    </Box>
                  );
                })}
                {typingUsers.size > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
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
                        mb: 1.5,
                      }}
                    >
                      {!isOwn && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mb: 0.5 }}>
                          {message.senderName}
                        </Typography>
                      )}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          maxWidth: '70%',
                          bgcolor: isOwn ? 'primary.main' : 'background.paper',
                          color: isOwn ? 'primary.contrastText' : 'text.primary',
                          borderRadius: R.sm,
                          borderTopRightRadius: isOwn ? 0 : R.sm,
                          borderTopLeftRadius: isOwn ? R.sm : 0,
                        }}
                      >
                        <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                          {message.content}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            opacity: 0.7, 
                            display: 'block', 
                            mt: 0.5,
                            fontSize: '0.7rem',
                          }}
                        >
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
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <IconButton size="small" sx={{ mb: 0.5 }}>
                <AttachFileIcon />
              </IconButton>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                size="small"
                placeholder={t('communication.typeMessage')}
                value={newMessage}
                onChange={handleTyping}
                onKeyPress={handleKeyPress}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: R.sm,
                    bgcolor: 'action.hover',
                  },
                }}
              />
              <IconButton
                color="primary"
                onClick={selectedConversation ? handleSendMessage : handleSendGroupMessage}
                disabled={!newMessage.trim() || sending}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  mb: 0.5,
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                }}
              >
                {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              </IconButton>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Empty State */}
      {!selectedConversation && !selectedGroup && (window.innerWidth > 900 || mobileView === 'list') && (
        <Paper 
          elevation={0}
          sx={{ 
            flex: 1, 
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: 'background.default',
            borderRadius: 0,
          }}
        >
          <Box sx={{ textAlign: 'center', maxWidth: 400, p: 4 }}>
            <PersonIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
            <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
              {t('communication.selectConversation')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
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
      <Dialog 
        open={newConversationDialogOpen} 
        onClose={() => {
          setNewConversationDialogOpen(false);
          setSelectedUserId(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: R.lg },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            {t('communication.newConversation')}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {loadingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Autocomplete
              options={availableUsers}
              getOptionLabel={(user) => 
                user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.username
              }
              value={availableUsers.find(u => u.userId === selectedUserId) || null}
              onChange={(_, newValue) => setSelectedUserId(newValue?.userId || null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('communication.selectUser')}
                  placeholder={t('communication.searchConversations')}
                  fullWidth
                />
              )}
              renderOption={(props, user) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                    {(user.firstName?.[0] || user.username[0]).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.roleName}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => {
              setNewConversationDialogOpen(false);
              setSelectedUserId(null);
            }}
            sx={{ textTransform: 'none' }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateConversation}
            disabled={!selectedUserId || creatingConversation}
            sx={{ ...S.BTN_PRIMARY, minWidth: 100 }}
          >
            {creatingConversation ? <CircularProgress size={24} /> : t('communication.startChat')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Group Dialog */}
      <Dialog 
        open={newGroupDialogOpen} 
        onClose={() => {
          setNewGroupDialogOpen(false);
          setGroupName('');
          setGroupDescription('');
          setSelectedGroupMembers([]);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: R.lg },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            {t('communication.newGroup')}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {loadingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label={t('communication.groupName')}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={t('communication.enterGroupName')}
                required
                sx={S.TF}
              />
              
              <TextField
                fullWidth
                label={t('communication.groupDescription')}
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder={t('communication.enterGroupDescription')}
                multiline
                rows={2}
                sx={S.TF}
              />
              
              <Autocomplete
                multiple
                options={availableUsers}
                getOptionLabel={(user) => 
                  user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.username
                }
                value={selectedGroupMembers}
                onChange={(_, newValue) => setSelectedGroupMembers(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('communication.selectMembers')}
                    placeholder={t('communication.searchUsers')}
                    required
                  />
                )}
                renderOption={(props, user) => (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                      {(user.firstName?.[0] || user.username[0]).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.roleName}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((user, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={user.userId}
                      avatar={
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {(user.firstName?.[0] || user.username[0]).toUpperCase()}
                        </Avatar>
                      }
                      label={
                        user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.username
                      }
                      size="small"
                    />
                  ))
                }
              />
              
              {selectedGroupMembers.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {selectedGroupMembers.length} {t('communication.membersSelected')}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => {
              setNewGroupDialogOpen(false);
              setGroupName('');
              setGroupDescription('');
              setSelectedGroupMembers([]);
            }}
            sx={{ textTransform: 'none' }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedGroupMembers.length === 0 || creatingGroup}
            sx={{ ...S.BTN_PRIMARY, minWidth: 100 }}
          >
            {creatingGroup ? <CircularProgress size={24} /> : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
