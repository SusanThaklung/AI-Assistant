import React, { useState } from 'react';
import {
  X,
  Sliders,
  Moon,
  Sun,
  Laptop,
  MessageSquare,
  Sparkles,
  Shield,
  Volume2,
  VolumeX,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { UserProfile, VoiceSettings } from '../types';
import { api } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserUpdate: (updatedUser: UserProfile) => void;
  voiceSettings: VoiceSettings;
  onUpdateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  onClearCurrentChat: () => void;
  onLogout: () => void;
}

type TabType = 'appearance' | 'chat' | 'ai_voice' | 'account';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  voiceSettings,
  onUpdateVoiceSettings,
  onClearCurrentChat,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('appearance');

  // Appearance state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    currentUser?.preferences?.theme || 'dark'
  );

  // Chat settings
  const [enterToSend, setEnterToSend] = useState<boolean>(
    currentUser?.preferences?.enterToSend ?? true
  );
  const [showTimestamps, setShowTimestamps] = useState<boolean>(
    currentUser?.preferences?.showTimestamps ?? true
  );

  // AI settings
  const [responseStyle, setResponseStyle] = useState<'balanced' | 'concise' | 'detailed' | 'socratic'>(
    currentUser?.preferences?.responseStyle || 'balanced'
  );
  const [preferredLang, setPreferredLang] = useState<string>(
    currentUser?.preferences?.language || 'auto'
  );

  // Account password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSavePreferences = async (newPrefs: any) => {
    if (currentUser) {
      try {
        const res = await api.auth.updateProfile({ preferences: newPrefs });
        onUserUpdate(res.user);
      } catch (e) {
        console.error('Failed to sync preferences:', e);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.auth.changePassword({
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword,
      });
      setPasswordMsg({ type: 'success', text: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await api.auth.deleteAccount({ password: deletePassword });
      onLogout();
      onClose();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="settings-modal-card"
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] text-neutral-200"
      >
        {/* Sidebar Tabs */}
        <div className="w-full md:w-52 bg-neutral-950 border-b md:border-b-0 md:border-r border-neutral-800 p-4 shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-white text-sm tracking-tight">Settings</h2>
          </div>

          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'appearance'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Appearance</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Chat Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_voice')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'ai_voice'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>AI & Voice</span>
            </button>

            {currentUser && (
              <button
                onClick={() => setActiveTab('account')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'account'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Account & Security</span>
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-neutral-900">
          {/* Header */}
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white capitalize">
              {activeTab === 'ai_voice' ? 'AI Behavior & Voice Controls' : activeTab}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* TAB: APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-neutral-200 text-xs mb-1">Theme Mode</h4>
                  <p className="text-neutral-400 text-[11px] mb-3">
                    Choose the interface brightness and visual ambiance.
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Eye-friendly twilight' },
                      { id: 'light', label: 'Light Mode', icon: Sun, desc: 'Crisp bright paper' },
                      { id: 'system', label: 'System', icon: Laptop, desc: 'Sync with OS' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = theme === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setTheme(item.id as any);
                            handleSavePreferences({ theme: item.id });
                          }}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-950/30 text-white ring-1 ring-indigo-500'
                              : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-indigo-400' : 'text-neutral-500'}`} />
                          <div>
                            <div className="font-semibold text-xs text-white">{item.label}</div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">{item.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CHAT SETTINGS */}
            {activeTab === 'chat' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-xl">
                  <div>
                    <div className="font-semibold text-white text-xs">Enter to Send Message</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Pressing Enter sends the message; Shift + Enter creates a new line.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enterToSend}
                    onChange={(e) => {
                      setEnterToSend(e.target.checked);
                      handleSavePreferences({ enterToSend: e.target.checked });
                    }}
                    className="w-4 h-4 rounded-sm bg-neutral-800 border-neutral-700 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-xl">
                  <div>
                    <div className="font-semibold text-white text-xs">Show Message Timestamps</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Display exact time stamps under user and AI messages.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showTimestamps}
                    onChange={(e) => {
                      setShowTimestamps(e.target.checked);
                      handleSavePreferences({ showTimestamps: e.target.checked });
                    }}
                    className="w-4 h-4 rounded-sm bg-neutral-800 border-neutral-700 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 border-t border-neutral-800">
                  <div className="font-semibold text-white text-xs mb-1">Clear Current Conversation</div>
                  <p className="text-[11px] text-neutral-400 mb-3">
                    Erase all messages in the currently open chat session.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear the messages in this chat?')) {
                        onClearCurrentChat();
                        onClose();
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-red-950/60 text-red-300 border border-neutral-700 hover:border-red-800 text-xs font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Messages Now</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: AI BEHAVIOR & VOICE */}
            {activeTab === 'ai_voice' && (
              <div className="space-y-5">
                {/* Voice reply behavior */}
                <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-3">
                  <div>
                    <div className="font-semibold text-white text-xs">Voice Reply Behavior</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Configure whether NOVA automatically speaks aloud when replying to messages.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onUpdateVoiceSettings({ autoSpeak: true, isMuted: false })}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        voiceSettings.autoSpeak && !voiceSettings.isMuted
                          ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <Volume2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-white">Speak Aloud</div>
                        <div className="text-[10px] text-neutral-400">Read assistant replies aloud</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateVoiceSettings({ autoSpeak: false, isMuted: true })}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        !voiceSettings.autoSpeak || voiceSettings.isMuted
                          ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <VolumeX className="w-5 h-5 text-neutral-400 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-white">Keep Quiet</div>
                        <div className="text-[10px] text-neutral-400">Silent text-only replies</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Response Style */}
                <div>
                  <div className="font-semibold text-white text-xs mb-1">Response Style</div>
                  <div className="text-[11px] text-neutral-400 mb-2.5">
                    Choose how NOVA formats its answers and explanations.
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'balanced', label: 'Balanced', desc: 'Friendly, helpful and clear' },
                      { id: 'concise', label: 'Concise & Direct', desc: 'Brief answers with no fluff' },
                      { id: 'detailed', label: 'Detailed & In-Depth', desc: 'Full breakdowns & examples' },
                      { id: 'socratic', label: 'Socratic Tutor', desc: 'Guides you with questions' },
                    ].map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => {
                          setResponseStyle(style.id as any);
                          handleSavePreferences({ responseStyle: style.id });
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          responseStyle === style.id
                            ? 'border-indigo-500 bg-indigo-950/30 text-white ring-1 ring-indigo-500'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <div className="font-semibold text-xs text-white">{style.label}</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">{style.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Preference */}
                <div>
                  <div className="font-semibold text-white text-xs mb-1">Language Preference</div>
                  <div className="text-[11px] text-neutral-400 mb-2">
                    Primary language for replies and study guidance.
                  </div>
                  <select
                    value={preferredLang}
                    onChange={(e) => {
                      setPreferredLang(e.target.value);
                      handleSavePreferences({ language: e.target.value });
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="auto">Auto-Detect (Matches your input)</option>
                    <option value="en">English (US)</option>
                    <option value="np">Nepali - नेपाली</option>
                    <option value="romanized-np">Romanized Nepali</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB: ACCOUNT & SECURITY */}
            {activeTab === 'account' && currentUser && (
              <div className="space-y-6">
                {/* Account Details */}
                <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-xl">
                  <h4 className="font-semibold text-white text-xs mb-2">Profile Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-neutral-500 block text-[10px]">Username</span>
                      <span className="text-white font-medium">{currentUser.username}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px]">Email</span>
                      <span className="text-white font-medium">{currentUser.email}</span>
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <h4 className="font-semibold text-white text-xs">Change Password</h4>

                  {passwordMsg && (
                    <div
                      className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                        passwordMsg.type === 'success'
                          ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                          : 'bg-red-950/60 border border-red-800 text-red-200'
                      }`}
                    >
                      {passwordMsg.type === 'success' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span>{passwordMsg.text}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors disabled:opacity-50"
                  >
                    {passwordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Update Password</span>
                  </button>
                </form>

                {/* Danger Zone */}
                <div className="pt-4 border-t border-red-950/60">
                  <h4 className="font-semibold text-red-400 text-xs mb-1">Danger Zone</h4>
                  <p className="text-neutral-400 text-[11px] mb-3">
                    Permanently delete your user account and all saved chats.
                  </p>

                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs font-medium transition-colors"
                    >
                      Delete NOVA Account
                    </button>
                  ) : (
                    <div className="p-3 bg-red-950/30 border border-red-800/80 rounded-xl space-y-2">
                      <p className="text-xs text-red-200">
                        This action cannot be undone. Please confirm your password to delete:
                      </p>
                      {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
                      <input
                        type="password"
                        placeholder="Enter your account password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full bg-neutral-950 border border-red-900/80 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium"
                        >
                          {deleteLoading ? 'Deleting...' : 'Confirm Permanent Deletion'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
