/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { ChatMessage as IChatMessage } from '../types';
import { Copy, Check, Volume2, VolumeX, FileCode, Image as ImageIcon, Sparkles, User } from 'lucide-react';

interface ChatMessageProps {
  message: IChatMessage;
  onSpeak?: (text: string) => void;
  isSpeakingThis?: boolean;
  onStopSpeaking?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSpeak,
  isSpeakingThis = false,
  onStopSpeaking,
}) => {
  const isUser = message.role === 'user';
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`group flex w-full gap-3 py-3 px-2 sm:px-4 transition-colors ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar Icon */}
      <div className="flex-shrink-0 pt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-100 flex items-center justify-center shadow-xs">
            <User className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Message Content Container */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Author Label & Time */}
        <div className="flex items-center gap-2 mb-1 text-[11px] text-neutral-400 font-medium px-1">
          <span>{isUser ? 'You' : 'NOVA'}</span>
          <span>•</span>
          <span>{formatTime(message.timestamp)}</span>
          {!isUser && onSpeak && (
            <button
              onClick={() => (isSpeakingThis && onStopSpeaking ? onStopSpeaking() : onSpeak(message.content))}
              className="inline-flex items-center gap-1 ml-1 text-neutral-400 hover:text-indigo-600 transition-colors p-0.5 rounded cursor-pointer"
              title={isSpeakingThis ? 'Stop reading' : 'Read aloud with natural voice'}
            >
              {isSpeakingThis ? (
                <VolumeX className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Attachments preview if user attached images/files */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white shadow-2xs text-xs text-neutral-700"
              >
                {att.type.startsWith('image/') ? (
                  att.previewUrl ? (
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover rounded border border-neutral-100"
                    />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-sky-500" />
                  )
                ) : (
                  <FileCode className="w-4 h-4 text-emerald-600" />
                )}
                <span className="max-w-[140px] truncate font-medium">{att.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Main Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xs ${
            isUser
              ? 'bg-neutral-900 text-neutral-50 rounded-tr-xs'
              : 'bg-white border border-neutral-200/90 text-neutral-900 rounded-tl-xs'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <div className="prose prose-sm max-w-none prose-neutral prose-headings:font-semibold prose-headings:text-neutral-900 prose-p:my-1.5 prose-p:leading-relaxed prose-pre:my-2 prose-pre:p-0 prose-pre:bg-transparent">
              <Markdown
                components={{
                  code({ className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    const isInline = !match && !codeString.includes('\n');

                    if (isInline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 font-mono text-xs font-medium border border-neutral-200/60"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    const codeId = Math.random().toString(36).substring(7);
                    return (
                      <div className="my-3 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-950 text-neutral-100 shadow-sm">
                        <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-900/90 border-b border-neutral-800 text-[11px] text-neutral-400 font-mono">
                          <span>{match ? match[1] : 'code'}</span>
                          <button
                            onClick={() => copyToClipboard(codeString, codeId)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-neutral-800 text-neutral-300 transition-colors cursor-pointer"
                          >
                            {copiedCodeId === codeId ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-sans">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span className="font-sans">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed selection:bg-indigo-900 selection:text-white">
                          <pre className="m-0 bg-transparent text-neutral-200 font-mono">
                            <code>{codeString}</code>
                          </pre>
                        </div>
                      </div>
                    );
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>;
                  },
                  li({ children }) {
                    return <li className="my-0.5 leading-relaxed">{children}</li>;
                  },
                  p({ children }) {
                    return <p className="my-2 leading-relaxed">{children}</p>;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-4 border-indigo-500 pl-3 my-2 text-neutral-600 italic bg-neutral-50/80 py-1 rounded-r">
                        {children}
                      </blockquote>
                    );
                  },
                }}
              >
                {message.content}
              </Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
