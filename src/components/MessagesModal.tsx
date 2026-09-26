// src/components/MessagesModal.tsx
import React, { useEffect, useState } from 'react';
import { Conversation, Message } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../lib/api.ts';
import {
  X,
  Send,
  MessageSquare,
  Building,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeConversationId?: number | null;
}

export function MessagesModal({ isOpen, onClose, activeConversationId }: MessagesModalProps) {
  if (!isOpen) return null;

  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messagesList, setMessagesList] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const list = await api.conversations.list();
      setConversations(list || []);

      if (list && list.length > 0) {
        if (activeConversationId) {
          const matched = list.find((c) => c.id === activeConversationId);
          setSelectedConv(matched || list[0]);
        } else if (!selectedConv) {
          setSelectedConv(list[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: number) => {
    try {
      const msgs = await api.conversations.getMessages(convId);
      setMessagesList(msgs || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [isOpen, activeConversationId]);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
    }
  }, [selectedConv]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedConv) return;

    try {
      setSending(true);
      const text = inputMessage.trim();
      setInputMessage('');
      const newMsg = await api.conversations.sendMessage(selectedConv.id, text);
      setMessagesList((prev) => [...prev, newMsg]);
      // Update snippet in conversation list
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConv.id ? { ...c, lastMessage: text } : c))
      );
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">ACCOOM In-Platform Messaging</h2>
              <p className="text-[11px] text-slate-400">Direct tenant and agent inquiry channel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messaging Layout: Left Sidebar + Right Chat Thread */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation List */}
          <div className="w-full sm:w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Chats ({conversations.length})
              </span>
              <button onClick={fetchConversations} className="text-slate-400 hover:text-slate-600">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading messages...</div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No active chats yet. Inquire on any property listing to start talking with an agent!
                </div>
              ) : (
                conversations.map((conv) => {
                  const isSelected = selectedConv?.id === conv.id;
                  const otherPartyName =
                    currentUser?.id === conv.buyerId
                      ? conv.agent?.businessName || 'Host Agent'
                      : conv.buyer?.name || 'Prospective Tenant';

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConv(conv)}
                      className={`w-full p-3.5 text-left transition flex items-start gap-3 cursor-pointer ${
                        isSelected ? 'bg-white shadow-xs border-l-4 border-emerald-600' : 'hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {otherPartyName[0]}
                      </div>
                      <div className="truncate flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{otherPartyName}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {conv.property && (
                          <div className="text-[11px] text-emerald-700 truncate font-medium flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 shrink-0" />
                            {conv.property.title}
                          </div>
                        )}
                        <p className="text-xs text-slate-500 truncate mt-1">
                          {conv.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Conversation View */}
          <div className="hidden sm:flex flex-1 flex-col bg-white">
            {selectedConv ? (
              <>
                {/* Active Chat Header */}
                <div className="p-3.5 px-6 border-b border-slate-100 flex items-center justify-between bg-white">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {currentUser?.id === selectedConv.buyerId
                        ? selectedConv.agent?.businessName || 'Property Agent'
                        : selectedConv.buyer?.name || 'Tenant'}
                    </h3>
                    {selectedConv.property && (
                      <p className="text-xs text-emerald-700 font-medium">
                        Regarding: {selectedConv.property.title} (₦{selectedConv.property.price.toLocaleString()}/yr)
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified User
                  </span>
                </div>

                {/* Message Bubbles Thread */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3.5 bg-slate-50/30">
                  {messagesList.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No messages in this chat yet. Type below to send your inquiry!
                    </div>
                  ) : (
                    messagesList.map((msg) => {
                      const isMe = msg.senderId === currentUser?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed ${
                              isMe
                                ? 'bg-emerald-600 text-white rounded-br-none shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-2xs'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 font-mono px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input Box */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-slate-100 bg-white flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message to the agent..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !inputMessage.trim()}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Select a conversation on the left to view messages
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
