/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserMemory, StudyGoal, StudySubject, VoiceSettings } from '../types';
import {
  Code2,
  Calculator,
  Atom,
  FlaskConical,
  BookOpen,
  FolderGit2,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Play,
  Languages,
  BookmarkCheck,
  User,
  Dna,
  Cpu,
  Globe2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

interface StudyCompanionToolsProps {
  memory: UserMemory;
  onUpdateMemory: (memory: UserMemory) => void;
  goals: StudyGoal[];
  onAddGoal: (title: string, subject: string) => void;
  onToggleGoal: (id: string) => void;
  onDeleteGoal: (id: string) => void;
  onSelectSubjectPrompt: (prompt: string) => void;
  activeSubject: StudySubject;
  onSubjectChange: (sub: StudySubject) => void;
  voiceSettings?: VoiceSettings;
  onSetVoiceSettings?: React.Dispatch<React.SetStateAction<VoiceSettings>>;
  onStopSpeaking?: () => void;
  onClose?: () => void;
}

export const StudyCompanionTools: React.FC<StudyCompanionToolsProps> = ({
  memory,
  onUpdateMemory,
  goals,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
  onSelectSubjectPrompt,
  activeSubject,
  onSubjectChange,
  voiceSettings,
  onSetVoiceSettings,
  onStopSpeaking,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'subjects' | 'goals' | 'scratchpad' | 'profile'>('subjects');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [scratchCode, setScratchCode] = useState('// Practice scratchpad\n// Try out code or take notes here:\n\nfunction calculateSquare(n) {\n  return n * n;\n}\n\nconsole.log(calculateSquare(5));');
  const [scratchOutput, setScratchOutput] = useState<string | null>(null);

  // User memory edit states
  const [editingName, setEditingName] = useState(memory.userName || '');
  const [newProject, setNewProject] = useState('');

  const subjects: { id: StudySubject; name: string; icon: any; starter: string }[] = [
    {
      id: 'programming',
      name: 'Programming',
      icon: Code2,
      starter: 'Help me understand how async/await works in JavaScript with a small example and a practice task.',
    },
    {
      id: 'math',
      name: 'Mathematics',
      icon: Calculator,
      starter: 'Explain the intuition behind derivatives in calculus with a simple real-world analogy and show a step-by-step example.',
    },
    {
      id: 'physics',
      name: 'Physics',
      icon: Atom,
      starter: 'Explain Newton’s second law (F = ma) with units, a simple real-world example, and a numerical problem.',
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      icon: FlaskConical,
      starter: 'Explain why benzene undergoes electrophilic substitution reactions instead of addition, with reaction steps.',
    },
    {
      id: 'biology',
      name: 'Biology',
      icon: Dna,
      starter: 'Explain how DNA replication works step-by-step (helicase, DNA polymerase) with a simple analogy.',
    },
    {
      id: 'ai_tech',
      name: 'AI & Tech',
      icon: Cpu,
      starter: 'How does a Transformer model work in simple terms? Explain self-attention with an intuitive example.',
    },
    {
      id: 'general_science',
      name: 'General Science',
      icon: Globe2,
      starter: 'Why is the sky blue during the day and red during sunset? Explain Rayleigh scattering simply.',
    },
    {
      id: 'english',
      name: 'English',
      icon: BookOpen,
      starter: 'Help me improve my technical writing: how do I write clear, concise documentation for a project?',
    },
    {
      id: 'nepali',
      name: 'नेपाली (Nepali)',
      icon: Languages,
      starter: 'नमस्ते! मलाई नेपाली व्याकरण (व्याकरण, काल, र वाक्य रचना) वा विज्ञान र कम्प्युटरको कुनै पनि विषय नेपालीमा सिकाउनुहोस्।',
    },
    {
      id: 'projects',
      name: 'Project Builder',
      icon: FolderGit2,
      starter: 'I want to build a modern project. Help me break it down step-by-step: Idea, Features, UI, JS, and Backend.',
    },
  ];

  const handleRunScratch = () => {
    try {
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        error: (...args: any[]) => logs.push(`Error: ${args.join(' ')}`),
        warn: (...args: any[]) => logs.push(`Warn: ${args.join(' ')}`),
      };
      // Execute in sandbox function with custom console
      const runFn = new Function('console', scratchCode);
      runFn(customConsole);
      setScratchOutput(logs.length > 0 ? logs.join('\n') : 'Code executed successfully with no console logs.');
    } catch (err: any) {
      setScratchOutput(`Runtime Error: ${err.message}`);
    }
  };

  const handleSaveMemory = () => {
    onUpdateMemory({
      ...memory,
      userName: editingName.trim(),
    });
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.trim()) return;
    onUpdateMemory({
      ...memory,
      activeProjects: [...(memory.activeProjects || []), newProject.trim()],
    });
    setNewProject('');
  };

  const handleRemoveProject = (index: number) => {
    const updated = [...(memory.activeProjects || [])];
    updated.splice(index, 1);
    onUpdateMemory({
      ...memory,
      activeProjects: updated,
    });
  };

  const handleAddGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    onAddGoal(newGoalTitle.trim(), activeSubject);
    setNewGoalTitle('');
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-neutral-200">
      {/* Sub-navigation tabs */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2 bg-neutral-50/70">
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'subjects' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Subjects
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'goals' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Goals ({goals.filter((g) => !g.completed).length})</span>
          </button>
          <button
            onClick={() => setActiveTab('scratchpad')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'scratchpad' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Scratchpad</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'profile' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors"
            title="Close study tools"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-neutral-800">
        {/* SUBJECTS TAB */}
        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Study Domain
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {subjects.map((sub) => {
                  const Icon = sub.icon;
                  const isSelected = activeSubject === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => {
                        onSubjectChange(sub.id);
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-medium ring-1 ring-indigo-500'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-neutral-400'}`} />
                      <span className="text-xs">{sub.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Practice Starters */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Practice Starters with NOVA
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() =>
                    onSelectSubjectPrompt(
                      `Let's practice ${activeSubject}. Please explain a core concept simply, show a small code/calculation example, and give me a small task to try!`
                    )
                  }
                  className="w-full text-left p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-100 text-xs text-neutral-700 transition-colors cursor-pointer"
                >
                  🎯 <strong>Teach &amp; Practice</strong>: Concept + Small Task
                </button>
                <button
                  onClick={() =>
                    onSelectSubjectPrompt(
                      `I have a bug or confusion in my code/problem. Can you help me identify what went wrong and explain why?`
                    )
                  }
                  className="w-full text-left p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-100 text-xs text-neutral-700 transition-colors cursor-pointer"
                >
                  🔍 <strong>Debug &amp; Analyze</strong>: Find &amp; explain issues
                </button>
                <button
                  onClick={() =>
                    onSelectSubjectPrompt(
                      `Help me design a project roadmap: divide it into Idea, Features, UI, Code, and Deployment.`
                    )
                  }
                  className="w-full text-left p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-100 text-xs text-neutral-700 transition-colors cursor-pointer"
                >
                  🚀 <strong>Project Roadmap</strong>: Step-by-step breakdown
                </button>
                <button
                  onClick={() =>
                    onSelectSubjectPrompt(
                      `Namaste NOVA! Yo concept malai sajilo Nepali ma bujhaideu na (Explain this concept in simple Nepali/Romanized Nepali).`
                    )
                  }
                  className="w-full text-left p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-xs text-indigo-900 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>🇳🇵 <strong>Nepali / Romanized Nepali</strong> Mode</span>
                  <Languages className="w-3.5 h-3.5 text-indigo-500" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GOALS TAB */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            <form onSubmit={handleAddGoalSubmit} className="flex gap-2">
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder={`Add goal for ${activeSubject}...`}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="space-y-1.5">
              {goals.length === 0 ? (
                <div className="text-center py-6 text-xs text-neutral-400">
                  No active study goals yet. Add one to track your milestones!
                </div>
              ) : (
                goals.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs transition-colors"
                  >
                    <button
                      onClick={() => onToggleGoal(g.id)}
                      className="flex items-center gap-2 flex-1 text-left cursor-pointer"
                    >
                      {g.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                      )}
                      <span className={g.completed ? 'line-through text-neutral-400' : 'text-neutral-800'}>
                        {g.title}
                      </span>
                    </button>
                    <button
                      onClick={() => onDeleteGoal(g.id)}
                      className="text-neutral-400 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SCRATCHPAD TAB */}
        {activeTab === 'scratchpad' && (
          <div className="space-y-3 flex flex-col h-[400px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Live JavaScript Tester</span>
              <button
                onClick={handleRunScratch}
                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Run</span>
              </button>
            </div>
            <textarea
              value={scratchCode}
              onChange={(e) => setScratchCode(e.target.value)}
              className="flex-1 w-full p-3 font-mono text-xs bg-neutral-950 text-neutral-100 rounded-xl border border-neutral-800 focus:outline-none resize-none selection:bg-indigo-900"
              spellCheck={false}
            />
            {scratchOutput && (
              <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-mono max-h-32 overflow-y-auto whitespace-pre-wrap text-neutral-800">
                <span className="font-semibold text-neutral-500 block mb-1">Output:</span>
                {scratchOutput}
              </div>
            )}
          </div>
        )}

        {/* USER PROFILE & CONVERSATION MEMORY TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-4 text-xs">
            {/* Voice Response Behavior: Speak vs Keep Quiet */}
            {voiceSettings && onSetVoiceSettings && (
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${voiceSettings.autoSpeak && !voiceSettings.isMuted ? 'bg-indigo-100 text-indigo-700' : 'bg-neutral-200 text-neutral-600'}`}>
                      {voiceSettings.autoSpeak && !voiceSettings.isMuted ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <VolumeX className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 text-xs">When Replying to Messages</h4>
                      <p className="text-[10px] text-neutral-500">Choose whether NOVA speaks aloud or keeps quiet</p>
                    </div>
                  </div>
                </div>

                {/* Speak vs Keep Quiet Toggle Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onSetVoiceSettings((prev) => ({ ...prev, autoSpeak: true, isMuted: false }));
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      voiceSettings.autoSpeak && !voiceSettings.isMuted
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs ring-2 ring-indigo-200'
                        : 'border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Speak Aloud</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onStopSpeaking) onStopSpeaking();
                      onSetVoiceSettings((prev) => ({ ...prev, autoSpeak: false, isMuted: true }));
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      !voiceSettings.autoSpeak || voiceSettings.isMuted
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-2xs ring-2 ring-neutral-300'
                        : 'border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Keep Quiet</span>
                  </button>
                </div>

                <div className="text-[10px] text-neutral-500 pt-0.5 flex items-center justify-between">
                  <span>Status:</span>
                  {voiceSettings.autoSpeak && !voiceSettings.isMuted ? (
                    <span className="text-indigo-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      Speaks replies aloud
                    </span>
                  ) : (
                    <span className="text-neutral-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                      Keeps quiet (silent replies)
                    </span>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-neutral-500 font-medium mb-1">Your Preferred Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSaveMemory}
                  className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-3">
              <label className="block text-neutral-500 font-medium mb-1.5">
                Active Projects (NOVA will remember during conversation)
              </label>
              <form onSubmit={handleAddProject} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  placeholder="e.g. Personal Portfolio website"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-300 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 cursor-pointer"
                >
                  Add
                </button>
              </form>

              <div className="space-y-1">
                {(memory.activeProjects || []).map((proj, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-200"
                  >
                    <span>{proj}</span>
                    <button
                      onClick={() => handleRemoveProject(idx)}
                      className="text-neutral-400 hover:text-red-500 p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-indigo-900 text-[11px] leading-relaxed">
              💡 <strong>Honest AI Principle:</strong> NOVA only remembers information you explicitly configure or share in this session. NOVA never fabricates memories.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
