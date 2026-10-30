import React from 'react';
import { Film } from 'lucide-react';
import { AgentStatus } from '../../contracts/agentProtocol';

export type StudioView = 'studio' | 'storyboard' | 'code' | 'assets';

interface HeaderProps {
  onOpenRender: () => void;
  isRendering?: boolean;
  onOpenSettings?: () => void;
  agentStatus: AgentStatus;
  onOpenAgentDiscovery?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRender,
  isRendering,
  onOpenSettings,
  agentStatus,
  onOpenAgentDiscovery,
}) => {
  const getStatusIndicator = () => {
    switch (agentStatus) {
      case 'thinking':
        return (
          <div className="flex items-center gap-1.5 text-amber-300 font-medium text-[11px]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="hidden xs:inline">Berpikir...</span>
          </div>
        );
      case 'executing_tool':
        return (
          <div className="flex items-center gap-1.5 text-cyan-300 font-medium text-[11px]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="hidden xs:inline">Tool ACP</span>
          </div>
        );
      case 'streaming':
        return (
          <div className="flex items-center gap-1.5 text-rose-300 font-medium text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="hidden xs:inline">Menulis Kode</span>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>ACP Siap</span>
          </div>
        );
    }
  };

  return (
    <header className="h-12 bg-gradient-to-b from-[#141418] via-[#0d0d10] to-[#09090b] px-3 sm:px-4 flex items-center justify-between gap-2 select-none shrink-0 z-30 shadow-md">
      {/* 1. Left: Brand Logo & Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenSettings}
          title="Tentang Males Ngonten Studio"
          className="tap flex items-center gap-2 text-left group transition-transform active:scale-98"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-rose-700 shrink-0 shadow-md flex items-center justify-center p-0.5">
            <img
              src="/assets/aistudio/Black_Cat_Animals___Pets_Logo_20261024_034747_0000_d2a38d28.png"
              alt="Males Ngonten Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="min-w-0 flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-bold tracking-tight text-white group-hover:text-red-400 transition-colors truncate">
              Males Ngonten
            </span>
            <span className="text-[10px] font-bold text-red-300 bg-gradient-to-r from-red-600/30 to-rose-600/20 px-2 py-0.5 rounded-full tracking-wide uppercase">
              AI
            </span>
          </div>
        </button>
      </div>

      {/* 2. Right: ACP Status + Primary Ekspor Button (Kapsul, Tanpa Border, Gradasi Jelas) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Indikator Koneksi AI Agent (ACP) di sebelah Ekspor */}
        <button
          type="button"
          onClick={onOpenAgentDiscovery}
          title="Koneksi AI Coding Agent (ACP). Klik untuk melihat diagnostik ARM64 & agen lokal"
          className="tap flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-zinc-800/90 to-zinc-900/90 hover:from-zinc-700/90 hover:to-zinc-800/90 shadow-sm transition-all text-xs"
        >
          {getStatusIndicator()}
        </button>

        {/* Tombol Ekspor MP4 (Kapsul Gradasi Jelas) */}
        <button
          type="button"
          onClick={onOpenRender}
          title="Ekspor Video Remotion MP4"
          className="tap flex items-center gap-1.5 px-4 h-8 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white text-xs font-semibold shadow-md shadow-red-950/40 transition-all"
        >
          <Film className="w-3.5 h-3.5" />
          <span>Ekspor MP4</span>
          {isRendering && (
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-0.5" />
          )}
        </button>
      </div>
    </header>
  );
};
