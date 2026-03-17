/**
 * useNotifications hook
 *
 * Fetches the current user's notifications, exposes unread count for the
 * navbar badge, and subscribes to real-time Socket.IO pushes.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../config/api';
import { socketService } from '../services/socket';

export interface Notification {
  notificationId: number;
  userId: number;
  type: 'info' | 'warning' | 'success' | 'error';
  category: 'attendance' | 'exam' | 'fee' | 'grade' | 'announcement' | 'leave' | 'library' | 'general';
  title: string;
  message: string;
  data?: object;
  isRead: boolean;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  fetchMore: () => void;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  refetch: () => void;
}

const PAGE_SIZE = 20;

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const initialized = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.data.count);
    } catch {
      // silently ignore
    }
  }, []);

  const fetchNotifications = useCallback(async (pageNum: number, replace = false) => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications', {
        params: { page: pageNum, limit: PAGE_SIZE },
      });
      const fetched: Notification[] = Array.isArray(data.data?.notifications) ? data.data.notifications : [];
      setNotifications((prev) => (replace ? fetched : [...prev, ...fetched]));
      setHasMore(pageNum < data.data.totalPages);
    } catch {
      // silently ignore on background refresh
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchNotifications(1, true);
    fetchUnreadCount();

    // Subscribe to real-time pushes
    const unsub = socketService.on('notification:new', (n: Notification) => {
      setNotifications((prev) => [n, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    return () => {
      unsub();
    };
  }, [fetchNotifications, fetchUnreadCount]);

  const fetchMore = useCallback(() => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchNotifications(next, false);
  }, [loading, hasMore, page, fetchNotifications]);

  const markRead = useCallback(async (id: number) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await api.put('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    await api.delete(`/notifications/${id}`);
    setNotifications((prev) => {
      const removed = prev.find((n) => n.notificationId === id);
      if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.filter((n) => n.notificationId !== id);
    });
  }, []);

  const refetch = useCallback(() => {
    setPage(1);
    fetchNotifications(1, true);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchMore,
    markRead,
    markAllRead,
    deleteNotification,
    refetch,
  };
}
