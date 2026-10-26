import React, { useState } from 'react';
import {
  Play,
  ChevronDown,
  MessageSquare,
  Sliders,
  BookOpen,
  RefreshCw,
  Plus,
  Check,
} from 'lucide-react';
import { IconButton } from '../ui/IconButton';

interface HeaderProps {
  currentProject: string;
  projectList: string[];
  onSelectProject: (name: string) => void;
  onCreateNewProject: () => void;
  agentStatus: 'connected' | 'working' | 'disconnected';
  onReconnectAgent: () => void;
  onOpenChatHistory: () => void;
  onOpenProjectRules: () => void;
  onOpenAgentSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  projectList,
  onSelectProject,
  onCreateNewProject,
  agentStatus,
  onReconnectAgent,
  onOpenChatHistory,
  onOpenProjectRules,
  onOpenAgentSettings,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getStatusColor = () => {
    switch (agentStatus) {
      case 'connected':
        return 'bg-[#5fd3b0]'; // green
      case 'working':
        return 'bg-amber-400 animate-pulse'; // yellow
      case 'disconnected':
        return 'bg-[#e5484d]'; // red
    }
  };

  const getStatusLabel = () => {
    switch (agentStatus) {
      case 'connected':
        return 'Agent Terhubung';
      case 'working':
        return 'Agent Bekerja';
      case 'disconnected':
        return 'Agent Terputus';
    }
  };

  return (
    <header className="h-[50px] px-3 bg-[#121214] border-b border-[#27272c] flex items-center justify-between gap-2 select-none relative z-30">
      {/* Left: Logo & Project Switcher */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Logo kotak rounded 8px merah 28px berisi ikon Play putih */}
        <div className="w-[28px] h-[28px] rounded-[8px] bg-[#e5484d] flex items-center justify-center shrink-0 shadow-sm">
          <Play className="w-3.5 h-3.5 fill-white text-white translate-x-[1px]" />
        </div>

        {/* Project Name dropdown + Subtitle */}
        <div className="relative min-w-0">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="tap flex items-center gap-1 group text-left max-w-[170px]"
            aria-label="Pilih Proyek"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[15px] font-semibold text-[#f2f2f3] truncate leading-tight group-hover:text-white">
                  {currentProject}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8b8b94] group-hover:text-white shrink-0" />
              </div>
              <span className="text-[10px] text-[#8b8b94] block leading-none">
                Studio Hermes
              </span>
            </div>
          </button>

          {/* Project dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-[#18181b] border border-[#303036] rounded-2xl shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-semibold text-[#8b8b94] uppercase px-2 py-1">
                Daftar Proyek
              </div>
              {projectList.map((proj) => (
                <button
                  key={proj}
                  type="button"
                  onClick={() => {
                    onSelectProject(proj);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs flex items-center justify-between hover:bg-[#222226] transition-colors ${
                    proj === currentProject ? 'text-[#e5484d] font-semibold bg-[#222226]' : 'text-[#f2f2f3]'
                  }`}
                >
                  <span className="truncate">{proj}</span>
                  {proj === currentProject && <Check className="w-3.5 h-3.5 text-[#e5484d]" />}
                </button>
              ))}

              <div className="my-1 border-t border-[#27272c]" />

              <button
                type="button"
                onClick={() => {
                  onOpenProjectRules();
                  setIsDropdownOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs flex items-center gap-2 text-[#8b8b94] hover:text-[#f2f2f3] hover:bg-[#222226]"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#7aa7ff]" />
                <span>Aturan Proyek (GEMINI.md)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenAgentSettings();
                  setIsDropdownOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs flex items-center gap-2 text-[#8b8b94] hover:text-[#f2f2f3] hover:bg-[#222226]"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Pengaturan AI Agent</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onCreateNewProject();
                  setIsDropdownOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs flex items-center gap-2 text-[#7aa7ff] hover:bg-[#222226] font-medium mt-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Proyek Baru</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions & Agent Status (Spacious and uncluttered) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Riwayat Chat */}
        <IconButton
          icon={<MessageSquare className="w-4 h-4" />}
          aria-label="Buka Riwayat Chat"
          size="sm"
          onClick={onOpenChatHistory}
        />

        {/* Pengaturan Proyek & Agent */}
        <IconButton
          icon={<Sliders className="w-4 h-4" />}
          aria-label="Pengaturan Proyek & Agent"
          size="sm"
          onClick={onOpenAgentSettings}
        />

        {/* Indikator status agent (titik hijau / kuning / merah) */}
        <div className="flex items-center gap-1 pl-1 border-l border-[#27272c]">
          <button
            type="button"
            onClick={agentStatus === 'disconnected' ? onReconnectAgent : undefined}
            title={`${getStatusLabel()}${agentStatus === 'disconnected' ? ' (Ketuk untuk sambung ulang)' : ''}`}
            className="tap flex items-center gap-1.5 p-1.5 rounded-full hover:bg-[#222226]"
            aria-label={getStatusLabel()}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`} />
            {agentStatus === 'disconnected' && (
              <RefreshCw className="w-3 h-3 text-[#e5484d] animate-spin" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
