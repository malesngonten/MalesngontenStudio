import React from 'react';
import {
  MessageSquare,
  Sliders,
  Sparkles,
  Maximize2,
  Columns2,
  SplitSquareVertical,
  Plus,
} from 'lucide-react';
import { AgentStatus } from '../../contracts/agentProtocol';

interface HeaderProps {
  agentStatus: AgentStatus;
  sessionsCount: number;
  activeSessionTitle?: string;
  splitMode: '50-50' | 'player-focus' | 'chat-focus';
  onToggleSplitMode: () => void;
  onOpenChatHistory: () => void;
  onOpenSettings: () => void;
  onNewChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  agentStatus,
  sessionsCount,
  activeSessionTitle,
  splitMode,
  onToggleSplitMode,
  onOpenChatHistory,
  onOpenSettings,
  onNewChat,
}) => {
  const getStatusBadge = () => {
    switch (agentStatus) {
      case 'thinking':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-300 bg-amber-950/60 border border-amber-700/50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>Agent Berpikir...</span>
          </span>
        );
      case 'executing_tool':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-700/50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Eksekusi Tool ACP</span>
          </span>
        );
      case 'streaming':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-purple-300 bg-purple-950/60 border border-purple-700/50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span>Menulis Kode...</span>
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-slate-800/60 border border-slate-700 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
            <span>Menghubungkan...</span>
          </span>
        );
      case 'idle':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-300 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>ACP Siap</span>
          </span>
        );
    }
  };

  return (
    <header className="h-[48px] bg-[#111114] border-b border-[#24242a] px-3 flex items-center justify-between gap-2 select-none shrink-0 z-20">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-lg overflow-hidden bg-[#c92a2a] shrink-0 border border-red-500/40 shadow-sm flex items-center justify-center">
          <img
            src="/assets/aistudio/Black_Cat_Animals___Pets_Logo_20261024_034747_0000_d2a38d28.png"
            alt="Males Ngonten Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white tracking-tight truncate">
              MALES NGONTEN
            </span>
            <span className="text-[10px] font-bold text-[#e5484d] uppercase tracking-wider bg-red-950/70 border border-red-800/50 px-1 rounded">
              STUDIO
            </span>
          </div>
          <span className="text-[9px] text-[#858591] truncate font-mono hidden xs:inline">
            Remotion AI Coding Engine
          </span>
        </div>
      </div>

      {/* Middle: Agent Status */}
      <div className="flex items-center gap-1.5">
        {getStatusBadge()}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Toggle 50:50 Layout */}
        <button
          type="button"
          onClick={onToggleSplitMode}
          title={
            splitMode === '50-50'
              ? 'Tampilan Vertikal 50:50 (Aktif)'
              : splitMode === 'player-focus'
              ? 'Fokus Player Video'
              : 'Fokus Chat Agent'
          }
          className="tap w-8 h-8 rounded-lg flex items-center justify-center text-[#8e8e99] hover:text-white hover:bg-[#1f1f25] border border-transparent hover:border-[#2f2f38] transition-colors"
        >
          <SplitSquareVertical className="w-4 h-4" />
        </button>

        {/* History / Sessions Button */}
        <button
          type="button"
          onClick={onOpenChatHistory}
          title="Riwayat Percakapan AI"
          className="tap flex items-center gap-1 px-2 h-8 rounded-lg text-[#b0b0bc] hover:text-white bg-[#1a1a20] hover:bg-[#25252e] border border-[#292933] text-xs font-medium transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#e5484d]" />
          <span className="font-mono text-[11px]">{sessionsCount}</span>
        </button>

        {/* New Chat Button */}
        <button
          type="button"
          onClick={onNewChat}
          title="Mulai Percakapan Baru"
          className="tap w-8 h-8 rounded-lg flex items-center justify-center text-white bg-[#c92a2a] hover:bg-[#b02525] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
