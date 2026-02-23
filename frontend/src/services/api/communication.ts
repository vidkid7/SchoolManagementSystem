/**
 * Communication API Service
 * 
 * API calls for messaging and announcements
 * 
 * Requirements: 24.1, 24.2, 24.3, 24.8
 */

import { apiClient } from '../apiClient';

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  recipientId: number;
  content: string;
  attachments?: Attachment[];
  isRead: boolean;
  readAt?: string;
  sentAt: string;
}

export interface Conversation {
  id: number;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
}

export interface GroupConversation {
  id: number;
  name: string;
  type: 'class' | 'custom' | 'announcement';
  description?: string;
  classId?: number;
  createdBy: number;
  isAnnouncementOnly: boolean;
  members: GroupMember[];
  lastMessage?: GroupMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  role: string;
  isAdmin: boolean;
  avatarUrl?: string;
}

export interface GroupMessage {
  id: number;
  groupConversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  attachments?: Attachment[];
  sentAt: string;
}

export interface Attachment {
  id: number;
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  targetAudience: 'all' | 'students' | 'parents' | 'teachers' | 'staff';
  targetClasses?: number[];
  priority: 'low' | 'medium' | 'high';
  publishedBy: number;
  publishedByName: string;
  publishedAt: string;
  expiresAt?: string;
  attachments?: Attachment[];
}

export interface SendMessageRequest {
  recipientId: number;
  content: string;
  attachments?: File[];
}

export interface SendGroupMessageRequest {
  groupConversationId: number;
  content: string;
  attachments?: File[];
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  targetAudience: 'all' | 'students' | 'parents' | 'teachers' | 'staff';
  targetClasses?: number[];
  priority: 'low' | 'medium' | 'high';
  expiresAt?: string;
}

class CommunicationApiService {
  private baseUrl = '/api/v1/communication';

  // ==================== CONVERSATION METHODS ====================

  /**
   * Get user conversations
   */
async getConversations(page = 1, limit = 20): Promise<{
    conversations: Conversation[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await apiClient.get(`${this.baseUrl}/conversations`, {
      params: { page, limit },
    });
    return {
      conversations: response.data.data || [],
      meta: response.data.meta || { page, limit, total: 0, totalPages: 0 },
    };
  }

  /**
   * Get or create conversation with user
   */
  async getOrCreateConversation(otherUserId: number): Promise<Conversation> {
    const response = await apiClient.post(`${this.baseUrl}/conversations`, {
      otherUserId,
    });
    return response.data.data;
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId: number): Promise<Conversation> {
    const response = await apiClient.get(
      `${this.baseUrl}/conversations/${conversationId}`
    );
    return response.data.data;
  }

  // ==================== MESSAGE METHODS ====================

  /**
   * Get conversation messages
   */
async getConversationMessages(
    conversationId: number,
    page = 1,
    limit = 50
  ): Promise<{
    messages: Message[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await apiClient.get(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      { params: { page, limit } }
    );
    return {
      messages: response.data.data || [],
      meta: response.data.meta || { page, limit, total: 0, totalPages: 0 },
    };
  }

  /**
   * Send a message
   */
  async sendMessage(request: SendMessageRequest): Promise<Message> {
    const formData = new FormData();
    formData.append('recipientId', String(request.recipientId));
    formData.append('content', request.content);

    if (request.attachments) {
      request.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await apiClient.post(`${this.baseUrl}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: number): Promise<void> {
    await apiClient.put(`${this.baseUrl}/messages/${messageId}/read`);
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId: number): Promise<void> {
    await apiClient.put(`${this.baseUrl}/conversations/${conversationId}/read`);
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(conversationId?: number): Promise<{ unreadCount: number }> {
    const response = await apiClient.get(`${this.baseUrl}/unread-count`, {
      params: { conversationId },
    });
    return response.data.data;
  }

  /**
   * Search messages
   */
  async searchMessages(
    query: string,
    page = 1,
    limit = 50
  ): Promise<{
    messages: Message[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await apiClient.get(`${this.baseUrl}/messages/search`, {
      params: { q: query, page, limit },
    });
    return response.data;
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/messages/${messageId}`);
  }

  // ==================== ONLINE STATUS METHODS ====================

  /**
   * Get online users
   */
  async getOnlineUsers(): Promise<{ onlineUsers: number[]; count: number }> {
    const response = await apiClient.get(`${this.baseUrl}/online-users`);
    return response.data.data;
  }

  /**
   * Check if user is online
   */
  async checkUserOnline(userId: number): Promise<{ userId: number; isOnline: boolean }> {
    const response = await apiClient.get(`${this.baseUrl}/users/${userId}/online`);
    return response.data.data;
  }

  // ==================== GROUP METHODS ====================

  /**
   * Get user's group conversations
   */
async getGroupConversations(page = 1, limit = 20): Promise<{
    groupConversations: GroupConversation[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await apiClient.get(`${this.baseUrl}/groups`, {
      params: { page, limit },
    });
    return {
      groupConversations: response.data.data || [],
      meta: response.data.meta || { page, limit, total: 0, totalPages: 0 },
    };
  }

  /**
   * Get group conversation by ID
   */
  async getGroupConversationById(groupConversationId: number): Promise<GroupConversation> {
    const response = await apiClient.get(
      `${this.baseUrl}/groups/${groupConversationId}`
    );
    return response.data.data;
  }

  /**
   * Create group conversation
   */
  async createGroupConversation(data: {
    name: string;
    type: 'class' | 'custom' | 'announcement';
    description?: string;
    classId?: number;
    isAnnouncementOnly?: boolean;
    memberIds: number[];
  }): Promise<GroupConversation> {
    const response = await apiClient.post(`${this.baseUrl}/groups`, data);
    return response.data.data;
  }

  /**
   * Get group messages
   */
async getGroupMessages(
    groupConversationId: number,
    page = 1,
    limit = 50
  ): Promise<{
    messages: GroupMessage[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await apiClient.get(
      `${this.baseUrl}/groups/${groupConversationId}/messages`,
      { params: { page, limit } }
    );
    return {
      messages: response.data.data || [],
      meta: response.data.meta || { page, limit, total: 0, totalPages: 0 },
    };
  }

  /**
   * Send group message
   */
  async sendGroupMessage(request: SendGroupMessageRequest): Promise<GroupMessage> {
    const formData = new FormData();
    formData.append('groupConversationId', String(request.groupConversationId));
    formData.append('content', request.content);

    if (request.attachments) {
      request.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await apiClient.post(
      `${this.baseUrl}/groups/messages`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  }

  /**
   * Mark group as read
   */
  async markGroupAsRead(groupConversationId: number): Promise<void> {
    await apiClient.put(`${this.baseUrl}/groups/${groupConversationId}/read`);
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupConversationId: number): Promise<GroupMember[]> {
    const response = await apiClient.get(
      `${this.baseUrl}/groups/${groupConversationId}/members`
    );
    return response.data.data;
  }

  /**
   * Add members to group
   */
  async addGroupMembers(
    groupConversationId: number,
    userIds: number[]
  ): Promise<GroupMember[]> {
    const response = await apiClient.post(
      `${this.baseUrl}/groups/${groupConversationId}/members`,
      { userIds }
    );
    return response.data.data;
  }

  /**
   * Remove member from group
   */
  async removeGroupMember(
    groupConversationId: number,
    userId: number
  ): Promise<void> {
    await apiClient.delete(
      `${this.baseUrl}/groups/${groupConversationId}/members/${userId}`
    );
  }

  /**
   * Update group conversation
   */
  async updateGroupConversation(
    groupConversationId: number,
    data: { name?: string; description?: string; isAnnouncementOnly?: boolean }
  ): Promise<GroupConversation> {
    const response = await apiClient.put(
      `${this.baseUrl}/groups/${groupConversationId}`,
      data
    );
    return response.data.data;
  }

  /**
   * Delete group conversation
   */
  async deleteGroupConversation(groupConversationId: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/groups/${groupConversationId}`);
  }

  // ==================== ANNOUNCEMENT METHODS ====================

  /**
   * Get announcements
   */
  async getAnnouncements(params?: {
    targetAudience?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    announcements: Announcement[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await apiClient.get(`${this.baseUrl}/announcements`, {
      params,
    });
    return response.data;
  }

  /**
   * Get announcement by ID
   */
  async getAnnouncementById(announcementId: number): Promise<Announcement> {
    const response = await apiClient.get(
      `${this.baseUrl}/announcements/${announcementId}`
    );
    return response.data.data;
  }

  /**
   * Create announcement
   */
  async createAnnouncement(request: CreateAnnouncementRequest): Promise<Announcement> {
    const response = await apiClient.post(`${this.baseUrl}/announcements`, request);
    return response.data.data;
  }

  /**
   * Update announcement
   */
  async updateAnnouncement(
    announcementId: number,
    data: Partial<CreateAnnouncementRequest>
  ): Promise<Announcement> {
    const response = await apiClient.put(
      `${this.baseUrl}/announcements/${announcementId}`,
      data
    );
    return response.data.data;
  }

  /**
   * Delete announcement
   */
  async deleteAnnouncement(announcementId: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/announcements/${announcementId}`);
  }
}

export const communicationApi = new CommunicationApiService();