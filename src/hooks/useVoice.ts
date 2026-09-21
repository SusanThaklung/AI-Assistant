/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceSettings } from '../types';

// Web Speech API interface declarations
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function cleanTextForSpeech(markdown: string): string {
  if (!markdown) return '';
  // Remove fenced code blocks ```...```
  let clean = markdown.replace(/```[\s\S]*?```/g, ' (code block) ');
  // Remove inline code
  clean = clean.replace(/`([^`]+)`/g, '$1');
  // Remove markdown images and links
  clean = clean.replace(/!\[([^\]]*)\]\([^)]*\)/g, '');
  clean = clean.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  // Remove headers, bold, italics, blockquotes
  clean = clean.replace(/[#*_~>]/g, ' ');
  // Remove bullets and numbers
  clean = clean.replace(/^\s*[-+*]\s+/gm, '');
  clean = clean.replace(/^\s*\d+\.\s+/gm, '');
  // Collapse whitespace
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean;
}

export function useVoice(onTranscriptReceived?: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isTtsSupported, setIsTtsSupported] = useState(false);

  const [settings, setSettings] = useState<VoiceSettings>(() => {
    const saved = localStorage.getItem('nova_voice_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      autoSpeak: true,
      isMuted: false,
      speechRate: 1.0,
      speechPitch: 1.05,
      speechLanguage: 'auto',
    };
  });

  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Save settings on update
  useEffect(() => {
    localStorage.setItem('nova_voice_settings', JSON.stringify(settings));
  }, [settings]);

  // Check browser speech support
  useEffect(() => {
    const win = window as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    setIsSpeechSupported(!!SpeechRecognition);
    setIsTtsSupported('speechSynthesis' in window);
  }, []);

  // Initialize Speech Recognition
  const startListening = useCallback((targetLang?: string) => {
    const win = window as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    // Stop speaking if currently speaking
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Determine speech recognition language (supports Nepali 'ne-NP' and English 'en-US')
      const chosenLang = targetLang || (settings.speechLanguage === 'ne-NP' ? 'ne-NP' : (settings.speechLanguage === 'en-US' ? 'en-US' : 'ne-NP'));
      recognition.lang = chosenLang;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        setTranscript('');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        if (event.error === 'no-speech') {
          setSpeechError('No speech was detected. Tap the mic and try again.');
        } else if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access to talk with NOVA.');
        } else {
          // Fallback to English if ne-NP was not supported by browser
          if (recognition.lang === 'ne-NP') {
            try {
              recognition.lang = 'en-US';
              recognition.start();
              return;
            } catch {
              // ignore
            }
          }
          setSpeechError(`Speech error: ${event.error}. Please try again or type.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setSpeechError(err.message || 'Could not start voice recognition.');
    }
  }, [settings.speechLanguage]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Text-to-Speech Output
  const speak = useCallback(
    (text: string, force = false) => {
      if (!isTtsSupported || (!force && settings.isMuted)) return;

      const cleanText = cleanTextForSpeech(text);
      if (!cleanText) return;

      // Stop any active utterance
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = settings.speechRate;
      utterance.pitch = settings.speechPitch;

      const voices = window.speechSynthesis.getVoices();
      const hasDevanagari = /[\u0900-\u097F]/.test(cleanText);

      if (hasDevanagari || settings.speechLanguage === 'ne-NP') {
        // Look for Nepali voice first, or Hindi voice for proper Devanagari phonology
        const nepaliOrHindiVoice = voices.find(
          (v) =>
            v.lang.startsWith('ne') ||
            v.lang.startsWith('hi') ||
            v.name.toLowerCase().includes('nepali') ||
            v.name.toLowerCase().includes('hindi')
        );
        if (nepaliOrHindiVoice) {
          utterance.voice = nepaliOrHindiVoice;
        }
      } else {
        // Select a natural friendly English voice if available
        const preferredVoice = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('Google') ||
              v.name.includes('Zira') ||
              v.name.includes('Victoria'))
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('Speech synthesis error:', e);
        }
        setIsSpeaking(false);
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isTtsSupported, settings]
  );

  const stopSpeaking = useCallback(() => {
    if (isTtsSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isTtsSupported]);

  const toggleMute = useCallback(() => {
    setSettings((prev) => {
      const nextMuted = !prev.isMuted;
      if (nextMuted && isTtsSupported) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return { ...prev, isMuted: nextMuted };
    });
  }, [isTtsSupported]);

  const toggleAutoSpeak = useCallback(() => {
    setSettings((prev) => ({ ...prev, autoSpeak: !prev.autoSpeak }));
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    speechError,
    isSpeechSupported,
    isTtsSupported,
    settings,
    setSettings,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    toggleMute,
    toggleAutoSpeak,
    clearError: () => setSpeechError(null),
  };
}
