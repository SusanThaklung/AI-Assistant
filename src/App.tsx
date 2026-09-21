/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ChatMessage as IChatMessage,
  CharacterExpression,
  UserMemory,
  StudyGoal,
  StudySubject,
  Attachment,
  BrainStatus,
  UserProfile,
  Conversation,
  SearchHistoryItem,
} from './types';
import { NovaAvatar } from './components/NovaAvatar';
import { ChatMessage } from './components/ChatMessage';
import { AttachmentBar } from './components/AttachmentBar';
import { StudyCompanionTools } from './components/StudyCompanionTools';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { RenameModal } from './components/RenameModal';
import { useVoice } from './hooks/useVoice';
import { api } from './services/api';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Paperclip,
  PanelRight,
  User,
  Bot,
  AlertCircle,
  Cpu,
  Layers,
  X,
  Menu,
  Edit2,
  Sun,
  Moon,
  MessageSquare,
} from 'lucide-react';

export default function App() {
  // Authentication & User State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Conversation & Database State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [renamingConv, setRenamingConv] = useState<{ id: string; title: string } | null>(null);

  // Layout & Navigation State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBrainModal, setShowBrainModal] = useState(false);
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);
  const [showFullAvatarStage, setShowFullAvatarStage] = useState(true);
  const [activeSubject, setActiveSubject] = useState<StudySubject>('programming');

  // Messages state
  const [messages, setMessages] = useState<IChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Namaste! I am **NOVA**, your intelligent personal AI assistant and study companion.\n\nI can help you across **Mathematics, Physics, Chemistry, Biology, Computer Science, Programming, AI, Engineering, General Science**, and everyday questions—providing step-by-step calculations, clear concept explanations, and practical project guidance in **English, Nepali, or Romanized Nepali**.\n\nWhat would you like to explore or work on today?`,
      timestamp: Date.now(),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [characterExpression, setCharacterExpression] = useState<CharacterExpression>('idle');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [brainStatus, setBrainStatus] = useState<BrainStatus | null>(null);
  const [brainPhase, setBrainPhase] = useState<'idle' | 'queued' | 'reasoning'>('idle');

  // Conversation Memory State
  const [memory, setMemory] = useState<UserMemory>(() => {
    const saved = localStorage.getItem('nova_user_memory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      userName: '',
      goals: ['Master async/await in JavaScript', 'Build a personal portfolio project'],
      activeProjects: ['AI Study Companion App'],
      preferredLanguage: 'auto',
    };
  });

  // Study Goals state
  const [goals, setGoals] = useState<StudyGoal[]>(() => {
    const saved = localStorage.getItem('nova_study_goals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: '1', title: 'Learn JavaScript Array methods (map, filter, reduce)', subject: 'programming', completed: false, createdAt: Date.now() },
      { id: '2', title: 'Understand Newton’s laws of motion', subject: 'physics', completed: true, createdAt: Date.now() - 86400000 },
    ];
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Voice Interaction Hook
  const voice = useVoice();

  // Load authenticated user on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('nova_auth_token');
      if (token) {
        try {
          const res = await api.auth.me();
          setCurrentUser(res.user);
          if (res.user.preferences) {
            voice.setSettings((prev) => ({
              ...prev,
              autoSpeak: res.user.preferences.voiceAutoSpeak ?? prev.autoSpeak,
              isMuted: res.user.preferences.voiceMuted ?? prev.isMuted,
            }));
          }
        } catch {
          localStorage.removeItem('nova_auth_token');
        }
      }
    };
    checkAuth();
  }, []);

  // Fetch conversations and search history whenever currentUser changes
  const loadConversations = async () => {
    if (currentUser) {
      try {
        const res = await api.conversations.list();
        setConversations(res.conversations);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      }
    } else {
      setConversations([]);
    }
  };

  const loadSearchHistory = async () => {
    if (currentUser) {
      try {
        const res = await api.searchHistory.list(20);
        setSearchHistory(res.history);
      } catch (err) {
        console.error('Failed to load search history:', err);
      }
    } else {
      setSearchHistory([]);
    }
  };

  useEffect(() => {
    loadConversations();
    loadSearchHistory();
  }, [currentUser]);

  // Telemetry fetch
  useEffect(() => {
    let isMounted = true;
    const fetchBrainStatus = async () => {
      try {
        const res = await fetch('/api/brain/status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setBrainStatus(data);
        }
      } catch {}
    };
    fetchBrainStatus();
    const interval = setInterval(fetchBrainStatus, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Handle switching conversations
  const handleSelectConversation = async (convId: string) => {
    try {
      setActiveConversationId(convId);
      voice.stopSpeaking();
      const data = await api.conversations.get(convId);
      if (data.messages && data.messages.length > 0) {
        setMessages(
          data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.createdAt,
            attachments: m.attachments,
            status: 'sent',
          }))
        );
      } else {
        setMessages([
          {
            id: `start-${convId}`,
            role: 'assistant',
            content: `This conversation "${data.conversation.title}" is ready. What would you like to study or discuss?`,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    voice.stopSpeaking();
    setMessages([
      {
        id: `new-chat-${Date.now()}`,
        role: 'assistant',
        content: `Namaste! I am **NOVA**, your intelligent personal AI assistant and study companion.\n\nWhat would you like to explore or work on today?`,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const res = await api.conversations.rename(id, newTitle);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: res.conversation.title } : c))
      );
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.conversations.delete(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleDeleteSearchItem = async (id: string) => {
    try {
      await api.searchHistory.delete(id);
      setSearchHistory((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete search item:', err);
    }
  };

  const handleClearSearchHistory = async () => {
    try {
      await api.searchHistory.clear();
      setSearchHistory([]);
    } catch (err) {
      console.error('Failed to clear search history:', err);
    }
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setCurrentUser(null);
    setActiveConversationId(null);
    handleNewChat();
  };

  // Sending a message
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt !== undefined ? customPrompt : inputPrompt;
    if ((!textToSend.trim() && pendingAttachments.length === 0) || isThinking) {
      return;
    }

    voice.stopSpeaking();

    const userMessage: IChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now(),
      attachments: [...pendingAttachments],
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt('');
    setPendingAttachments([]);
    setIsThinking(true);
    setBrainPhase('queued');
    setCharacterExpression('thinking');

    const assistantMessageId = Math.random().toString(36).substring(7);
    const placeholderMessage: IChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'sending',
    };

    setMessages([...newMessages, placeholderMessage]);

    try {
      abortControllerRef.current = new AbortController();

      const token = localStorage.getItem('nova_auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: newMessages,
          currentMemory: memory,
          conversationId: activeConversationId,
          userPreferences: {
            subject: activeSubject,
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not available in response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.status === 'connected_to_brain') {
                setBrainPhase('reasoning');
                if (parsed.conversationId && parsed.conversationId !== activeConversationId) {
                  setActiveConversationId(parsed.conversationId);
                }
              }
              if (parsed.text) {
                setBrainPhase('reasoning');
                accumulatedContent += parsed.text;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent, status: 'sent' }
                      : msg
                  )
                );
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {}
          }
        }
      }

      if (!accumulatedContent.trim()) {
        accumulatedContent = "Hello! I'm NOVA, connected to the AI Queue Brain. How can I help you today?";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedContent, status: 'sent' }
              : msg
          )
        );
      }

      setBrainPhase('idle');
      setIsThinking(false);
      setCharacterExpression('happy');

      // Refresh conversations list and search history for logged in user
      if (currentUser) {
        loadConversations();
        loadSearchHistory();
      }

      // Auto speak response if enabled and not keeping quiet
      if (voice.settings.autoSpeak && !voice.settings.isMuted && accumulatedContent) {
        setSpeakingMessageId(assistantMessageId);
        voice.speak(accumulatedContent);
      }

      setTimeout(() => setCharacterExpression('idle'), 3500);
    } catch (err: any) {
      setBrainPhase('idle');
      if (err.name === 'AbortError') {
        console.log('Chat generation aborted.');
      } else {
        console.error('Error in chat generation with AI Queue Brain:', err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: "⚠️ The AI Queue Brain encountered a momentary connection interruption. Tap retry to send again.",
                  status: 'error',
                }
              : msg
          )
        );
      }
      setIsThinking(false);
      setCharacterExpression('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImg = file.type.startsWith('image/');

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (isImg) {
          const base64Data = result.split(',')[1];
          setPendingAttachments((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              name: file.name,
              type: file.type,
              size: file.size,
              previewUrl: result,
              base64Data,
            },
          ]);
        } else {
          setPendingAttachments((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              name: file.name,
              type: file.type || 'text/plain',
              size: file.size,
              content: result,
            },
          ]);
        }
      };

      if (isImg) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Find active conversation title
  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const activeTitle = activeConv ? activeConv.title : 'New Chat';

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-neutral-100 font-sans antialiased overflow-hidden">
      {/* SIDEBAR */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRenameConversation={(id, title) => setRenamingConv({ id, title })}
        onDeleteConversation={handleDeleteConversation}
        searchHistory={searchHistory}
        onSelectSearchQuery={(query) => {
          setInputPrompt(query);
          handleSendMessage(query);
        }}
        onDeleteSearchItem={handleDeleteSearchItem}
        onClearSearchHistory={handleClearSearchHistory}
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthMode('login');
          setShowAuthModal(true);
        }}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onLogout={handleLogout}
      />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-neutral-900 text-neutral-100 overflow-hidden">
        {/* HEADER BAR */}
        <header className="h-14 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Sidebar toggle button */}
            <button
              id="header-sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors shrink-0"
              title="Toggle sidebar conversations"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Conversation Title & Rename trigger */}
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-sm sm:text-base text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                {activeTitle}
              </span>
              {activeConversationId && (
                <button
                  onClick={() => setRenamingConv({ id: activeConversationId, title: activeTitle })}
                  className="p-1 text-neutral-500 hover:text-neutral-300 rounded-md"
                  title="Rename chat"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* AI Queue Brain Status Badge */}
            <button
              onClick={() => setShowBrainModal(!showBrainModal)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 transition-all cursor-pointer"
              title="Click to view AI Queue Brain status"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline font-semibold">AI Brain</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Nepali Language Mode Toggle */}
            <button
              onClick={() => {
                const next = voice.settings.speechLanguage === 'ne-NP' ? 'en-US' : 'ne-NP';
                voice.setSettings((prev) => ({ ...prev, speechLanguage: next }));
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                voice.settings.speechLanguage === 'ne-NP'
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300 font-semibold'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400'
              }`}
              title="Toggle Nepali Voice & Language Mode (नेपाली / Romanized Nepali)"
            >
              <span>🇳🇵</span>
              <span className="hidden sm:inline">
                {voice.settings.speechLanguage === 'ne-NP' ? 'नेपाली' : 'Nepali'}
              </span>
            </button>

            {/* Voice Reply Mode: Speak Aloud vs Keep Quiet */}
            <div className="hidden sm:flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => {
                  voice.setSettings((prev) => ({ ...prev, autoSpeak: true, isMuted: false }));
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  voice.settings.autoSpeak && !voice.settings.isMuted
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Speak responses aloud with voice"
              >
                <Volume2 className="w-3 h-3" />
                <span>Speak</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  voice.stopSpeaking();
                  voice.setSettings((prev) => ({ ...prev, autoSpeak: false, isMuted: true }));
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  !voice.settings.autoSpeak || voice.settings.isMuted
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Keep quiet when replying (silent text only)"
              >
                <VolumeX className="w-3 h-3" />
                <span>Quiet</span>
              </button>
            </div>

            {/* Toggle Companion Avatar Stage */}
            <button
              onClick={() => setShowFullAvatarStage(!showFullAvatarStage)}
              className={`p-2 rounded-lg text-xs transition-colors hidden lg:flex ${
                showFullAvatarStage
                  ? 'bg-neutral-800 text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
              }`}
              title="Toggle Virtual Companion Stage"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </button>

            {/* Study Tools Drawer Toggle */}
            <button
              onClick={() => setShowToolsDrawer(!showToolsDrawer)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showToolsDrawer
                  ? 'bg-neutral-800 text-white'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
              title="Open Study Tools & Practice Tasks"
            >
              <PanelRight className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tools</span>
            </button>

            {/* User Profile or Sign In */}
            {currentUser ? (
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs ml-1"
                title={`${currentUser.username} - Profile`}
              >
                {currentUser.username.charAt(0)}
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-xs ml-1"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* LEFT: COMPANION AVATAR STAGE (Desktop) */}
          {showFullAvatarStage && (
            <aside className="w-72 xl:w-80 border-r border-neutral-800 bg-neutral-950/40 backdrop-blur-xs flex flex-col justify-between p-4 hidden lg:flex shrink-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Virtual Companion
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full font-medium border border-emerald-800">
                    Online
                  </span>
                </div>

                {/* Avatar Stage Box */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-md">
                  <NovaAvatar
                    expression={characterExpression}
                    isSpeaking={voice.isSpeaking}
                    isListening={voice.isListening}
                    isThinking={isThinking}
                    size="lg"
                    onTap={() => {
                      setCharacterExpression((prev) => (prev === 'happy' ? 'idle' : 'happy'));
                      voice.speak("Hello! I'm here and ready to help you study.");
                    }}
                  />

                  <div className="mt-4 text-center">
                    <h2 className="text-sm font-bold text-white tracking-tight">NOVA</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {voice.isSpeaking
                        ? 'Speaking response...'
                        : voice.isListening
                        ? 'Listening to speech...'
                        : isThinking
                        ? 'Formulating step-by-step guidance...'
                        : 'Ready for study & coding'}
                    </p>
                  </div>
                </div>

                {/* Voice Reply Mode Quick Controls in Avatar Stage */}
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-200">Voice Reply Mode</span>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="text-[10px] text-indigo-400 hover:underline"
                    >
                      Preferences
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        voice.setSettings((prev) => ({ ...prev, autoSpeak: true, isMuted: false }));
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                        voice.settings.autoSpeak && !voice.settings.isMuted
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Speak Aloud</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        voice.stopSpeaking();
                        voice.setSettings((prev) => ({ ...prev, autoSpeak: false, isMuted: true }));
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                        !voice.settings.autoSpeak || voice.settings.isMuted
                          ? 'border-neutral-700 bg-neutral-800 text-white'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Keep Quiet</span>
                    </button>
                  </div>
                </div>

                {/* Study Subject Quick Selector */}
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium">
                    <span>Study Subject:</span>
                    <span className="text-indigo-400 font-semibold uppercase">{activeSubject}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Explanations are calibrated with simple examples, small tasks, and debugging steps.
                  </p>
                </div>
              </div>

              {/* Bilingual Nepali Banner */}
              <div className="pt-3 border-t border-neutral-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1">
                    <span>🇳🇵</span>
                    <span>Nepali &amp; English</span>
                  </span>
                  <span className="text-[10px] text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800">
                    Bilingual AI
                  </span>
                </div>
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => handleSendMessage('Newton ko second law vaneko k ho?')}
                    className="text-left px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-[10px] text-neutral-300 border border-neutral-800 transition-colors"
                  >
                    👉 &quot;Newton ko second law vaneko k ho?&quot;
                  </button>
                  <button
                    onClick={() => handleSendMessage('JavaScript ma async await kasari kaam garcha? Code example sahit bujhaideu.')}
                    className="text-left px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-[10px] text-neutral-300 border border-neutral-800 transition-colors"
                  >
                    👉 &quot;JavaScript ma async await kasari kaam garcha?&quot;
                  </button>
                </div>
              </div>
            </aside>
          )}

          {/* CENTER: CHAT MESSAGE STREAM */}
          <main className="flex-1 flex flex-col h-full bg-neutral-900/50 relative overflow-hidden">
            {/* Scrollable Messages Area */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 max-w-4xl w-full mx-auto"
            >
              {messages.map((msg) => (
                <div key={msg.id} className="relative group/msg">
                  <ChatMessage
                    message={msg}
                    onSpeak={(text) => {
                      setSpeakingMessageId(msg.id);
                      voice.speak(text);
                    }}
                    isSpeakingThis={speakingMessageId === msg.id && voice.isSpeaking}
                    onStopSpeaking={() => voice.stopSpeaking()}
                  />
                </div>
              ))}

              {/* Thinking / Streaming Indicator */}
              {isThinking && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 max-w-md animate-pulse">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-200">
                      {brainPhase === 'queued'
                        ? 'NOVA is preparing reasoning pipeline...'
                        : 'NOVA is formulating step-by-step explanation...'}
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Orchestrating through AI Queue Brain
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Input Composer Box */}
            <div className="p-3 sm:p-4 bg-neutral-950/90 border-t border-neutral-800 shrink-0">
              <div className="max-w-4xl mx-auto space-y-2">
                {/* Pending attachments preview */}
                <AttachmentBar
                  attachments={pendingAttachments}
                  onAddAttachment={(att) => setPendingAttachments((prev) => [...prev, att])}
                  onRemoveAttachment={(id: string) => setPendingAttachments((prev) => prev.filter((a) => a.id !== id))}
                />

                {/* Input row */}
                <div className="relative flex items-end gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                  {/* File upload hidden input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelected}
                    multiple
                    accept="image/*,.js,.ts,.tsx,.py,.html,.css,.json,.txt,.md,.pdf"
                    className="hidden"
                  />

                  {/* Attachment button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors shrink-0"
                    title="Attach image, code file, or document"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Textarea */}
                  <textarea
                    id="chat-message-input"
                    rows={1}
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask NOVA anything in English, Nepali, or code..."
                    className="flex-1 bg-transparent border-none resize-none text-sm text-white placeholder-neutral-500 focus:outline-hidden py-2 px-1 max-h-32 min-h-[40px]"
                  />

                  {/* Voice Mic button */}
                  <button
                    type="button"
                    onClick={voice.isListening ? () => voice.stopListening() : () => voice.startListening()}
                    className={`p-2 rounded-xl transition-all shrink-0 ${
                      voice.isListening
                        ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`}
                    title={voice.isListening ? 'Listening... click to stop' : 'Speech-to-text voice input'}
                  >
                    {voice.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Send button */}
                  <button
                    id="chat-send-btn"
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={isThinking || (!inputPrompt.trim() && pendingAttachments.length === 0)}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs"
                    title="Send message (Enter)"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
                  <span>Shift + Enter for new line • Multi-modal support</span>
                  {currentUser ? (
                    <span className="text-indigo-400 font-mono text-[10px]">Saved to Account</span>
                  ) : (
                    <span className="text-amber-400/90 text-[10px]">Guest Session</span>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* RIGHT: STUDY TOOLS & MEMORY DRAWER */}
          {showToolsDrawer && (
            <aside className="w-80 border-l border-neutral-800 bg-neutral-950/80 backdrop-blur-md flex flex-col p-4 z-20 shrink-0">
              <StudyCompanionTools
                memory={memory}
                onUpdateMemory={(mem) => setMemory(mem)}
                goals={goals}
                onAddGoal={(title: string, subject: string) =>
                  setGoals((prev) => [
                    ...prev,
                    {
                      id: Math.random().toString(36).substring(7),
                      title,
                      subject: subject as StudySubject,
                      completed: false,
                      createdAt: Date.now(),
                    },
                  ])
                }
                onToggleGoal={(id: string) =>
                  setGoals((prev) =>
                    prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
                  )
                }
                onDeleteGoal={(id: string) =>
                  setGoals((prev) => prev.filter((g) => g.id !== id))
                }
                onSelectSubjectPrompt={(prompt: string) => {
                  setInputPrompt(prompt);
                  handleSendMessage(prompt);
                }}
                activeSubject={activeSubject}
                onSubjectChange={(subj: StudySubject) => setActiveSubject(subj)}
                onClose={() => setShowToolsDrawer(false)}
                voiceSettings={voice.settings}
                onSetVoiceSettings={voice.setSettings}
                onStopSpeaking={voice.stopSpeaking}
              />
            </aside>
          )}
        </div>
      </div>

      {/* MODALS */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        onSuccess={(user) => {
          setCurrentUser(user);
          loadConversations();
          loadSearchHistory();
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentUser={currentUser}
        onUserUpdate={(u) => setCurrentUser(u)}
        voiceSettings={voice.settings}
        onUpdateVoiceSettings={(settings) =>
          voice.setSettings((prev) => ({ ...prev, ...settings }))
        }
        onClearCurrentChat={handleNewChat}
        onLogout={handleLogout}
      />

      <RenameModal
        isOpen={renamingConv !== null}
        onClose={() => setRenamingConv(null)}
        conversationId={renamingConv?.id || null}
        currentTitle={renamingConv?.title || ''}
        onSave={handleRenameConversation}
      />

      {/* USER PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-200">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase">
                  {currentUser?.username.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {currentUser ? currentUser.username : 'User Profile'}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    {currentUser ? currentUser.email : 'Guest Session'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Voice Reply Mode: Speak vs Keep Quiet */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs">When Replying to Messages</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      voice.settings.autoSpeak && !voice.settings.isMuted
                        ? 'bg-indigo-900/60 text-indigo-300'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {voice.settings.autoSpeak && !voice.settings.isMuted ? '🗣️ Speak Active' : '🤫 Quiet Active'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Control whether NOVA automatically speaks aloud when giving study explanations or stays quiet.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      voice.setSettings((prev) => ({ ...prev, autoSpeak: true, isMuted: false }));
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      voice.settings.autoSpeak && !voice.settings.isMuted
                        ? 'border-indigo-500 bg-indigo-600 text-white shadow-xs'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <Volume2 className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">Speak Aloud</span>
                    <span className="text-[10px] text-indigo-200 mt-0.5">Reads reply aloud</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      voice.stopSpeaking();
                      voice.setSettings((prev) => ({ ...prev, autoSpeak: false, isMuted: true }));
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      !voice.settings.autoSpeak || voice.settings.isMuted
                        ? 'border-neutral-700 bg-neutral-800 text-white shadow-xs'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <VolumeX className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">Keep Quiet</span>
                    <span className="text-[10px] text-neutral-400 mt-0.5">Silent text only</span>
                  </button>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                  <span className="text-neutral-500 block text-[10px]">Saved Conversations</span>
                  <span className="text-base font-bold text-white">{conversations.length}</span>
                </div>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                  <span className="text-neutral-500 block text-[10px]">Search Queries</span>
                  <span className="text-base font-bold text-white">{searchHistory.length}</span>
                </div>
              </div>

              {/* Account Actions */}
              <div className="flex gap-2 pt-2">
                {currentUser ? (
                  <>
                    <button
                      onClick={() => {
                        setShowProfileModal(false);
                        setShowSettingsModal(true);
                      }}
                      className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition-colors"
                    >
                      Account Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileModal(false);
                        handleLogout();
                      }}
                      className="py-2 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs font-medium transition-colors"
                    >
                      Log Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                  >
                    Sign In or Create Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
