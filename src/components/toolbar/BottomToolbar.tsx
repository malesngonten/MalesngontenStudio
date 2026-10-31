import React, { useState, useCallback } from 'react';
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

      <div className="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-t from-black via-[#0c0c10] to-[#121218]/95 backdrop-blur-xl select-none shadow-2xl safe-pb">
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* 1. FIXED PRIMARY BUTTON: Chat AI (Kapsul, Icon-Only on Mobile) */}
          <div className="shrink-0 flex items-center">
            <button
              type="button"
              onClick={handleChatAIClick}
              onMouseEnter={(e) => handleShowTooltip(isChatActive ? 'Tutup Panel Chat AI' : 'Buka Chat AI Studio', e)}
              onMouseLeave={handleHideTooltip}
              onFocus={(e) => handleShowTooltip(isChatActive ? 'Tutup Panel Chat AI' : 'Buka Chat AI Studio', e)}
              onBlur={handleHideTooltip}
              className={`tap flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg active:scale-95 ${
                isChatActive
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white shadow-red-950/60 ring-2 ring-red-400/40'
                  : 'bg-gradient-to-r from-zinc-800 via-zinc-800/90 to-zinc-900 text-zinc-200 hover:text-white shadow-black/40'
              }`}
            >
              <Bot className="w-4 h-4 text-white shrink-0" />
              <span className="hidden sm:inline">Chat AI</span>
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isChatActive ? 'bg-white animate-pulse' : 'bg-red-400'
                }`}
              />
            </button>
          </div>

          {/* Divider Gradasi Lembut (Tanpa Border) */}
          <div className="w-[1.5px] h-6 bg-gradient-to-b from-transparent via-white/20 to-transparent shrink-0" />

          {/* 2. HORIZONTALLY SCROLLABLE SECONDARY TOOLS (Icon-Only on Mobile, Adaptive Tooltip, Pill Capsule) */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap py-0.5">
            {/* Storyboard */}
            <button
              type="button"
              onClick={() => onSelectView('storyboard')}
              onMouseEnter={(e) => handleShowTooltip('Storyboard Video', e)}
              onMouseLeave={handleHideTooltip}
              onTouchStart={(e) => handleShowTooltip('Storyboard Video', e)}
              onFocus={(e) => handleShowTooltip('Storyboard Video', e)}
              onBlur={handleHideTooltip}
              className={`tap flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeView === 'storyboard'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-red-950/40'
                  : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-zinc-300 hover:text-white hover:from-zinc-700/80'
              }`}
            >
              <Layers className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="hidden sm:inline">Storyboard</span>
            </button>

            {/* Kode */}
            <button
              type="button"
              onClick={() => onSelectView('code')}
              onMouseEnter={(e) => handleShowTooltip('Editor Kode Remotion', e)}
              onMouseLeave={handleHideTooltip}
              onTouchStart={(e) => handleShowTooltip('Editor Kode Remotion', e)}
              onFocus={(e) => handleShowTooltip('Editor Kode Remotion', e)}
              onBlur={handleHideTooltip}
              className={`tap flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeView === 'code'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950/40'
                  : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-zinc-300 hover:text-white hover:from-zinc-700/80'
              }`}
            >
              <Code2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="hidden sm:inline">Kode</span>
            </button>

            {/* Aset */}
            <button
              type="button"
              onClick={() => onSelectView('assets')}
              onMouseEnter={(e) => handleShowTooltip('Manajer Asset Media', e)}
              onMouseLeave={handleHideTooltip}
              onTouchStart={(e) => handleShowTooltip('Manajer Asset Media', e)}
              onFocus={(e) => handleShowTooltip('Manajer Asset Media', e)}
              onBlur={handleHideTooltip}
              className={`tap flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeView === 'assets'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-950/40'
                  : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-zinc-300 hover:text-white hover:from-zinc-700/80'
              }`}
            >
              <FolderOpen className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="hidden sm:inline">Aset</span>
            </button>

            {/* Timeline Toggle */}
            <button
              type="button"
              onClick={onToggleTimeline}
              onMouseEnter={(e) => handleShowTooltip(isTimelineVisible ? 'Sembunyikan Track Timeline' : 'Tampilkan Track Timeline', e)}
              onMouseLeave={handleHideTooltip}
              onTouchStart={(e) => handleShowTooltip(isTimelineVisible ? 'Sembunyikan Track Timeline' : 'Tampilkan Track Timeline', e)}
              onFocus={(e) => handleShowTooltip(isTimelineVisible ? 'Sembunyikan Track Timeline' : 'Tampilkan Track Timeline', e)}
              onBlur={handleHideTooltip}
              className={`tap flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isTimelineVisible
                  ? 'bg-gradient-to-r from-red-950/90 via-rose-900/80 to-red-900/90 text-rose-200 shadow-md'
                  : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className={`w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0 ${isTimelineVisible ? 'text-rose-400' : 'text-zinc-400'}`} />
              <span className="hidden sm:inline">Timeline</span>
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isTimelineVisible ? 'bg-red-400' : 'bg-zinc-600'
                }`}
              />
            </button>

            {/* Chat History / Sessions */}
            <button
              type="button"
              onClick={onOpenChatHistory}
              onMouseEnter={(e) => handleShowTooltip(`Riwayat Percakapan (${sessionsCount} Sesi)`, e)}
              onMouseLeave={handleHideTooltip}
              onTouchStart={(e) => handleShowTooltip(`Riwayat Percakapan (${sessionsCount} Sesi)`, e)}
              onFocus={(e) => handleShowTooltip(`Riwayat Percakapan (${sessionsCount} Sesi)`, e)}
              onBlur={handleHideTooltip}
              className="tap flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 hover:from-zinc-700/80 text-xs font-medium text-zinc-300 hover:text-white transition-all relative"
            >
              <MessageSquare className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-zinc-400 shrink-0" />
              <span className="hidden sm:inline">Riwayat</span>
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
              onMouseEnter={(e) => handleShowTooltip('Tentang Males Ngonten Studio', e)}
              onMouseLeave={handleHideTooltip}
              onTouchStart={(e) => handleShowTooltip('Tentang Males Ngonten Studio', e)}
              onFocus={(e) => handleShowTooltip('Tentang Males Ngonten Studio', e)}
              onBlur={handleHideTooltip}
              className="tap flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 hover:from-zinc-700/80 text-xs font-medium text-zinc-300 hover:text-white transition-all"
            >
              <Info className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-zinc-400 shrink-0" />
              <span className="hidden sm:inline">Tentang</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
