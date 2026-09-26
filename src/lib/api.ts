// src/lib/api.ts
import { auth } from './firebase.ts';

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return { Authorization: `Bearer ${token}` };
    }
  } catch (err) {
    console.error('Failed to get auth token:', err);
  }

  // Fallback to demo token if present in memory/session for quick testing
  const demoToken = sessionStorage.getItem('accoom_demo_token');
  if (demoToken) {
    return { Authorization: `Bearer ${demoToken}` };
  }

  return {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeader();
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...(options.headers || {}),
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    const message = data.error?.message || 'Network request failed';
    const error = new Error(message);
    (error as any).code = data.error?.code;
    throw error;
  }

  return data.data;
}

export const api = {
  // Auth
  auth: {
    getMe: () => request<any>('/api/auth/me'),
    updateProfile: (data: any) => request<any>('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  },

  // Properties
  properties: {
    list: (params: Record<string, any> = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      });
      return request<{ properties: any[]; total: number; interpretedSearch: any }>(
        `/api/properties?${searchParams.toString()}`
      );
    },
    get: (id: number) => request<any>(`/api/properties/${id}`),
    create: (data: any) => request<any>('/api/properties', { method: 'POST', body: JSON.stringify(data) }),
    toggleSave: (id: number) => request<{ saved: boolean }>(`/api/properties/${id}/save`, { method: 'POST' }),
    getSaved: () => request<any[]>('/api/saved'),
  },

  // Agents
  agents: {
    list: () => request<any[]>('/api/agents'),
    get: (id: number) => request<any>(`/api/agents/${id}`),
  },

  // Wallet
  wallet: {
    get: () => request<{ wallet: any; ledger: any[] }>('/api/wallet'),
    deposit: (amount: number, reference?: string) =>
      request<any>('/api/wallet/deposit', { method: 'POST', body: JSON.stringify({ amount, reference }) }),
  },

  // Transactions
  transactions: {
    list: () => request<any[]>('/api/transactions'),
    create: (data: { propertyId: number; rentDuration?: string; paymentMethod?: string }) =>
      request<any>('/api/transactions', { method: 'POST', body: JSON.stringify(data) }),
    action: (id: number, action: string, reason?: string) =>
      request<any>(`/api/transactions/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, reason }),
      }),
    verifyKey: (id: number, key: string) =>
      request<any>(`/api/transactions/${id}/verify-key`, {
        method: 'POST',
        body: JSON.stringify({ key }),
      }),
  },

  // Dummy Sandbox Keys
  keys: {
    get: () => request<any>('/api/keys'),
  },

  // Messages & Conversations
  conversations: {
    list: () => request<any[]>('/api/conversations'),
    start: (propertyId: number, initialMessage?: string) =>
      request<{ conversationId: number }>('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ propertyId, initialMessage }),
      }),
    getMessages: (id: number) => request<any[]>(`/api/conversations/${id}/messages`),
    sendMessage: (id: number, text: string) =>
      request<any>(`/api/conversations/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
  },

  // Notifications
  notifications: {
    list: () => request<any[]>('/api/notifications'),
    markRead: (id: number) => request<any>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  },

  // Reviews & Reports
  reviews: {
    submit: (data: { propertyId: number; agentId: number; rating: number; comment: string }) =>
      request<any>('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),
  },
  reports: {
    submit: (data: { targetType: string; targetId: number; reason: string; details?: string }) =>
      request<any>('/api/reports', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Admin
  admin: {
    getMetrics: () => request<any>('/api/admin/metrics'),
    getProperties: () => request<any[]>('/api/admin/properties'),
    updatePropertyStatus: (id: number, status: string) =>
      request<any>(`/api/admin/properties/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    getReports: () => request<any[]>('/api/admin/reports'),
  },
};
