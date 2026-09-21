/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'user' | 'assistant';

export interface Attachment {
  id: string;
  name: string;
  type: string; // 'image/png', 'text/javascript', etc.
  size?: number;
  previewUrl?: string;
  base64Data?: string; // base64 without prefix
  content?: string; // text content for code/notes
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  status?: 'sending' | 'sent' | 'error';
  suggestedAction?: string;
}

export type CharacterExpression =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'speaking'
  | 'listening'
  | 'surprised'
  | 'encouraging'
  | 'sleep';

export interface UserMemory {
  userName?: string;
  goals: string[];
  activeProjects: string[];
  notes?: string[];
  preferredLanguage: 'auto' | 'en' | 'np' | 'romanized-np';
}

export interface StudyGoal {
  id: string;
  title: string;
  subject: string;
  completed: boolean;
  createdAt: number;
}

export type StudySubject =
  | 'programming'
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'ai_tech'
  | 'english'
  | 'nepali'
  | 'general_science'
  | 'projects';

export interface VoiceSettings {
  autoSpeak: boolean;
  isMuted: boolean;
  speechRate: number;
  speechPitch: number;
  voiceName?: string;
  speechLanguage?: 'auto' | 'en-US' | 'ne-NP';
}

export interface BrainStatus {
  status: 'connected' | 'processing' | 'reconnecting';
  queueLength: number;
  activeJobs: number;
  totalProcessed: number;
  currentModel: string;
  latencyMs: number;
  resilientPool: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  voiceAutoSpeak: boolean;
  voiceMuted: boolean;
  language: string;
  enterToSend: boolean;
  showTimestamps: boolean;
  responseStyle: 'balanced' | 'concise' | 'detailed' | 'socratic';
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: number;
  updatedAt: number;
  preferences: UserPreferences;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount?: number;
  lastMessage?: string;
}

export interface SearchHistoryItem {
  id: string;
  userId: string;
  query: string;
  createdAt: number;
}

