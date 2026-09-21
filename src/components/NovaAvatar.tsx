/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CharacterExpression } from '../types';
import { Volume2, Mic, Sparkles, Brain, Moon } from 'lucide-react';

interface NovaAvatarProps {
  expression: CharacterExpression;
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  size?: 'sm' | 'md' | 'lg' | 'full';
  onTap?: () => void;
  className?: string;
}

export const NovaAvatar: React.FC<NovaAvatarProps> = ({
  expression,
  isSpeaking,
  isListening,
  isThinking,
  size = 'md',
  onTap,
  className = '',
}) => {
  // Blinking cycle state
  const [isBlinking, setIsBlinking] = useState(false);
  // Lip-sync frame counter for mouth movement while speaking
  const [mouthFrame, setMouthFrame] = useState(0);

  // Natural blinking effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        // Next blink between 2.5s and 5.5s
        const nextBlink = Math.random() * 3000 + 2500;
        timeoutId = setTimeout(triggerBlink, nextBlink);
      }, 160);
    };

    timeoutId = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(timeoutId);
  }, []);

  // Mouth animation when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthFrame(0);
      return;
    }

    const interval = setInterval(() => {
      setMouthFrame((prev) => (prev + 1) % 4);
    }, 140);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Derive current effective state
  const effectiveExpression: CharacterExpression = isListening
    ? 'listening'
    : isThinking
    ? 'thinking'
    : isSpeaking
    ? 'speaking'
    : expression;

  // Size styling classes
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48 sm:w-56 sm:h-56',
    full: 'w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72',
  }[size];

  // Expression eye rendering
  const renderEyes = () => {
    if (isBlinking && effectiveExpression !== 'sleep') {
      return (
        <g stroke="#262626" strokeWidth="2.5" strokeLinecap="round">
          <path d="M 64 88 Q 74 91 84 88" />
          <path d="M 116 88 Q 126 91 136 88" />
        </g>
      );
    }

    switch (effectiveExpression) {
      case 'happy':
      case 'encouraging':
        return (
          <g stroke="#262626" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M 63 90 Q 74 78 85 90" />
            <path d="M 115 90 Q 126 78 137 90" />
          </g>
        );
      case 'sleep':
        return (
          <g stroke="#525252" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <path d="M 64 91 Q 74 96 84 91" />
            <path d="M 116 91 Q 126 96 136 91" />
          </g>
        );
      case 'thinking':
        return (
          <g>
            {/* Left eye looking slightly upward */}
            <ellipse cx="74" cy="85" rx="8" ry="11" fill="#1e293b" />
            <ellipse cx="74" cy="84" rx="7" ry="10" fill="#38bdf8" />
            <circle cx="72" cy="81" r="3.5" fill="#ffffff" />
            <circle cx="76" cy="87" r="1.5" fill="#ffffff" />
            {/* Right eye */}
            <ellipse cx="126" cy="85" rx="8" ry="11" fill="#1e293b" />
            <ellipse cx="126" cy="84" rx="7" ry="10" fill="#38bdf8" />
            <circle cx="124" cy="81" r="3.5" fill="#ffffff" />
            <circle cx="128" cy="87" r="1.5" fill="#ffffff" />
            {/* Thinking eyebrow */}
            <path d="M 65 72 Q 75 70 85 75" stroke="#334155" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 115 75 Q 125 70 135 72" stroke="#334155" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        );
      case 'listening':
        return (
          <g>
            <ellipse cx="74" cy="87" rx="8.5" ry="11.5" fill="#0f172a" />
            <ellipse cx="74" cy="87" rx="7.5" ry="10.5" fill="#06b6d4" />
            <circle cx="71" cy="83" r="4" fill="#ffffff" />
            <circle cx="76" cy="90" r="1.8" fill="#cffafe" />
            <ellipse cx="126" cy="87" rx="8.5" ry="11.5" fill="#0f172a" />
            <ellipse cx="126" cy="87" rx="7.5" ry="10.5" fill="#06b6d4" />
            <circle cx="123" cy="83" r="4" fill="#ffffff" />
            <circle cx="128" cy="90" r="1.8" fill="#cffafe" />
          </g>
        );
      case 'surprised':
        return (
          <g>
            <circle cx="74" cy="86" r="9.5" fill="#1e293b" />
            <circle cx="74" cy="86" r="8" fill="#6366f1" />
            <circle cx="71" cy="82" r="3.5" fill="#ffffff" />
            <circle cx="126" cy="86" r="9.5" fill="#1e293b" />
            <circle cx="126" cy="86" r="8" fill="#6366f1" />
            <circle cx="123" cy="82" r="3.5" fill="#ffffff" />
            <path d="M 64 70 Q 74 66 84 70" stroke="#334155" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 116 70 Q 126 66 136 70" stroke="#334155" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        );
      default:
        // Idle / Speaking standard anime eyes
        return (
          <g>
            {/* Eye shadow line */}
            <path d="M 62 76 Q 74 71 86 77" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 114 77 Q 126 71 138 76" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Left Eye */}
            <ellipse cx="74" cy="87" rx="8" ry="11" fill="#0f172a" />
            <ellipse cx="74" cy="88" rx="7" ry="9" fill="#4f46e5" />
            <ellipse cx="74" cy="90" rx="5" ry="6" fill="#818cf8" />
            <circle cx="71" cy="83" r="3.5" fill="#ffffff" />
            <circle cx="76" cy="90" r="1.5" fill="#ffffff" />
            {/* Right Eye */}
            <ellipse cx="126" cy="87" rx="8" ry="11" fill="#0f172a" />
            <ellipse cx="126" cy="88" rx="7" ry="9" fill="#4f46e5" />
            <ellipse cx="126" cy="90" rx="5" ry="6" fill="#818cf8" />
            <circle cx="123" cy="83" r="3.5" fill="#ffffff" />
            <circle cx="128" cy="90" r="1.5" fill="#ffffff" />
          </g>
        );
    }
  };

  // Expression mouth rendering
  const renderMouth = () => {
    if (isSpeaking) {
      // Dynamic mouth speaking frames
      switch (mouthFrame) {
        case 1:
          return (
            <ellipse cx="100" cy="112" rx="4" ry="4" fill="#ef4444" opacity="0.85" />
          );
        case 2:
          return (
            <path
              d="M 94 110 Q 100 118 106 110 Z"
              fill="#e11d48"
              stroke="#be123c"
              strokeWidth="1"
            />
          );
        case 3:
          return (
            <ellipse cx="100" cy="111" rx="5" ry="3" fill="#f43f5e" opacity="0.8" />
          );
        default:
          return (
            <path
              d="M 95 110 Q 100 113 105 110"
              stroke="#27272a"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          );
      }
    }

    switch (effectiveExpression) {
      case 'happy':
      case 'encouraging':
        return (
          <path
            d="M 93 109 Q 100 117 107 109"
            stroke="#27272a"
            strokeWidth="2.5"
            fill="#fb7185"
            strokeLinecap="round"
          />
        );
      case 'thinking':
        return (
          <path
            d="M 96 111 Q 101 110 106 112"
            stroke="#27272a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        );
      case 'surprised':
        return <ellipse cx="100" cy="112" rx="3.5" ry="4.5" fill="#f43f5e" />;
      default:
        // Calm gentle smile
        return (
          <path
            d="M 95 110 Q 100 113 105 110"
            stroke="#27272a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        );
    }
  };

  // Status badge icon & text
  const getStatusInfo = () => {
    if (isListening) {
      return {
        text: 'Listening...',
        color: 'bg-emerald-500 text-white',
        pulse: 'ring-emerald-400',
        icon: Mic,
      };
    }
    if (isThinking) {
      return {
        text: 'Thinking...',
        color: 'bg-amber-500 text-white',
        pulse: 'ring-amber-400',
        icon: Brain,
      };
    }
    if (isSpeaking) {
      return {
        text: 'Speaking...',
        color: 'bg-indigo-600 text-white',
        pulse: 'ring-indigo-400',
        icon: Volume2,
      };
    }
    if (effectiveExpression === 'sleep') {
      return {
        text: 'Resting',
        color: 'bg-neutral-600 text-white',
        pulse: 'ring-neutral-400',
        icon: Moon,
      };
    }
    return {
      text: 'NOVA Active',
      color: 'bg-emerald-600/90 text-white',
      pulse: 'ring-emerald-400/50',
      icon: Sparkles,
    };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div
      onClick={onTap}
      className={`relative inline-flex flex-col items-center justify-center select-none group cursor-pointer ${className}`}
      title="NOVA: Click to interact"
    >
      {/* Dynamic Halo / Aura Effect */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-700 blur-xl opacity-35 ${
          isListening
            ? 'bg-cyan-400 scale-110 animate-pulse'
            : isThinking
            ? 'bg-amber-400 scale-105 animate-pulse'
            : isSpeaking
            ? 'bg-indigo-400 scale-110'
            : 'bg-indigo-300/40'
        }`}
      />

      {/* Anime Character SVG Canvas */}
      <div
        className={`relative z-10 transition-transform duration-300 ${sizeClasses} ${
          isSpeaking
            ? 'animate-[bounce_2s_ease-in-out_infinite]'
            : isListening
            ? 'scale-105'
            : 'hover:scale-102'
        }`}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Hair gradient */}
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="60%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>

            {/* Hair highlight */}
            <linearGradient id="hairHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>

            {/* Skin gradient */}
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff5eb" />
              <stop offset="100%" stopColor="#fde8d7" />
            </linearGradient>

            {/* Futuristic Headset/Cuff glow */}
            <filter id="cuffGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Back Hair Volume */}
          <path
            d="M 45 95 C 30 135 40 170 60 185 C 68 155 72 130 75 110 Z"
            fill="url(#hairGrad)"
          />
          <path
            d="M 155 95 C 170 135 160 170 140 185 C 132 155 128 130 125 110 Z"
            fill="url(#hairGrad)"
          />

          {/* Neck & Collar */}
          <path d="M 88 128 L 88 152 Q 100 156 112 152 L 112 128 Z" fill="#fcd9bf" />
          {/* Subtle Neck shadow */}
          <path d="M 88 128 Q 100 135 112 128 L 112 136 Q 100 142 88 136 Z" fill="#f2be9b" />
          
          {/* Modern Minimalist High-Collar Outfit */}
          <path
            d="M 68 175 Q 100 162 132 175 L 142 200 L 58 200 Z"
            fill="#0f172a"
          />
          <path
            d="M 82 165 L 100 176 L 118 165 L 114 190 L 86 190 Z"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1"
          />
          <circle cx="100" cy="180" r="2.5" fill="#38bdf8" />

          {/* Ears */}
          <ellipse cx="49" cy="98" rx="7" ry="10" fill="url(#skinGrad)" />
          <ellipse cx="151" cy="98" rx="7" ry="10" fill="url(#skinGrad)" />

          {/* Futuristic Ear-Cuff Communicator (Left & Right) */}
          <rect
            x="44"
            y="92"
            width="5"
            height="13"
            rx="2.5"
            fill="#1e293b"
            stroke={isListening ? '#06b6d4' : isSpeaking ? '#818cf8' : '#64748b'}
            strokeWidth="1"
          />
          <circle
            cx="46.5"
            cy="98"
            r="1.8"
            fill={isListening ? '#06b6d4' : isSpeaking ? '#818cf8' : '#22c55e'}
            className={isListening || isSpeaking ? 'animate-ping' : ''}
          />

          <rect
            x="151"
            y="92"
            width="5"
            height="13"
            rx="2.5"
            fill="#1e293b"
            stroke={isListening ? '#06b6d4' : isSpeaking ? '#818cf8' : '#64748b'}
            strokeWidth="1"
          />
          <circle
            cx="153.5"
            cy="98"
            r="1.8"
            fill={isListening ? '#06b6d4' : isSpeaking ? '#818cf8' : '#22c55e'}
          />

          {/* Face Base */}
          <path
            d="M 52 86 C 52 50 148 50 148 86 C 148 114 134 135 100 138 C 66 135 52 114 52 86 Z"
            fill="url(#skinGrad)"
          />

          {/* Soft Cheeks / Blush */}
          <ellipse cx="64" cy="102" rx="7" ry="4" fill="#fda4af" opacity="0.6" />
          <ellipse cx="136" cy="102" rx="7" ry="4" fill="#fda4af" opacity="0.6" />

          {/* Tiny Nose */}
          <path d="M 100 98 L 101 101" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

          {/* Eyes rendering */}
          {renderEyes()}

          {/* Mouth rendering */}
          {renderMouth()}

          {/* Hair Front Bangs & Layers */}
          {/* Main Hair Dome */}
          <path
            d="M 46 80 C 44 38 156 38 154 80 C 154 84 150 78 144 72 C 120 48 80 48 56 72 C 50 78 46 84 46 80 Z"
            fill="url(#hairGrad)"
          />

          {/* Front anime bangs */}
          <path
            d="M 46 76 C 58 72 74 88 80 94 C 82 82 88 74 94 70 C 100 78 106 90 110 94 C 118 84 136 74 154 78 C 146 95 138 108 136 114 C 132 102 130 92 126 84 C 120 96 112 106 102 102 C 96 106 88 98 84 86 C 80 96 74 112 64 114 C 62 108 54 94 46 76 Z"
            fill="url(#hairGrad)"
          />

          {/* Hair Glint / Specular Halo Bar */}
          <path
            d="M 62 58 Q 100 52 138 58 Q 100 55 62 58 Z"
            stroke="url(#hairHighlight)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Companion Hairpin / Star Accent */}
          <g transform="translate(138, 54)">
            <circle cx="0" cy="0" r="4.5" fill="#38bdf8" />
            <circle cx="0" cy="0" r="2" fill="#ffffff" />
          </g>
        </svg>
      </div>

      {/* Floating Status Pill */}
      <div
        className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide shadow-sm ring-2 ${status.pulse} ${status.color} transition-all duration-300`}
      >
        <StatusIcon className="w-3 h-3 animate-pulse" />
        <span>{status.text}</span>
      </div>
    </div>
  );
};
