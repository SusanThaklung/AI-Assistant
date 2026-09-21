import { UserProfile, Conversation, SearchHistoryItem } from '../types';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('nova_auth_token');
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem('nova_auth_token', token);
  } else {
    localStorage.removeItem('nova_auth_token');
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = 'An unexpected server error occurred.';
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {
      // Use fallback error
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  auth: {
    register: (data: { username: string; email: string; password: string; confirmPassword: string }) =>
      request<{ user: UserProfile; token: string; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { identifier: string; password: string }) =>
      request<{ user: UserProfile; token: string; message: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () => request<{ user: UserProfile }>('/auth/me'),

    updateProfile: (data: { username?: string; preferences?: any }) =>
      request<{ user: UserProfile; message: string }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
      request<{ message: string }>('/auth/password', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteAccount: (data: { password?: string }) =>
      request<{ message: string }>('/auth/account', {
        method: 'DELETE',
        body: JSON.stringify(data),
      }),

    logout: async () => {
      try {
        await request('/auth/logout', { method: 'POST' });
      } catch {
        // Continue even if network failed
      } finally {
        setToken(null);
      }
    },
  },

  conversations: {
    list: (searchQuery?: string) => {
      const q = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      return request<{ conversations: Conversation[] }>(`/conversations${q}`);
    },

    get: (id: string) =>
      request<{ conversation: Conversation; messages: any[] }>(`/conversations/${id}`),

    create: (title?: string) =>
      request<{ conversation: Conversation }>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),

    rename: (id: string, title: string) =>
      request<{ conversation: Conversation }>(`/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }),

    delete: (id: string) =>
      request<{ message: string }>(`/conversations/${id}`, {
        method: 'DELETE',
      }),
  },

  searchHistory: {
    list: (limit = 20) =>
      request<{ history: SearchHistoryItem[] }>(`/search-history?limit=${limit}`),

    record: (query: string) =>
      request<{ item: SearchHistoryItem }>('/search-history', {
        method: 'POST',
        body: JSON.stringify({ query }),
      }),

    delete: (id: string) =>
      request<{ message: string }>(`/search-history/${id}`, {
        method: 'DELETE',
      }),

    clear: () =>
      request<{ message: string; deletedCount: number }>('/search-history', {
        method: 'DELETE',
      }),
  },
};
