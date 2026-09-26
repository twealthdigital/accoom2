// src/components/NotificationsModal.tsx
import React, { useEffect, useState } from 'react';
import { NotificationItem } from '../types/index.ts';
import { api } from '../lib/api.ts';
import {
  X,
  Bell,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  if (!isOpen) return null;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const list = await api.notifications.list();
      setNotifications(list || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isOpen]);

  const markAsRead = async (id: number) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Notifications</h2>
              <p className="text-[11px] text-slate-400">Escrow alerts & booking status updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              You are all caught up! No new notifications.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`py-3.5 px-3 rounded-2xl flex items-start gap-3 cursor-pointer transition ${
                  item.read ? 'opacity-70 hover:bg-slate-50' : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {item.type === 'payment' && (
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {item.type === 'transaction' && (
                    <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {item.type === 'message' && (
                    <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {item.type === 'system' && (
                    <div className="w-7 h-7 rounded-xl bg-coral-100 text-coral-600 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
                </div>

                {!item.read && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
