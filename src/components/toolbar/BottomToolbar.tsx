import React from 'react';
import {
  Bot,
  Layers,
  Code2,
  FolderOpen,
  MessageSquare,
  Info,
} from 'lucide-react';
import { StudioView } from '../header/Header';

interface BottomToolbarProps {
  activeView: StudioView;
  onSelectView: (view: StudioView) => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  isTimelineVisible: boolean;
  onToggleTimeline: () => void;
  sessionsCount: number;
  onOpenChatHistory: () => void;
  onOpenSettings: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  activeView,
  onSelectView,
  isChatOpen,
  onToggleChat,
  isTimelineVisible,
  onToggleTimeline,
  sessionsCount,
  onOpenChatHistory,
  onOpenSettings,
}) => {
  const isChatActive = activeView === 'studio' && isChatOpen;

  const handleChatAIClick = () => {
    if (activeView !== 'studio') {
      onSelectView('studio');
      if (!isChatOpen) {
        onToggleChat();
      }
    } else {
      onToggleChat();
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-t from-black via-[#0d0d12] to-[#121218]/95 backdrop-blur-xl select-none shadow-2xl safe-pb">
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* 1. FIXED PRIMARY BUTTON: Chat AI (Kapsul, Tetap di Kiri, Tidak Bisa Digeser) */}
        <div className="shrink-0 flex items-center">
          <button
            type="button"
            onClick={handleChatAIClick}
            title={isChatActive ? 'Tutup Panel Chat AI' : 'Buka Chat AI Studio'}
            className={`tap flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg active:scale-95 ${
              isChatActive
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white shadow-red-950/60 ring-2 ring-red-400/40'
                : 'bg-gradient-to-r from-zinc-800 via-zinc-800/90 to-zinc-900 text-zinc-200 hover:text-white shadow-black/40'
            }`}
          >
            <Bot className="w-4 h-4 text-white" />
            <span>Chat AI</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isChatActive ? 'bg-white animate-pulse' : 'bg-red-400'
              }`}
            />
          </button>
        </div>

        {/* Divider Gradasi Lembut (Tanpa Border) */}
        <div className="w-[1.5px] h-6 bg-gradient-to-b from-transparent via-white/20 to-transparent shrink-0" />

        {/* 2. HORIZONTALLY SCROLLABLE SECONDARY TOOLS (Kapsul rounded-full & Gradasi Jelas) */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap py-0.5">
          {/* Storyboard */}
          <button
            type="button"
            onClick={() => onSelectView('storyboard')}
            className={`tap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeView === 'storyboard'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-red-950/40'
                : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-zinc-300 hover:text-white hover:from-zinc-700/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Storyboard</span>
          </button>

          {/* Kode */}
          <button
            type="button"
            onClick={() => onSelectView('code')}
            className={`tap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeView === 'code'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950/40'
                : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-zinc-300 hover:text-white hover:from-zinc-700/80'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Kode</span>
          </button>

          {/* Aset */}
          <button
            type="button"
            onClick={() => onSelectView('assets')}
            className={`tap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeView === 'assets'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-950/40'
                : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-zinc-300 hover:text-white hover:from-zinc-700/80'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Aset</span>
          </button>

          {/* Timeline Toggle */}
          <button
            type="button"
            onClick={onToggleTimeline}
            className={`tap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isTimelineVisible
                ? 'bg-gradient-to-r from-red-950/90 via-rose-900/80 to-red-900/90 text-rose-200 shadow-md'
                : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-zinc-400 hover:text-white'
            }`}
            title={isTimelineVisible ? 'Sembunyikan Timeline Track' : 'Tampilkan Timeline Track'}
          >
            <Layers className={`w-3.5 h-3.5 ${isTimelineVisible ? 'text-rose-400' : 'text-zinc-400'}`} />
            <span>Timeline</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isTimelineVisible ? 'bg-red-400' : 'bg-zinc-600'
              }`}
            />
          </button>

          {/* Chat History / Sessions */}
          <button
            type="button"
            onClick={onOpenChatHistory}
            className="tap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 hover:from-zinc-700/80 text-xs font-medium text-zinc-300 hover:text-white transition-all relative"
            title="Riwayat Percakapan AI"
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            <span>Riwayat</span>
            {sessionsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-zinc-700 to-zinc-800 text-zinc-200 text-[10px] font-mono">
                {sessionsCount}
              </span>
            )}
          </button>

          {/* Project Info / Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="tap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 hover:from-zinc-700/80 text-xs font-medium text-zinc-300 hover:text-white transition-all"
            title="Tentang Males Ngonten Studio"
          >
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            <span>Tentang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
