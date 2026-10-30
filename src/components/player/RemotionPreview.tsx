import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import {
  Play,
  Pause,
  Maximize2,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { TimelineData, TimelineClip } from '../../types';
import { ShortVideoComposition } from '../../remotion/ShortVideoComposition';

interface RemotionPreviewProps {
  timeline: TimelineData;
  currentFrame: number;
  onFrameUpdate: (frame: number) => void;
  isPlaying: boolean;
  onPlayPauseToggle: () => void;
  selectedClipId: string | null;
  onSelectClip: (layerId: string, clipId: string) => void;
  onUpdateClipPosition?: (layerId: string, clipId: string, x: number, y: number) => void;
  onPromptElementAction?: (elementName: string, defaultAction: string) => void;
  isTimelineOpen?: boolean;
  onToggleTimeline?: () => void;
}

export const RemotionPreview: React.FC<RemotionPreviewProps> = ({
  timeline,
  currentFrame,
  onFrameUpdate,
  isPlaying,
  onPlayPauseToggle,
  selectedClipId,
  onSelectClip,
  onUpdateClipPosition,
  onPromptElementAction,
  isTimelineOpen,
  onToggleTimeline,
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoFrameRef = useRef<HTMLDivElement>(null);
  const isInternalUpdateRef = useRef(false);
  const lastFrameRef = useRef(-1);

  // Dragging state on canvas
  const [draggingClip, setDraggingClip] = useState<{
    layerId: string;
    clipId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Sync external seek (timeline scrub) to playerRef
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    if (!playerRef.current) return;
    try {
      const current = Math.round(playerRef.current.getCurrentFrame());
      if (current !== currentFrame) {
        lastFrameRef.current = currentFrame;
        playerRef.current.seekTo(currentFrame);
      }
    } catch {
      // player mounting
    }
  }, [currentFrame]);

  // Sync play/pause state
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      if (isPlaying && !playerRef.current.isPlaying()) {
        playerRef.current.play();
      } else if (!isPlaying && playerRef.current.isPlaying()) {
        playerRef.current.pause();
      }
    } catch {
      // player playback
    }
  }, [isPlaying]);

  // Listen to frameupdate from player
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrame = (e: { detail: { frame: number } }) => {
      const rounded = Math.round(e.detail.frame);
      if (rounded !== lastFrameRef.current) {
        lastFrameRef.current = rounded;
        isInternalUpdateRef.current = true;
        onFrameUpdate(rounded);
      }
    };

    player.addEventListener('frameupdate', onFrame);
    return () => {
      player.removeEventListener('frameupdate', onFrame);
    };
  }, [onFrameUpdate]);

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen?.();
    }
  }, []);

  // Format time display
  const currentSec = (currentFrame / timeline.fps).toFixed(2);
  const totalSec = (timeline.durationInFrames / timeline.fps).toFixed(2);
  const progressPercent = Math.min(100, (currentFrame / (timeline.durationInFrames - 1 || 1)) * 100);

  // Active text clips at current frame that can be dragged
  const activeTextClips: { layerId: string; clip: TimelineClip }[] = [];
  timeline.layers
    .filter((l) => l.type === 'text')
    .forEach((layer) => {
      layer.clips.forEach((clip) => {
        if (currentFrame >= clip.from && currentFrame < clip.from + clip.duration) {
          activeTextClips.push({ layerId: layer.id, clip });
        }
      });
    });

  // On-Canvas Drag Handlers
  const handlePointerDown = (
    e: React.PointerEvent,
    layerId: string,
    clip: TimelineClip
  ) => {
    if (!videoFrameRef.current || !onUpdateClipPosition) return;
    e.stopPropagation();
    e.preventDefault();

    onSelectClip(layerId, clip.id);

    const initialX = clip.props?.x ?? 50;
    const initialY = clip.props?.y ?? 50;

    setDraggingClip({
      layerId,
      clipId: clip.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX,
      initialY,
      currentX: initialX,
      currentY: initialY,
    });

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture fallback
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingClip || !videoFrameRef.current || !onUpdateClipPosition) return;
    e.stopPropagation();
    e.preventDefault();

    const rect = videoFrameRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaPixelX = e.clientX - draggingClip.startX;
    const deltaPixelY = e.clientY - draggingClip.startY;

    const deltaPercentX = (deltaPixelX / rect.width) * 100;
    const deltaPercentY = (deltaPixelY / rect.height) * 100;

    let nextX = Math.round(draggingClip.initialX + deltaPercentX);
    let nextY = Math.round(draggingClip.initialY + deltaPercentY);

    // Snap to horizontal / vertical center
    if (Math.abs(nextX - 50) < 3) nextX = 50;
    if (Math.abs(nextY - 50) < 3) nextY = 50;

    // Constrain within frame bounds
    nextX = Math.max(5, Math.min(95, nextX));
    nextY = Math.max(5, Math.min(95, nextY));

    setDraggingClip((prev) => (prev ? { ...prev, currentX: nextX, currentY: nextY } : null));
    onUpdateClipPosition(draggingClip.layerId, draggingClip.clipId, nextX, nextY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingClip) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Fallback
      }
      setDraggingClip(null);
    }
  };

  // Scrubber bar seek
  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const frame = parseInt(e.target.value, 10);
    onFrameUpdate(frame);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-[#050507] select-none relative overflow-hidden"
    >
      {/* Video Viewport Area with Ambient Glow */}
      <div className="flex-1 relative flex items-center justify-center p-3 sm:p-4 min-h-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#09090b] to-[#050507]">
        {/* Aspect Ratio 9:16 Canvas Frame */}
        <div
          ref={videoFrameRef}
          className="h-full aspect-[9/16] bg-black shadow-2xl relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 ring-1 ring-white/5"
          style={{ maxHeight: '100%' }}
        >
          {/* Remotion Player Engine */}
          <Player
            ref={playerRef}
            component={ShortVideoComposition}
            inputProps={{ timeline }}
            durationInFrames={timeline.durationInFrames}
            fps={timeline.fps}
            compositionWidth={timeline.width}
            compositionHeight={timeline.height}
            style={{
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
            controls={false}
            autoPlay={false}
            loop
          />

          {/* Interactive Drag & Drop Hit Target on Active Elements (pure video, zero HUD/instruction clutter) */}
          {!isPlaying &&
            activeTextClips.map(({ layerId, clip }) => {
              const isSelected = selectedClipId === clip.id;
              const posX = clip.props?.x ?? 50;
              const posY = clip.props?.y ?? 50;

              return (
                <div
                  key={clip.id}
                  onPointerDown={(e) => handlePointerDown(e, layerId, clip)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={{
                    position: 'absolute',
                    top: `${posY}%`,
                    left: `${posX}%`,
                    transform: 'translate(-50%, -50%)',
                    touchAction: 'none',
                  }}
                  className={`cursor-move select-none z-30 ${
                    isSelected
                      ? 'ring-1 ring-[#e5484d]/40 rounded-lg'
                      : 'hover:ring-1 hover:ring-white/20 rounded-lg'
                  }`}
                >
                  <div className="p-1 relative">
                    {/* Invisible hit target matching text area */}
                    <div className="opacity-0 pointer-events-none text-center px-3 py-1 font-bold text-sm whitespace-nowrap">
                      {clip.props?.text || clip.name}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Floating Glass Control Dock - Kapsul & Gradasi Jelas Tanpa Border */}
      <div className="h-12 px-3 sm:px-4 bg-gradient-to-t from-[#0e0e14]/95 via-[#0c0c10]/90 to-transparent backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-20">
        {/* Left: Play/Pause & Timing (Kapsul Bulat) */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onPlayPauseToggle}
            className="tap w-8 h-8 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 flex items-center justify-center text-white active:scale-95 transition-all shadow-md shadow-red-950/50 shrink-0"
            aria-label={isPlaying ? 'Jeda video' : 'Putar video'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Time indicator (Kapsul) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-zinc-900/90 to-zinc-800/80 text-xs font-mono tabular-nums text-zinc-300 shadow-xs">
            <span className="font-bold text-white">{currentSec}s</span>
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-400">{totalSec}s</span>
          </div>
        </div>

        {/* Center: Slim Timeline Scrubber (Kapsul) */}
        <div className="flex-1 max-w-xs sm:max-w-md mx-2 flex items-center">
          <input
            type="range"
            min={0}
            max={Math.max(1, timeline.durationInFrames - 1)}
            value={currentFrame}
            onChange={handleScrubberChange}
            className="w-full h-1.5 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-full appearance-none cursor-pointer accent-red-500 hover:h-2 transition-all shadow-inner"
            title="Geser timeline frame"
          />
        </div>

        {/* Right: Quick actions (Semua Kapsul & Gradasi) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleTimeline && (
            <button
              type="button"
              onClick={onToggleTimeline}
              title={isTimelineOpen ? 'Sembunyikan Timeline Track' : 'Tampilkan Timeline Track'}
              className={`tap px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all ${
                isTimelineOpen
                  ? 'bg-gradient-to-r from-red-950/90 via-rose-900/80 to-red-900/90 text-rose-200 shadow-md'
                  : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className={`w-3.5 h-3.5 ${isTimelineOpen ? 'text-rose-400' : 'text-zinc-400'}`} />
              <span className="hidden xs:inline">{isTimelineOpen ? 'Track' : 'Track'}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isTimelineOpen ? 'bg-red-400' : 'bg-zinc-600'
                }`}
              />
            </button>
          )}

          <button
            type="button"
            onClick={() => onFrameUpdate(0)}
            title="Reset ke awal (Frame 0)"
            className="tap w-8 h-8 rounded-full bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 hover:from-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleFullscreen}
            title="Mode Layar Penuh"
            className="tap w-8 h-8 rounded-full bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 hover:from-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white shadow-xs transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
