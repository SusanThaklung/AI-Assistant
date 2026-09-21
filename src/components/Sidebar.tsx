import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Clock,
  Settings,
  LogOut,
  User as UserIcon,
  LogIn,
  X,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Conversation, SearchHistoryItem, UserProfile } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, currentTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  searchHistory: SearchHistoryItem[];
  onSelectSearchQuery: (query: string) => void;
  onDeleteSearchItem: (id: string) => void;
  onClearSearchHistory: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  searchHistory,
  onSelectSearchQuery,
  onDeleteSearchItem,
  onClearSearchHistory,
  currentUser,
  onOpenAuth,
  onOpenSettings,
  onOpenProfile,
  onLogout,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [showSearches, setShowSearches] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Group conversations chronologically
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * ONE_DAY;

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const groups: { title: string; items: Conversation[] }[] = [
    {
      title: 'Today',
      items: filtered.filter((c) => now - c.updatedAt < ONE_DAY),
    },
    {
      title: 'Yesterday',
      items: filtered.filter((c) => now - c.updatedAt >= ONE_DAY && now - c.updatedAt < 2 * ONE_DAY),
    },
    {
      title: 'Previous 7 Days',
      items: filtered.filter((c) => now - c.updatedAt >= 2 * ONE_DAY && now - c.updatedAt < SEVEN_DAYS),
    },
    {
      title: 'Older',
      items: filtered.filter((c) => now - c.updatedAt >= SEVEN_DAYS),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 sm:w-80 bg-neutral-900 text-neutral-200 border-r border-neutral-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${!isOpen ? 'lg:hidden' : ''}`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-950">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
                <span>NOVA</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                  AI Brain
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Study Companion & Assistant</p>
            </div>
          </div>
          <button
            id="close-sidebar-btn"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors lg:hidden"
            title="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: New Chat */}
        <div className="p-3">
          <button
            id="sidebar-new-chat-btn"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-sm hover:shadow-indigo-900/30 active:scale-[0.99]"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </span>
            <span className="text-[11px] text-indigo-200 bg-indigo-700/60 px-2 py-0.5 rounded-md font-mono">
              + New
            </span>
          </button>
        </div>

        {/* Filter / Search input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              id="sidebar-search-input"
              type="text"
              placeholder="Search conversations..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-neutral-950/70 border border-neutral-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-neutral-600 stroke-[1.5]" />
              <p>No conversations yet.</p>
              <p className="mt-1 text-neutral-600">Start a chat with NOVA to save your study sessions.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-500">
              <p>No chats match "{filterQuery}".</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-2.5 py-1 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                  {group.title}
                </div>
                {group.items.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  const isConfirmingDelete = deleteConfirmId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-neutral-800 text-white font-medium shadow-xs'
                          : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                      }`}
                    >
                      <button
                        onClick={() => {
                          onSelectConversation(conv.id);
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className="flex-1 flex items-center gap-2.5 min-w-0 text-left"
                      >
                        <MessageSquare
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-indigo-400' : 'text-neutral-500 group-hover:text-neutral-400'
                          }`}
                        />
                        <span className="truncate">{conv.title || 'Untitled Chat'}</span>
                      </button>

                      {/* Action buttons (Rename & Delete) */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-red-950/80 p-1 rounded-md border border-red-800">
                            <span className="text-[10px] text-red-300">Delete?</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation(conv.id);
                                setDeleteConfirmId(null);
                              }}
                              className="p-1 hover:bg-red-800 text-white rounded-xs"
                              title="Confirm delete"
                            >
                              <Trash2 className="w-3 h-3 text-red-300" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(null);
                              }}
                              className="p-1 hover:bg-neutral-800 text-neutral-400 rounded-xs"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRenameConversation(conv.id, conv.title);
                              }}
                              className="p-1 text-neutral-400 hover:text-indigo-300 hover:bg-neutral-700/50 rounded-md transition-colors"
                              title="Rename chat"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(conv.id);
                              }}
                              className="p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-700/50 rounded-md transition-colors"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}

          {/* Recent Search History Section */}
          <div className="pt-2 border-t border-neutral-800/80">
            <button
              id="sidebar-toggle-searches-btn"
              onClick={() => setShowSearches(!showSearches)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 rounded-lg transition-colors"
            >
              <span className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <span className="font-semibold uppercase tracking-wider text-[10px] text-neutral-500">
                  Recent Searches
                </span>
                {searchHistory.length > 0 && (
                  <span className="bg-neutral-800 text-neutral-400 text-[10px] px-1.5 py-0.2 rounded-full">
                    {searchHistory.length}
                  </span>
                )}
              </span>
              {showSearches ? (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
              )}
            </button>

            {showSearches && (
              <div className="mt-1 space-y-1 pl-2">
                {searchHistory.length === 0 ? (
                  <div className="p-2 text-[11px] text-neutral-500 italic">No recent searches.</div>
                ) : (
                  <>
                    <div className="flex justify-end px-2 py-0.5">
                      <button
                        onClick={onClearSearchHistory}
                        className="text-[10px] text-neutral-500 hover:text-red-400 transition-colors"
                      >
                        Clear history
                      </button>
                    </div>
                    <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                      {searchHistory.map((item) => (
                        <div
                          key={item.id}
                          className="group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200 transition-colors"
                        >
                          <button
                            onClick={() => {
                              onSelectSearchQuery(item.query);
                              if (window.innerWidth < 1024) onClose();
                            }}
                            className="flex-1 text-left truncate flex items-center gap-2"
                          >
                            <Search className="w-3 h-3 text-neutral-600 shrink-0" />
                            <span className="truncate">{item.query}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSearchItem(item.id);
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 rounded-md transition-all"
                            title="Delete query"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Profile & Account Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/40">
          {currentUser ? (
            <div className="flex items-center justify-between">
              <button
                id="sidebar-user-profile-btn"
                onClick={onOpenProfile}
                className="flex items-center gap-2.5 min-w-0 text-left p-1.5 rounded-xl hover:bg-neutral-800/70 transition-colors flex-1"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 text-white font-bold text-xs flex items-center justify-center shadow-xs uppercase">
                  {currentUser.username.charAt(0) || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white truncate">{currentUser.username}</p>
                  <p className="text-[10px] text-neutral-500 truncate">{currentUser.email}</p>
                </div>
              </button>

              <div className="flex items-center gap-0.5">
                <button
                  id="sidebar-settings-btn"
                  onClick={onOpenSettings}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  id="sidebar-logout-btn"
                  onClick={onLogout}
                  className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] text-neutral-400 px-1">
                Guest Mode. Sign in to save chats across devices.
              </div>
              <button
                id="sidebar-auth-btn"
                onClick={onOpenAuth}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition-colors border border-neutral-700/60"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sign In or Register</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
