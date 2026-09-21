import fs from 'fs';
import path from 'path';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  voiceAutoSpeak: boolean;
  voiceMuted: boolean;
  language: string;
  enterToSend: boolean;
  showTimestamps: boolean;
  responseStyle: 'balanced' | 'concise' | 'detailed' | 'socratic';
}

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
  preferences: UserPreferences;
}

export interface ConversationRecord {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: any[];
  createdAt: number;
}

export interface SearchHistoryRecord {
  id: string;
  userId: string;
  query: string;
  createdAt: number;
}

interface DatabaseSchema {
  users: UserRecord[];
  conversations: ConversationRecord[];
  messages: MessageRecord[];
  searchHistory: SearchHistoryRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseEngine {
  private data: DatabaseSchema = {
    users: [],
    conversations: [],
    messages: [],
    searchHistory: [],
  };
  private isSaving = false;
  private pendingSave = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: Array.isArray(parsed.users) ? parsed.users : [],
          conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
          messages: Array.isArray(parsed.messages) ? parsed.messages : [],
          searchHistory: Array.isArray(parsed.searchHistory) ? parsed.searchHistory : [],
        };
      } else {
        this.saveSync();
      }
    } catch (err) {
      console.error('[DatabaseEngine] Error initializing database:', err);
      this.data = {
        users: [],
        conversations: [],
        messages: [],
        searchHistory: [],
      };
    }
  }

  private saveSync() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('[DatabaseEngine] Error writing sync:', err);
    }
  }

  private async persist() {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }
    this.isSaving = true;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        await fs.promises.mkdir(DATA_DIR, { recursive: true });
      }
      const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
      const jsonStr = JSON.stringify(this.data, null, 2);
      await fs.promises.writeFile(tempFile, jsonStr, 'utf-8');
      await fs.promises.rename(tempFile, DB_FILE);
    } catch (err) {
      console.error('[DatabaseEngine] Error saving database to disk:', err);
    } finally {
      this.isSaving = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        this.persist();
      }
    }
  }

  // Users API
  public users = {
    create: async (user: Omit<UserRecord, 'createdAt' | 'updatedAt'>): Promise<UserRecord> => {
      const now = Date.now();
      const record: UserRecord = {
        ...user,
        createdAt: now,
        updatedAt: now,
      };
      this.data.users.push(record);
      await this.persist();
      return record;
    },

    findById: (id: string): UserRecord | undefined => {
      return this.data.users.find((u) => u.id === id);
    },

    findByEmail: (email: string): UserRecord | undefined => {
      const normalized = email.trim().toLowerCase();
      return this.data.users.find((u) => u.email.toLowerCase() === normalized);
    },

    findByUsername: (username: string): UserRecord | undefined => {
      const normalized = username.trim().toLowerCase();
      return this.data.users.find((u) => u.username.toLowerCase() === normalized);
    },

    update: async (id: string, partial: Partial<Omit<UserRecord, 'id' | 'createdAt'>>): Promise<UserRecord | null> => {
      const idx = this.data.users.findIndex((u) => u.id === id);
      if (idx === -1) return null;

      this.data.users[idx] = {
        ...this.data.users[idx],
        ...partial,
        updatedAt: Date.now(),
      };
      await this.persist();
      return this.data.users[idx];
    },

    delete: async (id: string): Promise<boolean> => {
      const initialCount = this.data.users.length;
      this.data.users = this.data.users.filter((u) => u.id !== id);
      if (this.data.users.length === initialCount) return false;

      // Cascade delete conversations, messages, searchHistory
      const userConvs = this.data.conversations.filter((c) => c.userId === id).map((c) => c.id);
      this.data.conversations = this.data.conversations.filter((c) => c.userId !== id);
      this.data.messages = this.data.messages.filter((m) => m.userId !== id && !userConvs.includes(m.conversationId));
      this.data.searchHistory = this.data.searchHistory.filter((s) => s.userId !== id);

      await this.persist();
      return true;
    },
  };

  // Conversations API
  public conversations = {
    create: async (userId: string, title: string, customId?: string): Promise<ConversationRecord> => {
      const now = Date.now();
      const id = customId || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const record: ConversationRecord = {
        id,
        userId,
        title: title.trim() || 'New Conversation',
        createdAt: now,
        updatedAt: now,
      };
      this.data.conversations.unshift(record);
      await this.persist();
      return record;
    },

    listByUser: (userId: string, query?: string): (ConversationRecord & { messageCount: number; lastMessage?: string })[] => {
      let list = this.data.conversations.filter((c) => c.userId === userId);

      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        // Check title or messages matching query
        const matchingConvIds = new Set<string>();
        for (const m of this.data.messages) {
          if (m.userId === userId && m.content.toLowerCase().includes(q)) {
            matchingConvIds.add(m.conversationId);
          }
        }
        list = list.filter((c) => c.title.toLowerCase().includes(q) || matchingConvIds.has(c.id));
      }

      list.sort((a, b) => b.updatedAt - a.updatedAt);

      return list.map((c) => {
        const msgs = this.data.messages.filter((m) => m.conversationId === c.id);
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].content.slice(0, 80) : undefined;
        return {
          ...c,
          messageCount: msgs.length,
          lastMessage: lastMsg,
        };
      });
    },

    findById: (id: string, userId: string): ConversationRecord | undefined => {
      return this.data.conversations.find((c) => c.id === id && c.userId === userId);
    },

    updateTitle: async (id: string, userId: string, title: string): Promise<ConversationRecord | null> => {
      const conv = this.data.conversations.find((c) => c.id === id && c.userId === userId);
      if (!conv) return null;

      conv.title = title.trim() || conv.title;
      conv.updatedAt = Date.now();
      await this.persist();
      return conv;
    },

    touch: async (id: string, userId: string): Promise<void> => {
      const conv = this.data.conversations.find((c) => c.id === id && c.userId === userId);
      if (conv) {
        conv.updatedAt = Date.now();
        await this.persist();
      }
    },

    delete: async (id: string, userId: string): Promise<boolean> => {
      const initial = this.data.conversations.length;
      this.data.conversations = this.data.conversations.filter((c) => !(c.id === id && c.userId === userId));
      if (this.data.conversations.length === initial) return false;

      // Delete messages
      this.data.messages = this.data.messages.filter((m) => m.conversationId !== id);
      await this.persist();
      return true;
    },
  };

  // Messages API
  public messages = {
    create: async (msg: Omit<MessageRecord, 'id' | 'createdAt'>, customId?: string): Promise<MessageRecord> => {
      const record: MessageRecord = {
        id: customId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        ...msg,
        createdAt: Date.now(),
      };
      this.data.messages.push(record);

      // Touch parent conversation updatedAt
      const conv = this.data.conversations.find((c) => c.id === msg.conversationId);
      if (conv) {
        conv.updatedAt = record.createdAt;
      }

      await this.persist();
      return record;
    },

    listByConversation: (conversationId: string, userId: string): MessageRecord[] => {
      // Ensure user owns this conversation
      const conv = this.data.conversations.find((c) => c.id === conversationId && c.userId === userId);
      if (!conv) return [];

      return this.data.messages
        .filter((m) => m.conversationId === conversationId)
        .sort((a, b) => a.createdAt - b.createdAt);
    },

    deleteByConversation: async (conversationId: string, userId: string): Promise<number> => {
      const conv = this.data.conversations.find((c) => c.id === conversationId && c.userId === userId);
      if (!conv) return 0;

      const before = this.data.messages.length;
      this.data.messages = this.data.messages.filter((m) => m.conversationId !== conversationId);
      const deleted = before - this.data.messages.length;
      await this.persist();
      return deleted;
    },
  };

  // Search History API
  public searchHistory = {
    record: async (userId: string, query: string): Promise<SearchHistoryRecord> => {
      const q = query.trim();
      if (!q) throw new Error('Query cannot be empty');

      // Remove existing duplicate query for same user if exists
      this.data.searchHistory = this.data.searchHistory.filter(
        (s) => !(s.userId === userId && s.query.toLowerCase() === q.toLowerCase())
      );

      const record: SearchHistoryRecord = {
        id: `srch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        query: q,
        createdAt: Date.now(),
      };

      this.data.searchHistory.unshift(record);

      // Cap at 100 queries per user
      const userSearches = this.data.searchHistory.filter((s) => s.userId === userId);
      if (userSearches.length > 100) {
        const excessIds = new Set(userSearches.slice(100).map((s) => s.id));
        this.data.searchHistory = this.data.searchHistory.filter((s) => !excessIds.has(s.id));
      }

      await this.persist();
      return record;
    },

    listByUser: (userId: string, limit = 20): SearchHistoryRecord[] => {
      return this.data.searchHistory
        .filter((s) => s.userId === userId)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
    },

    delete: async (id: string, userId: string): Promise<boolean> => {
      const before = this.data.searchHistory.length;
      this.data.searchHistory = this.data.searchHistory.filter((s) => !(s.id === id && s.userId === userId));
      const deleted = before !== this.data.searchHistory.length;
      if (deleted) await this.persist();
      return deleted;
    },

    clearByUser: async (userId: string): Promise<number> => {
      const before = this.data.searchHistory.length;
      this.data.searchHistory = this.data.searchHistory.filter((s) => s.userId !== userId);
      const deleted = before - this.data.searchHistory.length;
      if (deleted > 0) await this.persist();
      return deleted;
    },
  };
}

export const db = new DatabaseEngine();
