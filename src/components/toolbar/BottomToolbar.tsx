import React, { useState, useCallback } from 'react';
import {
  Bot,
  Layers,
  Code2,
  FolderOpen,
  MessageSquare,
  Info,
  Key,
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
  onOpenAiSettings: () => void;
  isAiConfigured?: boolean;
}

interface TooltipState {
  label: string;
  x: number;
  y: number;
  placeAbove: boolean;
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
  onOpenAiSettings,
  isAiConfigured,
}) => {
  const isChatActive = activeView === 'studio' && isChatOpen;
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const tooltipTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleShowTooltip = useCallback(
    (label: string, e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement> | React.PointerEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      // Clamp within viewport so tooltip is never clipped
      const clampedX = Math.max(56, Math.min(window.innerWidth - 56, centerX));
      const placeAbove = rect.top > 48;
      const targetY = placeAbove ? rect.top - 8 : rect.bottom + 8;

      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);

      setTooltip({
        label,
        x: clampedX,
        y: targetY,
        placeAbove,
      });

      // Auto dismiss on touch after 2 seconds
      if ('touches' in e) {
        tooltipTimerRef.current = setTimeout(() => {
          setTooltip(null);
        }, 2000);
      }
    },
    []
  );

  const handleHideTooltip = useCallback(() => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setTooltip(null);
  }, []);

  const handleChatAIClick = (e: React.MouseEvent<HTMLButtonElement>) => {
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
    <>
      {/* Floating Adaptive Tooltip */}
      {tooltip && (
        <div
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: tooltip.placeAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          }}
          className="fixed z-50 pointer-events-none px-3 py-1 rounded-full text-[11px] font-semibold text-white bg-gradient-to-r from-zinc-900/95 via-zinc-800/95 to-zinc-900/95 backdrop-blur-md shadow-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap"
        >
          {tooltip.label}
        </div>
      )}

      {/* 2. Fixed Bottom Toolbar Container (Pure Minimalist Icons, Tanpa Border) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-t from-black via-[#0c0c10] to-[#121218]/95 backdrop-blur-xl select-none shadow-2xl safe-pb">
        <div className="flex items-center gap-2 px-3 py-2">
          {/* 1. FIXED PRIMARY BUTTON: Chat AI (Kapsul Ikon Murni, Tetap di Kiri) */}
          <div className="shrink-0 flex items-center">
            <button
              type="button"
              onClick={handleChatAIClick}
              onMouseEnter={(e) => handleShowTooltip(isChatActive ? 'Tutup Chat AI' : 'Buka Chat AI Studio', e)}
              onMouseLeave={handleHideTooltip}
              onTouchStart={(e) => handleShowTooltip(isChatActive ? 'Tutup Chat AI' : 'Buka Chat AI Studio', e)}
              onFocus={(e) => handleShowTooltip(isChatActive ? 'Tutup Chat AI' : 'Buka Chat AI Studio', e)}
              onBlur={handleHideTooltip}
              aria-label="Chat AI Studio"
              className={`tap w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 relative ${
                isChatActive
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white shadow-red-950/60 ring-2 ring-red-400/50'
                  : 'bg-gradient-to-r from-zinc-800 via-zinc-800/90 to-zinc-900 text-zinc-200 hover:text-white shadow-black/40'
              }`}
            >
              <Bot className="w-5 h-5 text-white shrink-0" />
              <span
                className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-zinc-950 ${
                  isChatActive ? 'bg-white animate-pulse' : 'bg-red-400'
                }`}
              />
            </button>
          </div>

          {/* Divider Gradasi Lembut (Tanpa Border) */}
          <div className="w-[1.5px] h-6 bg-gradient-to-b from-transparent via-white/20 to-transparent shrink-0" />

          {/* 2. HORIZONTALLY SCROLLABLE SECONDARY TOOLS (Murni Ikon Kapsul dengan Tooltip Melayang) */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap py-0.5">
            {/* Storyboard */}
            <button
              type="button"
              onClick={() => onSelectView('storyboard')}
              onMouseEnter={(e) => handleShowTooltip('Storyboard', e)}
              onMouseLeave={handleHideTooltip}
              onTouchStart={(e) => handleShowTooltip('Storyboard', e)}
              onFocus={(e) => handleShowTooltip('Storyboard', e)}
              onBlur={handleHideTooltip}
              aria-label="Storyboard"
              className={`tap w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-xs ${
                activeView === 'storyboard'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-red-950/50 ring-2 ring-rose-400/40'
                  : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-zinc-300 hover:text-white hover:from-zinc-700/80'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
            </button>

            {/* Kode */}
            <button
              type="button"
              onClick={() => onSelectView('code')}
              onMouseEnter={(e) => handleShowTooltip('Kode Remotion', e)}
              onMouseLeave={handleHideTooltip}
              onTouchStart={(e) => handleShowTooltip('Kode Remotion', e)}
              onFocus={(e) => handleShowTooltip('Kode Remotion', e)}
              onBlur={handleHideTooltip}
              aria-label="Editor Kode"
              className={`tap w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-xs ${
                activeView === 'code'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950/50 ring-2 ring-purple-400/40'
                  : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-zinc-300 hover:text-white hover:from-zinc-700/80'
              }`}
            >
              <Code2 className="w-4 h-4 shrink-0" />
            </button>

            {/* Aset */}
            <button
              type="button"
              onClick={() => onSelectView('assets')}
              onMouseEnter={(e) => handleShowTooltip('Aset Media', e)}
              onMouseLeave={handleHideTooltip}
              onTouchStart={(e) => handleShowTooltip('Aset Media', e)}
              onFocus={(e) => handleShowTooltip('Aset Media', e)}
              onBlur={handleHideTooltip}
              aria-label="Aset Media"
              className={`tap w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-xs ${
                activeView === 'assets'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-950/50 ring-2 ring-amber-400/40'
                  : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-zinc-300 hover:text-white hover:from-zinc-700/80'
              }`}
            >
              <FolderOpen className="w-4 h-4 shrink-0" />
            </button>

            {/* Timeline Toggle */}
            <button
              type="button"
              onClick={onToggleTimeline}
              onMouseEnter={(e) => handleShowTooltip(isTimelineVisible ? 'Sembunyikan Timeline' : 'Buka Timeline', e)}
              onMouseLeave={handleHideTooltip}
              onTouchStart={(e) => handleShowTooltip(isTimelineVisible ? 'Sembunyikan Timeline' : 'Buka Timeline', e)}
              onFocus={(e) => handleShowTooltip(isTimelineVisible ? 'Sembunyikan Timeline' : 'Buka Timeline', e)}
              onBlur={handleHideTooltip}
              aria-label="Toggle Timeline"
              className={`tap w-9 h-9 rounded-full flex items-center justify-center transition-all relative shadow-xs ${
                isTimelineVisible
                  ? 'bg-gradient-to-r from-red-950/90 via-rose-900/80 to-red-900/90 text-rose-200 shadow-md ring-2 ring-red-500/40'
                  : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className={`w-4 h-4 shrink-0 ${isTimelineVisible ? 'text-rose-400' : 'text-zinc-400'}`} />
              <span
                className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ring-1 ring-zinc-950 ${
                  isTimelineVisible ? 'bg-red-400' : 'bg-zinc-600'
                }`}
              />
            </button>

            {/* Chat History / Sessions */}
            <button
              type="button"
              onClick={onOpenChatHistory}
              onMouseEnter={(e) => handleShowTooltip(`Riwayat (${sessionsCount})`, e)}
              onMouseLeave={handleHideTooltip}
              onTouchStart={(e) => handleShowTooltip(`Riwayat (${sessionsCount})`, e)}
              onFocus={(e) => handleShowTooltip(`Riwayat (${sessionsCount})`, e)}
              onBlur={handleHideTooltip}
              aria-label="Riwayat Percakapan"
              className="tap w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 hover:from-zinc-700/80 text-zinc-300 hover:text-white transition-all relative shadow-xs"
            >
              <MessageSquare className="w-4 h-4 text-zinc-400 shrink-0" />
              {sessionsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs ring-1 ring-zinc-950">
                  {sessionsCount}
                </span>
              )}
            </button>

            {/* AI Provider (BYOK) Settings */}
            <button
              type="button"
              onClick={onOpenAiSettings}
              onMouseEnter={(e) => handleShowTooltip(isAiConfigured ? 'Pengaturan AI (BYOK)' : 'Atur AI Provider (BYOK)', e)}
              onMouseLeave={handleHideTooltip}
              onTouchStart={(e) => handleShowTooltip(isAiConfigured ? 'Pengaturan AI (BYOK)' : 'Atur AI Provider (BYOK)', e)}
              onFocus={(e) => handleShowTooltip(isAiConfigured ? 'Pengaturan AI (BYOK)' : 'Atur AI Provider (BYOK)', e)}
              onBlur={handleHideTooltip}
              aria-label="Pengaturan AI Provider"
              className={`tap w-9 h-9 rounded-full flex items-center justify-center transition-all relative shadow-xs ${
                isAiConfigured
                  ? 'bg-gradient-to-r from-emerald-950/70 to-zinc-900/80 text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-amber-300 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4 shrink-0" />
              {!isAiConfigured && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            {/* Project Info / Settings */}
            <button
              type="button"
              onClick={onOpenSettings}
              onMouseEnter={(e) => handleShowTooltip('Tentang Studio', e)}
              onMouseLeave={handleHideTooltip}
              onTouchStart={(e) => handleShowTooltip('Tentang Studio', e)}
              onFocus={(e) => handleShowTooltip('Tentang Studio', e)}
              onBlur={handleHideTooltip}
              aria-label="Tentang Studio"
              className="tap w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 hover:from-zinc-700/80 text-zinc-300 hover:text-white transition-all shadow-xs"
            >
              <Info className="w-4 h-4 text-zinc-400 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
